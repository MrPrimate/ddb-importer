import { addLanguages } from "../../../src/hooks/ready/addDDBConfig";
import { DICTIONARY } from "../../../src/config/_module";
import ProficiencyFinder from "../../../src/parser/lib/ProficiencyFinder";
import { setMockSettings } from "../../_setup/foundryMocks";

const globals: any = globalThis;

describe("addLanguages", () => {
  let dictionaryLength: number;
  let originalLanguages: unknown;
  let originalDDB: unknown;

  beforeEach(() => {
    dictionaryLength = DICTIONARY.actor.languages.length;
    originalLanguages = globals.CONFIG.DND5E.languages;
    originalDDB = globals.CONFIG.DDB;
    // the shape Heroes of Faerun registers at init
    globals.CONFIG.DND5E.languages = {
      standard: {
        label: "Standard",
        children: {
          common: "Common",
          faerun: { label: "Faerun", selectable: false, children: { chondathan: "Chondathan" } },
        },
      },
    };
    globals.CONFIG.DDB = {
      ...(globals.CONFIG.DDB ?? {}),
      languages: [{ id: 900, name: "Chondathan" }, { id: 901, name: "Ancient Whalesong" }],
    };
  });

  afterEach(() => {
    DICTIONARY.actor.languages.splice(dictionaryLength);
    globals.CONFIG.DND5E.languages = originalLanguages;
    globals.CONFIG.DDB = originalDDB;
  });

  it("maps DDB languages a module registers to that key, with its advancement path", () => {
    setMockSettings({ "add-ddb-languages": true });
    addLanguages();
    const chondathan = DICTIONARY.actor.languages.find((l) => l.name === "Chondathan");
    expect(chondathan).toMatchObject({ value: "chondathan", advancement: "standard:faerun" });
    expect(globals.CONFIG.DND5E.languages.ddb.children).toEqual({ ancientwhalesong: "Ancient Whalesong" });
    expect(ProficiencyFinder.getMappedLanguage({ name: "Chondathan" })).toBe("chondathan");
  });

  it("maps module languages even when the rare language group is off", () => {
    setMockSettings({ "add-ddb-languages": false });
    addLanguages();
    expect(globals.CONFIG.DND5E.languages.ddb).toBeUndefined();
    expect(DICTIONARY.actor.languages.find((l) => l.name === "Chondathan")?.value).toBe("chondathan");
    expect(DICTIONARY.actor.languages.find((l) => l.name === "Ancient Whalesong")).toBeUndefined();
  });
});
