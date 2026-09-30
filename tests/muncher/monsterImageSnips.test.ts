const settings = vi.hoisted(() => ({ values: {} as Record<string, unknown> }));
const files = vi.hoisted(() => ({ getImagePath: vi.fn() }));

vi.mock("../../src/lib/_module", async () => {
  const { default: ImageSnipper } = await vi.importActual<typeof import("../../src/lib/ImageSnipper")>("../../src/lib/ImageSnipper");
  return {
    logger: { debug: vi.fn(), warn: vi.fn(), verbose: vi.fn() },
    utils: {
      getSetting: (key: string) => settings.values[key],
      referenceNameString: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      normalizeString: (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ""),
      isDefaultOrPlaceholderImage: () => true,
      munchNote: vi.fn(),
    },
    Iconizer: {},
    DDBItemImporter: class {},
    DDBEffectImporter: {},
    FileHelper: files,
    CompendiumHelper: {},
    ImageSnipper,
  };
});

import DDBMonsterImporter from "../../src/muncher/DDBMonsterImporter";

const AVATAR_URL = "https://media.dndbeyond.com/art/servant.png";
const TOKEN_URL = "https://media.dndbeyond.com/art/servant-token.png";

const AVATAR_SNIP: IDDBImageSnip = {
  url: AVATAR_URL, sourceWidth: 1000, sourceHeight: 1400, rotation: -12,
  centerX: 500, centerY: 600, width: 600, height: 800, shape: "rectangle",
};
const TOKEN_SNIP: IDDBImageSnip = {
  url: TOKEN_URL, sourceWidth: 800, sourceHeight: 800, rotation: 0,
  centerX: 400, centerY: 300, width: 300, height: 300, shape: "square", maxSize: 400,
};

function monster(monsterMunch: Record<string, unknown>) {
  return {
    name: "Homunculus Servant",
    img: "icons/svg/mystery-man.svg",
    type: "npc",
    system: { details: { type: { value: "construct" } }, source: { rules: "2024", book: "TCoE" } },
    prototypeToken: { texture: { src: "icons/svg/mystery-man.svg" } },
    flags: { monsterMunch },
  } as unknown as I5eMonsterData;
}

beforeEach(() => {
  settings.values = {
    "other-image-upload-directory": "[data] ddb-images/other",
    "munching-policy-update-existing": false,
  };
  foundry.utils.setProperty(CONFIG, "DDBI.KNOWN.AVATAR_LOOKUPS", new Map());
  foundry.utils.setProperty(CONFIG, "DDBI.KNOWN.TOKEN_LOOKUPS", new Map());
  foundry.utils.setProperty(CONFIG, "DND5E.defaultArtwork.Actor", { npc: "icons/svg/mystery-man.svg" });
  files.getImagePath.mockReset();
  files.getImagePath.mockImplementation(async (url: string, options: { snip?: IDDBImageSnip | null }) =>
    `ddb-images/other/${options.snip ? "cut-" : ""}${url.split("/").pop()}`);
});

describe("DDBMonsterImporter.getNPCImage with image snips", () => {
  it("passes each target's snip to the download", async () => {
    const importer = new DDBMonsterImporter({
      monster: monster({ img: AVATAR_URL, tokenImg: TOKEN_URL, imgSnip: AVATAR_SNIP, tokenImgSnip: TOKEN_SNIP }),
      type: "monsters",
    });
    await importer.getNPCImage();

    expect(files.getImagePath).toHaveBeenCalledTimes(2);
    expect(files.getImagePath.mock.calls[0][0]).toBe(AVATAR_URL);
    expect(files.getImagePath.mock.calls[0][1].snip).toEqual(AVATAR_SNIP);
    expect(files.getImagePath.mock.calls[1][0]).toBe(TOKEN_URL);
    expect(files.getImagePath.mock.calls[1][1].snip).toEqual(TOKEN_SNIP);
    expect(importer.monster.img).toBe("ddb-images/other/cut-servant.png");
    expect(importer.monster.prototypeToken?.texture?.src).toBe("ddb-images/other/cut-servant-token.png");
  });

  it("downloads plain art without a snip", async () => {
    const importer = new DDBMonsterImporter({
      monster: monster({ img: AVATAR_URL, tokenImg: TOKEN_URL }),
      type: "monsters",
    });
    await importer.getNPCImage();
    expect(files.getImagePath.mock.calls.map((call) => call[1].snip)).toEqual([null, null]);
  });

  it("carries the avatar's snip to the token when there is no token art", async () => {
    const importer = new DDBMonsterImporter({
      monster: monster({ img: AVATAR_URL, imgSnip: AVATAR_SNIP }),
      type: "monsters",
    });
    await importer.getNPCImage();
    expect(files.getImagePath.mock.calls[1][0]).toBe(AVATAR_URL);
    expect(files.getImagePath.mock.calls[1][1].snip).toEqual(AVATAR_SNIP);
  });

  it("swaps the snip with the url when the token art is used as the avatar", async () => {
    settings.values["munching-policy-use-token-avatar-image"] = true;
    const importer = new DDBMonsterImporter({
      monster: monster({ img: AVATAR_URL, tokenImg: TOKEN_URL, imgSnip: AVATAR_SNIP, tokenImgSnip: TOKEN_SNIP }),
      type: "monsters",
    });
    await importer.getNPCImage();
    expect(files.getImagePath.mock.calls[0][0]).toBe(TOKEN_URL);
    expect(files.getImagePath.mock.calls[0][1].snip).toEqual(TOKEN_SNIP);
  });

  it("keeps two different cuts of one image apart in the session lookups", async () => {
    const first = new DDBMonsterImporter({
      monster: monster({ img: AVATAR_URL, tokenImg: AVATAR_URL, imgSnip: AVATAR_SNIP, tokenImgSnip: AVATAR_SNIP }),
      type: "monsters",
    });
    await first.getNPCImage();
    const second = new DDBMonsterImporter({
      monster: monster({ img: AVATAR_URL, tokenImg: AVATAR_URL, imgSnip: { ...AVATAR_SNIP, rotation: 5 } }),
      type: "monsters",
    });
    await second.getNPCImage();
    // the second avatar's cut differs, so it downloads again; its uncut token is new as well
    expect(files.getImagePath).toHaveBeenCalledTimes(4);
  });
});
