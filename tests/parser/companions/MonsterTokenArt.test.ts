const lib = vi.hoisted(() => ({
  compendium: null as any,
  keyPostfix: null as string | null,
}));
const factory = vi.hoisted(() => ({ source: [] as any[], fetch: vi.fn() }));

vi.mock("../../../src/lib/_module", () => ({
  CompendiumHelper: { getCompendiumType: () => lib.compendium },
  DDBRunContext: { get keyPostfix() { return lib.keyPostfix; } },
}));
vi.mock("../../../src/lib/Logger", () => ({ default: { warn: vi.fn(), debug: vi.fn() } }));
vi.mock("../../../src/lib/Utils", () => ({
  default: {
    normalizeString: (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ""),
    referenceNameString: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
    isDefaultOrPlaceholderImage: (img: string | null | undefined) => !img || img === "icons/svg/mystery-man.svg",
    getSetting: (key: string) => (key === "other-image-upload-directory" ? "[data] ddb-images/other" : false),
  },
}));
vi.mock("../../../src/parser/DDBMonster", () => ({ default: { STOCK_TYPE_IMAGES: ["https://ddb.example/stock/beast.jpg"] } }));
// the importer's image step is the unit under trust here: its path rules are pinned in
// tests/muncher/monsterTokenDownloadOptions.test.ts
const importer = vi.hoisted(() => ({
  standIns: [] as any[],
  getNPCImage: vi.fn(),
  tokenFiles: { downloaded: null as string | null, tokenized: null as string | null },
}));
vi.mock("../../../src/muncher/DDBMonsterImporter", () => ({
  default: class {
    monster: any;
    type: string;
    tokenFiles = importer.tokenFiles;
    constructor({ monster, type }: { monster: any; type: string }) {
      this.monster = monster;
      this.type = type;
      importer.standIns.push({ monster, type });
    }

    getNPCImage = () => importer.getNPCImage(this.monster);
  },
}));
vi.mock("../../../src/parser/monster/templates/monster", () => ({
  newNPC: (name: string) => ({ name, system: {}, flags: {}, prototypeToken: { texture: { src: null } } }),
}));
vi.mock("../../../src/parser/monster/source", () => ({
  resolveMonsterSource: (source: { sourceId: number }) => ({
    source: { book: source.sourceId < 145 ? "Basic Rules (2014)" : "Monster Manual" },
    is2014: source.sourceId < 145,
  }),
}));
vi.mock("../../../src/parser/DDBMonsterFactory", () => ({
  default: class {
    source = factory.source;
    fetchDDBMonsterSourceData = factory.fetch;
  },
}));

const requestTokenImages = vi.fn();

/** A fresh module per test: the resolver remembers each lookup for the page load. */
async function resolver() {
  vi.resetModules();
  return (await import("../../../src/parser/companions/types/MonsterTokenArt")).resolveMonsterTokenArt;
}

function compendiumOf(entries: { name: string; rules: string; src: string }[]) {
  return {
    getIndex: vi.fn(),
    index: entries.map((e) => ({ name: e.name, system: { source: { rules: e.rules } }, prototypeToken: { texture: { src: e.src } } })),
  };
}

beforeEach(() => {
  lib.compendium = null;
  lib.keyPostfix = null;
  importer.standIns = [];
  importer.getNPCImage.mockReset();
  importer.tokenFiles.downloaded = null;
  importer.tokenFiles.tokenized = null;
  factory.fetch.mockReset();
  factory.source = [];
  (globalThis as any).game = { user: { isGM: true }, modules: new Map() };
  (globalThis as any).foundry = {
    utils: {
      getProperty: (object: any, path: string) => path.split(".").reduce((o, k) => o?.[k], object),
      setProperty: (object: any, path: string, value: unknown) => {
        const keys = path.split(".");
        const last = keys.pop() as string;
        keys.reduce((o, k) => (o[k] ??= {}), object)[last] = value;
      },
    },
  };
  (globalThis as any).CONFIG = {
    ux: { FilePicker: { requestTokenImages: requestTokenImages } },
    DDBI: { KNOWN: { TOKEN_LOOKUPS: new Map() } },
    DDB: { monsterTypes: [{ id: 2, name: "Beast" }] },
    DND5E: { creatureTypes: { beast: {} } },
  };
});

describe("resolveMonsterTokenArt", () => {
  it("uses the munched monster's own token, preferring the requested ruleset", async () => {
    lib.compendium = compendiumOf([
      { name: "Bat", rules: "2014", src: "tokens/bat-2014.webp" },
      { name: "Bat", rules: "2024", src: "tokens/bat-2024.webp" },
      { name: "Giant Bat", rules: "2024", src: "tokens/giant-bat.webp" },
    ]);
    const resolve = await resolver();
    expect(await resolve({ name: "Bat", is2014: false })).toBe("tokens/bat-2024.webp");
    expect(await resolve({ name: "Bat", is2014: true })).toBe("tokens/bat-2014.webp");
    expect(factory.fetch).not.toHaveBeenCalled();
  });

  it("asks the server for the files behind a munched monster's wildcard token", async () => {
    lib.compendium = { ...compendiumOf([{ name: "Wolf", rules: "2024", src: "tokens/wolf/*" }]), collection: "world.ddb-monsters" };
    lib.compendium.index[0]._id = "wolfActorId00000";
    requestTokenImages.mockResolvedValue(["tokens/wolf/wolf-1.webp", "tokens/wolf/wolf-2.webp"]);
    const resolve = await resolver();

    expect(await resolve({ name: "Wolf", is2014: false })).toBe("tokens/wolf/wolf-1.webp");
    expect(requestTokenImages).toHaveBeenCalledWith("wolfActorId00000", { pack: "world.ddb-monsters" });
    expect(factory.fetch).not.toHaveBeenCalled();
  });

  it("puts a stand-in for an unmunched monster through the importer's image step", async () => {
    lib.compendium = compendiumOf([{ name: "Rat", rules: "2024", src: "icons/svg/mystery-man.svg" }]);
    factory.source = [
      { id: 1, name: "Wolf", sourceId: 1, typeId: 2, avatarUrl: "https://ddb.example/wolf-2014.png" },
      { id: 2, name: "Wolf", sourceId: 146, typeId: 2, avatarUrl: "https://ddb.example/wolf-2024.png", basicAvatarUrl: "https://ddb.example/wolf-2024-full.png" },
      { id: 3, name: "Dire Wolf", sourceId: 146, typeId: 2, avatarUrl: "https://ddb.example/dire-wolf.png" },
    ];
    // the image step downloads (deep paths, wildcards) and tokenizes, then points the prototype token at the result
    importer.getNPCImage.mockImplementation(async (monster: any) => {
      monster.prototypeToken.texture.src = "ddb-images/other/monster/token/beast/Wolf-2024-monstermanual.Token.webp";
    });
    const resolve = await resolver();

    expect(await resolve({ name: "Wolf", is2014: false })).toBe("ddb-images/other/monster/token/beast/Wolf-2024-monstermanual.Token.webp");
    expect(factory.fetch).toHaveBeenCalledWith(expect.objectContaining({ searchTerm: "Wolf", exactMatch: true, sources: [], monsterTypes: [] }));
    expect(importer.standIns).toHaveLength(1);
    // typed "monsters" and filed as the 2024 Wolf, so the files are the ones its own munch makes
    expect(importer.standIns[0]).toMatchObject({
      type: "monsters",
      monster: {
        name: "Wolf",
        system: { details: { type: { value: "beast" } }, source: { book: "Monster Manual", rules: "2024" } },
        flags: { monsterMunch: { img: "https://ddb.example/wolf-2024-full.png", tokenImg: "https://ddb.example/wolf-2024.png", isStockImg: false } },
      },
    });

    // remembered for the page load
    await resolve({ name: "Wolf", is2014: false });
    expect(factory.fetch).toHaveBeenCalledTimes(1);
  });

  it("takes the tokenized file, then the download, when the prototype token is a wildcard folder", async () => {
    lib.compendium = compendiumOf([]);
    factory.source = [{ id: 2, name: "Wolf", sourceId: 146, typeId: 2, avatarUrl: "https://ddb.example/wolf.png" }];
    importer.getNPCImage.mockImplementation(async (monster: any) => {
      monster.prototypeToken.texture.src = "tokens/beast/wolf/*";
    });
    importer.tokenFiles.downloaded = "tokens/beast/wolf/2024-monstermanual-wolf.webp";
    let resolve = await resolver();
    expect(await resolve({ name: "Wolf", is2014: false })).toBe("tokens/beast/wolf/2024-monstermanual-wolf.webp");

    importer.tokenFiles.tokenized = "tokens/beast/wolf/Wolf-2024-monstermanual.Token.webp";
    resolve = await resolver();
    expect(await resolve({ name: "Wolf", is2014: false })).toBe("tokens/beast/wolf/Wolf-2024-monstermanual.Token.webp");
  });

  it("returns null for stock art, an unknown creature, a player without a key, or no compendium", async () => {
    lib.compendium = compendiumOf([]);
    factory.source = [{ name: "Swan", sourceId: 146, typeId: 2, avatarUrl: "https://ddb.example/stock/beast.jpg" }];
    let resolve = await resolver();
    expect(await resolve({ name: "Swan", is2014: false })).toBeNull();
    expect(await resolve({ name: "Unicorn Cat", is2014: false })).toBeNull();

    (globalThis as any).game.user.isGM = false;
    factory.fetch.mockClear();
    resolve = await resolver();
    expect(await resolve({ name: "Wolf", is2014: false })).toBeNull();
    expect(factory.fetch).not.toHaveBeenCalled();

    // no monster compendium (the audit harness): no lookup of any kind
    (globalThis as any).game.user.isGM = true;
    lib.compendium = null;
    resolve = await resolver();
    expect(await resolve({ name: "Wolf", is2014: false })).toBeNull();
    expect(factory.fetch).not.toHaveBeenCalled();
  });
});
