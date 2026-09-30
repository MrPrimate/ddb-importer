const state = vi.hoisted(() => ({
  tiers: { all: true } as Record<string, boolean>,
  custom: false,
  monsterSources: [] as Record<string, unknown>[],
  fetchMonsters: vi.fn(),
}));

vi.mock("../../../src/lib/_module", () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), verbose: vi.fn() },
  utils: {},
  PatreonHelper: { checkPatreon: async () => state.tiers },
  DDBProxy: { isCustom: () => state.custom, getProxy: () => "https://proxy.example" },
  fetchJson: vi.fn(),
  DDBRunContext: { keyPostfix: null, ignoreEnrichedImages: false },
}));
vi.mock("../../../src/config/_module", () => ({ DICTIONARY: {} }));
vi.mock("../../../src/parser/DDBMonster", () => ({ default: class {} }));
vi.mock("../../../src/parser/DDBMonsterFactory", () => ({
  default: class {
    static defaultFetchOptions(ids: number[]) {
      return { ids };
    }

    source = state.monsterSources;
    fetchDDBMonsterSourceData = state.fetchMonsters;
  },
}));
vi.mock("../../../src/parser/monster/features/DDBMonsterFeatureFactory", () => ({ default: class {} }));
vi.mock("../../../src/parser/monster/templates/monster", () => ({ newNPC: vi.fn() }));
vi.mock("../../../src/parser/enrichers/_module", () => ({ DDBMonsterFeatureEnricher: class {} }));
vi.mock("../../../src/parser/activities/_module", () => ({ DDBMonsterFeatureActivity: class {} }));

import DDBCompanionMixin from "../../../src/parser/companions/DDBCompanionMixin";

const ACTOR_SNIP: IDDBImageSnip = {
  url: "https://media.dndbeyond.com/art/page.png", sourceWidth: 1000, sourceHeight: 1400, rotation: -12,
  centerX: 500, centerY: 600, width: 600, height: 800, shape: "rectangle",
};
const TOKEN_SNIP: IDDBImageSnip = { ...ACTOR_SNIP, centerY: 300, width: 300, height: 300, shape: "circle" };

function doc(name: string) {
  return { name, flags: {} } as unknown as I5eMonsterData;
}

function munchFlags(document: I5eMonsterData) {
  return foundry.utils.getProperty(document, "flags.monsterMunch") as Record<string, unknown>;
}

beforeEach(() => {
  state.tiers = { all: true };
  state.custom = false;
  state.monsterSources = [];
  state.fetchMonsters.mockReset();
  CONFIG.DDBI.EXTRA_IMAGES = {
    summons: {
      "Homunculus Servant": { actor: "https://ddb.example/servant.png", token: "https://ddb.example/servant-token.png" },
      "Conjured Air Elemental": { monsterIDs: [16774] },
    },
    snips: {
      "Homunculus Servant": { token: TOKEN_SNIP },
      "Aberrant Spirit": { actor: ACTOR_SNIP, token: TOKEN_SNIP },
      "Conjured Air Elemental": { actor: ACTOR_SNIP, token: TOKEN_SNIP },
    },
  };
});

describe("DDBCompanionMixin.findEnrichedEntry", () => {
  it("matches the exact name, then the name without its variant", () => {
    const entries = { "Aberrant Spirit": 1, "Aberrant Spirit (Slaad)": 2 };
    expect(DDBCompanionMixin.findEnrichedEntry(entries, "Aberrant Spirit (Slaad)")).toBe(2);
    expect(DDBCompanionMixin.findEnrichedEntry(entries, "Aberrant Spirit (Star Spawn)")).toBe(1);
    expect(DDBCompanionMixin.findEnrichedEntry(entries, "Beast")).toBeUndefined();
    expect(DDBCompanionMixin.findEnrichedEntry(undefined, "Beast")).toBeUndefined();
  });
});

describe("DDBCompanionMixin.addEnrichedImageData with snips", () => {
  it("lets a snip replace only the target it covers", async () => {
    const document = await DDBCompanionMixin.addEnrichedImageData(doc("Homunculus Servant"));
    expect(munchFlags(document)).toMatchObject({
      enrichedImages: true,
      img: "https://ddb.example/servant.png",
      tokenImg: TOKEN_SNIP.url,
      tokenImgSnip: TOKEN_SNIP,
    });
    expect(munchFlags(document).imgSnip).toBeUndefined();
  });

  it("applies a snip that has no summons entry, through the variant fallback", async () => {
    const document = await DDBCompanionMixin.addEnrichedImageData(doc("Aberrant Spirit (Slaad)"));
    expect(munchFlags(document)).toMatchObject({
      img: ACTOR_SNIP.url,
      imgSnip: ACTOR_SNIP,
      tokenImg: TOKEN_SNIP.url,
      tokenImgSnip: TOKEN_SNIP,
    });
  });

  it("skips the monster art fetch when both targets are snipped", async () => {
    const document = await DDBCompanionMixin.addEnrichedImageData(doc("Conjured Air Elemental"));
    expect(state.fetchMonsters).not.toHaveBeenCalled();
    expect(munchFlags(document).imgSnip).toEqual(ACTOR_SNIP);
  });

  it("applies a snip over monster art fetched by id", async () => {
    CONFIG.DDBI.EXTRA_IMAGES!.snips = { "Conjured Air Elemental": { token: TOKEN_SNIP } };
    state.monsterSources = [{ basicAvatarUrl: "https://ddb.example/air.png", avatarUrl: "https://ddb.example/air-token.png" }];
    const document = await DDBCompanionMixin.addEnrichedImageData(doc("Conjured Air Elemental"));
    expect(state.fetchMonsters).toHaveBeenCalled();
    expect(munchFlags(document)).toMatchObject({
      img: "https://ddb.example/air.png",
      tokenImg: TOKEN_SNIP.url,
      tokenImgSnip: TOKEN_SNIP,
    });
  });

  it("does nothing without the Patreon tier", async () => {
    state.tiers = { all: false };
    const document = await DDBCompanionMixin.addEnrichedImageData(doc("Aberrant Spirit"));
    expect(munchFlags(document)).toBeUndefined();
  });
});
