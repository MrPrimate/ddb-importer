import fs from "node:fs/promises";
import path from "node:path";
import prettier from "prettier";

import realConfig from "../../data/fallback-config.json";
import {
  applyOmissions,
  applyRedactions,
  collectDescriptionShapes,
  collectRedactions,
  describeNewDescriptions,
  displayPath,
  mergeTopLevelKeys,
  summariseDiff,
  toPrettyJson,
} from "../../tools/ddb-config-transform.mjs";

// A miniature stand-in for the shipped config: one key where every description
// is blanked, one with a partial blanking, one with a nested description, and a
// number array that must be walked without exploding.
function makeCurrent(): any {
  return {
    activationTypes: [
      { id: 1, name: "Action", description: "" },
      { id: 2, name: "Bonus Action", description: "" },
    ],
    weaponProperties: [
      { id: 1, name: "Ammunition", description: "You can use a weapon..." },
      { id: 16, name: "Misfire", description: "" },
    ],
    sourceCategories: [{ id: 28, name: "Internal", description: null }],
    conditions: [{ definition: { id: 1, name: "Blinded", description: "<p>You cannot see.</p>" } }],
    diceValues: [4, 6, 8],
    vehicleConfiguration: null,
  };
}

describe("collectRedactions", () => {
  it("finds blank and null descriptions and ignores populated ones", () => {
    const redactions = collectRedactions(makeCurrent());
    expect(redactions.map((r: any) => r.display)).toEqual([
      "activationTypes[id=1].description",
      "activationTypes[id=2].description",
      "weaponProperties[id=16].description",
      "sourceCategories[id=28].description",
    ]);
    expect(redactions.find((r: any) => r.display === "sourceCategories[id=28].description").value).toBeNull();
  });

  it("walks nested definition objects", () => {
    const current = makeCurrent();
    current.conditions[0].definition.description = "";
    const redactions = collectRedactions(current);
    expect(redactions.map((r: any) => r.display)).toContain("conditions[definition.id=1].definition.description");
  });

  it("falls back to name then index when an entry has no id", () => {
    const redactions = collectRedactions({
      named: [{ name: "No Id", description: "" }],
      anonymous: [{ description: "" }],
    });
    expect(redactions.map((r: any) => r.display)).toEqual([
      "named[name=No Id].description",
      "anonymous[index=0].description",
    ]);
  });
});

describe("applyRedactions", () => {
  it("re-blanks matched entries and leaves other descriptions intact", () => {
    const redactions = collectRedactions(makeCurrent());
    const remote = {
      activationTypes: [
        // Deliberately reordered: matching is by id, not position.
        { id: 2, name: "Bonus Action", description: "A bonus action is..." },
        { id: 1, name: "Action", description: "On your turn you can..." },
      ],
      weaponProperties: [
        { id: 1, name: "Ammunition", description: "Fresh upstream text" },
        { id: 16, name: "Misfire", description: "Misfire text from DDB" },
      ],
      sourceCategories: [{ id: 28, name: "Internal", description: "Internal notes" }],
      conditions: [{ definition: { id: 1, name: "Blinded", description: "<p>You cannot see.</p>" } }],
    };

    const { applied, missing } = applyRedactions(remote, redactions);

    expect(applied.map((r: any) => r.display)).toEqual([
      "activationTypes[id=1].description",
      "activationTypes[id=2].description",
      "weaponProperties[id=16].description",
      "sourceCategories[id=28].description",
    ]);
    expect(missing).toEqual([]);
    expect(remote.activationTypes.map((e) => e.description)).toEqual(["", ""]);
    expect(remote.weaponProperties[1].description).toBe("");
    expect(remote.sourceCategories[0].description).toBeNull();
    // Untouched: never blanked in the committed file.
    expect(remote.weaponProperties[0].description).toBe("Fresh upstream text");
  });

  it("reports redactions whose entry has gone away", () => {
    const redactions = collectRedactions(makeCurrent());
    const { applied, missing } = applyRedactions({ activationTypes: [{ id: 1, description: "text" }] }, redactions);
    expect(applied.map((r: any) => r.display)).toEqual(["activationTypes[id=1].description"]);
    expect(missing.map((r: any) => r.display)).toEqual([
      "activationTypes[id=2].description",
      "weaponProperties[id=16].description",
      "sourceCategories[id=28].description",
    ]);
  });

  it("does not add a description field the remote entry never had", () => {
    const redactions = collectRedactions({ activationTypes: [{ id: 1, description: "" }] });
    const remote: any = { activationTypes: [{ id: 1, name: "Action" }] };
    const { missing } = applyRedactions(remote, redactions);
    expect(missing).toHaveLength(1);
    expect("description" in remote.activationTypes[0]).toBe(false);
  });
});

describe("collectDescriptionShapes / applyOmissions", () => {
  // armor, tools and weapons have the field deleted rather than blanked, and
  // `conditions` only carries one a level down, so the rule is per shape.
  const base = {
    armor: [{ id: 3, name: "Studded Leather" }],
    weaponProperties: [{ id: 1, name: "Ammunition", description: "You can use..." }],
    conditions: [{ definition: { id: 1, name: "Blinded", description: "<p>text</p>" } }],
  };

  it("records which shapes carry a description at all", () => {
    const shapes = collectDescriptionShapes(base);
    expect(shapes.get("armor[]")).toBe(false);
    expect(shapes.get("weaponProperties[]")).toBe(true);
    expect(shapes.get("conditions[]")).toBe(false);
    expect(shapes.get("conditions[].definition")).toBe(true);
  });

  it("deletes descriptions only on shapes that never carry one", () => {
    const remote: any = {
      armor: [
        { id: 3, name: "Studded Leather", description: "<p>Made from tough leather.</p>" },
        { id: 99, name: "Brand New Armor", description: "<p>New prose.</p>" },
      ],
      weaponProperties: [{ id: 1, name: "Ammunition", description: "Fresh text" }],
      conditions: [{ definition: { id: 1, name: "Blinded", description: "<p>fresh</p>" } }],
    };

    const { removed, unknownShapes } = applyOmissions(remote, collectDescriptionShapes(base));

    expect(removed.map((item: any) => item.display)).toEqual([
      "armor[id=3].description",
      "armor[id=99].description",
    ]);
    expect(remote.armor.every((entry: any) => !("description" in entry))).toBe(true);
    expect(remote.weaponProperties[0].description).toBe("Fresh text");
    expect(remote.conditions[0].definition.description).toBe("<p>fresh</p>");
    expect([...unknownShapes.keys()]).toEqual([]);
  });

  it("leaves descriptions on shapes the committed file has never seen, and reports them", () => {
    const remote: any = { armor: [{ id: 3, extras: [{ id: 1, description: "unseen shape" }] }] };
    const { removed, unknownShapes } = applyOmissions(remote, collectDescriptionShapes(base));
    expect(removed).toEqual([]);
    expect(remote.armor[0].extras[0].description).toBe("unseen shape");
    expect([...unknownShapes.entries()]).toEqual([["armor[].extras[]", 1]]);
  });
});

describe("mergeTopLevelKeys", () => {
  it("keeps current key order and drops remote only keys", () => {
    const { merged, droppedKeys, keptStale } = mergeTopLevelKeys(
      { armor: [1], tools: [2], weapons: [3] },
      { weapons: [30], tools: [20], armor: [10], newThing: [99] },
    );
    expect(Object.keys(merged)).toEqual(["armor", "tools", "weapons"]);
    expect(merged).toEqual({ armor: [10], tools: [20], weapons: [30] });
    expect(droppedKeys).toEqual(["newThing"]);
    expect(keptStale).toEqual([]);
  });

  it("keeps the committed value when the response omits a key", () => {
    const { merged, keptStale } = mergeTopLevelKeys({ armor: [1], tools: [2] }, { armor: [10] });
    expect(merged).toEqual({ armor: [10], tools: [2] });
    expect(keptStale).toEqual(["tools"]);
  });
});

describe("describeNewDescriptions", () => {
  it("flags a new entry in a redacted key that arrives with prose", () => {
    const current = makeCurrent();
    const remote = {
      ...current,
      activationTypes: [
        ...current.activationTypes,
        { id: 9, name: "Legendary Action", description: "A legendary action is..." },
        { id: 10, name: "Silent Action", description: "" },
      ],
    };
    const found = describeNewDescriptions(current, remote, collectRedactions(current));
    expect(found).toEqual([{ key: "activationTypes", entry: "id=9", name: "Legendary Action" }]);
  });

  it("ignores keys with no redactions", () => {
    const current = makeCurrent();
    const remote = { ...current, conditions: [...current.conditions, { definition: { id: 2, description: "text" } }] };
    expect(describeNewDescriptions(current, remote, collectRedactions(current))).toEqual([]);
  });
});

describe("summariseDiff", () => {
  it("reports added, removed and value changes only for keys that differ", () => {
    const changes = summariseDiff(
      { armor: [{ id: 1 }, { id: 2 }], tools: [{ id: 1 }], weapons: [{ id: 1 }], vehicleConfiguration: null },
      {
        armor: [{ id: 1 }, { id: 3 }],
        tools: [{ id: 1, name: "renamed" }],
        weapons: [{ id: 1 }],
        vehicleConfiguration: { enabled: true },
      },
    );
    expect(changes).toEqual([
      { key: "armor", changed: true, added: ["id=3"], removed: ["id=2"] },
      { key: "tools", changed: true, added: [], removed: [] },
      { key: "vehicleConfiguration", changed: true, added: [], removed: [] },
    ]);
  });
});

describe("displayPath", () => {
  it("renders nested field and entry segments", () => {
    expect(
      displayPath([
        { type: "field", value: "conditions" },
        { type: "match", fields: ["definition", "id"], value: 1 },
        { type: "field", value: "definition" },
        { type: "field", value: "description" },
      ]),
    ).toBe("conditions[definition.id=1].definition.description");
  });
});

describe("toPrettyJson", () => {
  it("expands objects and inlines arrays of primitives", () => {
    expect(toPrettyJson({ armor: [{ id: 3, name: "Studded Leather" }], diceValues: [4, 6, 8], empty: [] })).toBe(
      [
        "{",
        "  \"armor\": [",
        "    {",
        "      \"id\": 3,",
        "      \"name\": \"Studded Leather\"",
        "    }",
        "  ],",
        "  \"diceValues\": [4, 6, 8],",
        "  \"empty\": []",
        "}",
      ].join("\n"),
    );
  });

  it("expands arrays that hold arrays", () => {
    expect(toPrettyJson({ slots: [[0, 0], [2, 0]] })).toBe(
      ["{", "  \"slots\": [", "    [0, 0],", "    [2, 0]", "  ]", "}"].join("\n"),
    );
  });
});

// Regression guard on the shipped file: exactly these descriptions are blanked,
// and the script must keep it that way. Update deliberately, not incidentally.
describe("the committed fallback-config.json", () => {
  it("has exactly the known set of blanked descriptions", () => {
    const displays = collectRedactions(realConfig).map((r: any) => r.display);
    expect(displays).toEqual([
      "activationTypes[id=1].description",
      "activationTypes[id=2].description",
      "activationTypes[id=3].description",
      "activationTypes[id=4].description",
      "activationTypes[id=6].description",
      "activationTypes[id=7].description",
      "activationTypes[id=8].description",
      "additionalLevelTypes[id=1].description",
      "additionalLevelTypes[id=3].description",
      "additionalLevelTypes[id=9].description",
      "additionalLevelTypes[id=11].description",
      "additionalLevelTypes[id=12].description",
      "additionalLevelTypes[id=15].description",
      "additionalLevelTypes[id=16].description",
      "additionalLevelTypes[id=17].description",
      "weaponProperties[id=16].description",
      "weaponProperties[id=17].description",
      "aoeTypes[id=9].description",
      "aoeTypes[id=13].description",
      "alignments[id=10].description",
      "sourceCategories[id=2].description",
      "sourceCategories[id=15].description",
      "sourceCategories[id=28].description",
      "sourceCategories[id=35].description",
    ]);
  });

  it("carries no description field at all on armor, tools and weapons", () => {
    const shapes = collectDescriptionShapes(realConfig);
    expect(shapes.get("armor[]")).toBe(false);
    expect(shapes.get("tools[]")).toBe(false);
    expect(shapes.get("weapons[]")).toBe(false);
    expect(shapes.get("conditions[].definition")).toBe(true);
  });

  // The script must be able to rewrite the file without touching formatting,
  // so a refresh diff only ever shows data changes.
  it("round trips through toPrettyJson + prettier byte for byte", async () => {
    const filePath = path.resolve(__dirname, "../../data/fallback-config.json");
    const onDisk = await fs.readFile(filePath, "utf8");
    const config = await prettier.resolveConfig(filePath);
    const formatted = await prettier.format(toPrettyJson(JSON.parse(onDisk)), {
      ...config,
      parser: "json",
      filepath: filePath,
    });
    expect(formatted).toBe(onDisk);
  });
});
