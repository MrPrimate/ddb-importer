const settings = vi.hoisted(() => ({ values: {} as Record<string, unknown> }));

vi.mock("../../src/lib/_module", () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), verbose: vi.fn() },
  utils: {
    getSetting: (key: string) => settings.values[key],
    referenceNameString: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  },
  Iconizer: {},
  DDBItemImporter: {},
  DDBEffectImporter: {},
  FileHelper: {},
  CompendiumHelper: {},
}));

import DDBMonsterImporter from "../../src/muncher/DDBMonsterImporter";

const WOLF = {
  tokenUrl: "https://ddb.example/avatars/wolf.png",
  monsterName: "Dire Wolf",
  npcType: "beast",
  subType: "beast",
  rules: "2024",
  book: "monstermanual",
};

beforeEach(() => {
  settings.values = {
    "other-image-upload-directory": "/[data] ddb-images/other/",
    "munching-policy-monster-wildcard": false,
    "use-deep-file-paths": false,
  };
});

describe("DDBMonsterImporter.tokenDownloadOptions", () => {
  it("files a token flat, with the type in the file name, when deep paths are off", () => {
    expect(DDBMonsterImporter.tokenDownloadOptions(WOLF)).toEqual({
      type: "npc-token",
      name: "dire-wolf",
      download: true,
      remoteImages: false,
      force: false,
      imageNamePrefix: "2024-monstermanual-npc-token",
      pathPostfix: "",
      targetDirectory: "[data] ddb-images/other",
    });
  });

  it("files a token under the creature type folder with deep paths", () => {
    settings.values["use-deep-file-paths"] = true;
    expect(DDBMonsterImporter.tokenDownloadOptions(WOLF)).toMatchObject({
      imageNamePrefix: "2024-monstermanual",
      pathPostfix: "/monster/token/beast",
    });
  });

  it("gives a wildcard token its own folder, unless the tokenizer is building the pool", () => {
    settings.values["munching-policy-monster-wildcard"] = true;
    expect(DDBMonsterImporter.tokenDownloadOptions(WOLF)).toMatchObject({
      imageNamePrefix: "2024-monstermanual",
      pathPostfix: "/monster/token/beast/dire-wolf",
    });
    expect(DDBMonsterImporter.tokenDownloadOptions({ ...WOLF, useTokenizer: true }).pathPostfix).toBe("/monster/token/beast");
  });

  it("names a stock or type image after the creature type", () => {
    expect(DDBMonsterImporter.tokenDownloadOptions({ ...WOLF, isStock: true })).toMatchObject({
      type: "npc-generic-token",
      name: "beast",
      imageNamePrefix: "2024-monstermanual-npc-generic-token",
    });
    expect(DDBMonsterImporter.tokenDownloadOptions({ ...WOLF, tokenUrl: "https://ddb.example/types/beast.jpg" }).name).toBe("beast");
  });
});
