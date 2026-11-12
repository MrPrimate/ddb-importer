import SystemHelpers from "../../../src/parser/lib/SystemHelpers";

const globals: any = globalThis;

describe("language tree", () => {
  let originalLanguages: unknown;

  beforeEach(() => {
    originalLanguages = globals.CONFIG.DND5E.languages;
  });

  afterEach(() => {
    globals.CONFIG.DND5E.languages = originalLanguages;
  });

  const modern = {
    standard: { label: "Standard", selectable: false, children: { common: "Common", draconic: "Draconic" } },
    exotic: {
      label: "Rare",
      selectable: false,
      children: {
        cant: "Thieves' Cant",
        druidic: "Druidic",
        primordial: { label: "Primordial", children: { ignan: "Ignan" } },
      },
    },
  };

  // the moves dnd5e's applyLegacyRules makes
  const legacy = {
    standard: { label: "Standard", selectable: false, children: { common: "Common" } },
    exotic: {
      label: "Exotic",
      selectable: false,
      children: { draconic: "Draconic", primordial: { label: "Primordial", children: { ignan: "Ignan" } } },
    },
    cant: "Thieves' Cant",
    druidic: "Druidic",
  };

  it("maps every key to its parent path and whether it can be picked", () => {
    globals.CONFIG.DND5E.languages = modern;
    const tree = SystemHelpers.languageTree();
    expect(tree.get("ignan")).toEqual({ parents: "exotic:primordial", selectable: true });
    expect(tree.get("exotic")).toEqual({ parents: "", selectable: false });
    expect(tree.get("primordial")).toEqual({ parents: "exotic", selectable: true });
    expect(tree.get("orcish")).toBeUndefined();
  });

  it("builds trait keys from the live tree, so legacy rules move Druidic, Thieves' Cant and Draconic", () => {
    const druidic = { value: "druidic", advancement: "exotic" };
    const cant = { value: "cant", advancement: "exotic" };
    const draconic = { value: "draconic", advancement: "standard" };

    globals.CONFIG.DND5E.languages = modern;
    expect(SystemHelpers.languageTraitKey(druidic)).toBe("exotic:druidic");
    expect(SystemHelpers.languageTraitKey(cant)).toBe("exotic:cant");
    expect(SystemHelpers.languageTraitKey(draconic)).toBe("standard:draconic");

    globals.CONFIG.DND5E.languages = legacy;
    expect(SystemHelpers.languageTraitKey(druidic)).toBe("druidic");
    expect(SystemHelpers.languageTraitKey(cant)).toBe("cant");
    expect(SystemHelpers.languageTraitKey(draconic)).toBe("exotic:draconic");
  });

  it("falls back to the dictionary group for a language dnd5e does not list", () => {
    globals.CONFIG.DND5E.languages = modern;
    expect(SystemHelpers.languageTraitKey({ value: "whalesong", advancement: "ddb" })).toBe("ddb:whalesong");
    expect(SystemHelpers.languageTraitKey({ value: "whalesong", advancement: "" })).toBe("whalesong");
    globals.CONFIG.DND5E.languages = undefined;
    expect(SystemHelpers.languageTraitKey({ value: "druidic", advancement: "exotic" })).toBe("exotic:druidic");
  });
});
