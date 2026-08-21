// Vestige stage parsing. The charge-text helpers live on DDBItem and are injected, so these
// exercise the same pair the parser uses rather than a stand-in.
import DDBItem from "../../../src/parser/item/DDBItem";
import Vestige from "../../../src/parser/item/Vestige";
import {
  CABALS_RUIN,
  SPIRE_OF_CONFLUX,
  JEWEL_OF_THREE_PRAYERS,
  NO_CHARGE_VESTIGE,
} from "../../_fixtures/ddb/vestiges";

describe("Vestige.getStage", () => {
  it("reads each stage from the name suffix", () => {
    expect(Vestige.getStage("Jewel of Three Prayers (Dormant)")).toBe("dormant");
    expect(Vestige.getStage("Jewel of Three Prayers (Awakened)")).toBe("awakened");
    expect(Vestige.getStage("Jewel of Three Prayers (Exalted)")).toBe("exalted");
  });

  it("is case insensitive", () => {
    expect(Vestige.getStage("Some Item (EXALTED)")).toBe("exalted");
  });

  it("tolerates trailing whitespace", () => {
    expect(Vestige.getStage("Cabal’s Ruin (Exalted) ")).toBe("exalted");
  });

  it("returns null for an unsuffixed name", () => {
    expect(Vestige.getStage("Cabal’s Ruin")).toBeNull();
  });

  it("returns null when the stage is not at the end of the name", () => {
    expect(Vestige.getStage("Jewel of Three Prayers (Dormant) Replica")).toBeNull();
  });

  it("returns null once the Legacy suffix is appended, which is why callers pass originalName", () => {
    expect(Vestige.getStage("Cabal’s Ruin (Exalted) (Legacy)")).toBeNull();
  });

  it("handles empty and nullish names", () => {
    expect(Vestige.getStage("")).toBeNull();
    expect(Vestige.getStage(null)).toBeNull();
    expect(Vestige.getStage(undefined)).toBeNull();
  });
});

describe("Vestige.splitDescription", () => {
  const stages = (description: string) =>
    Vestige.splitDescription(description).map((section) => section.stage);

  it("splits plain h4 headings", () => {
    expect(stages(CABALS_RUIN)).toEqual([null, "dormant", "awakened", "exalted"]);
  });

  it("splits h4 headings wrapping inline tags", () => {
    expect(stages(NO_CHARGE_VESTIGE)).toEqual([null, "dormant", "awakened", "exalted"]);
  });

  it("splits bolded 'Stage State.' lead-ins, including the &nbsp; variant", () => {
    expect(stages(JEWEL_OF_THREE_PRAYERS)).toEqual([null, "dormant", "awakened", "exalted"]);
  });

  it("splits the 'Stage State.' variant with a space before the closing em", () => {
    const description = "<p>Intro.</p><p><em><strong>Dormant State.</strong> </em>In this state.</p>";
    expect(stages(description)).toEqual([null, "dormant"]);
  });

  it("does not treat inline prose mentioning a stage as a heading", () => {
    const description = "<p>In its Dormant State, the jewel has the following properties:</p>";
    expect(Vestige.splitDescription(description)).toEqual([{ stage: null, text: description }]);
  });

  it("returns a single preamble section when there are no headings", () => {
    const description = "<p>A wand that shoots fire.</p>";
    expect(Vestige.splitDescription(description)).toEqual([{ stage: null, text: description }]);
  });

  it("returns a single empty section for an empty description", () => {
    expect(Vestige.splitDescription("")).toEqual([{ stage: null, text: "" }]);
  });
});

describe("Vestige.getStageUses", () => {
  it("keeps the dormant charges for Cabal's Ruin", () => {
    expect(Vestige.getStageUses("Cabal’s Ruin (Dormant)", CABALS_RUIN, DDBItem)).toEqual({
      max: "4",
      spent: 0,
      // dawn wins over the "short or long rest" sentence in the same section
      recovery: [{ period: "dawn", type: "formula", formula: "1d4" }],
    });
  });

  it("advances Cabal's Ruin charges and recharge at awakened", () => {
    expect(Vestige.getStageUses("Cabal’s Ruin (Awakened)", CABALS_RUIN, DDBItem)).toEqual({
      max: "6",
      spent: 0,
      recovery: [{ period: "dawn", type: "formula", formula: "1d4 + 2" }],
    });
  });

  it("advances Cabal's Ruin charges and recharge at exalted", () => {
    expect(Vestige.getStageUses("Cabal’s Ruin (Exalted)", CABALS_RUIN, DDBItem)).toEqual({
      max: "10",
      spent: 0,
      recovery: [{ period: "dawn", type: "formula", formula: "1d6 + 4" }],
    });
  });

  it("keeps the dormant charges for the Spire of Conflux", () => {
    expect(Vestige.getStageUses("Spire of Conflux (Dormant)", SPIRE_OF_CONFLUX, DDBItem)).toEqual({
      max: "8",
      spent: 0,
      recovery: [{ period: "dawn", type: "formula", formula: "1d4 + 2" }],
    });
  });

  it("advances the Spire of Conflux at awakened despite the comma after the charge count", () => {
    expect(Vestige.getStageUses("Spire of Conflux (Awakened)", SPIRE_OF_CONFLUX, DDBItem)).toEqual({
      max: "12",
      spent: 0,
      recovery: [{ period: "dawn", type: "formula", formula: "1d6 + 2" }],
    });
  });

  it("advances the Spire of Conflux at exalted", () => {
    expect(Vestige.getStageUses("Spire of Conflux (Exalted)", SPIRE_OF_CONFLUX, DDBItem)).toEqual({
      max: "20",
      spent: 0,
      recovery: [{ period: "dawn", type: "formula", formula: "1d6 + 4" }],
    });
  });

  it("keeps the dormant charges for the Jewel of Three Prayers", () => {
    expect(Vestige.getStageUses("Jewel of Three Prayers (Dormant)", JEWEL_OF_THREE_PRAYERS, DDBItem)).toEqual({
      max: "3",
      spent: 0,
      recovery: [{ period: "dawn", type: "recoverAll", formula: "" }],
    });
  });

  it("reads the delta phrasing at awakened and inherits the dormant recharge", () => {
    expect(Vestige.getStageUses("Jewel of Three Prayers (Awakened)", JEWEL_OF_THREE_PRAYERS, DDBItem)).toEqual({
      max: "5",
      spent: 0,
      // recoverAll is carried forward; re-deriving it would compare "3" against a max of 5
      recovery: [{ period: "dawn", type: "recoverAll", formula: "" }],
    });
  });

  it("reads the delta phrasing at exalted and inherits the dormant recharge", () => {
    expect(Vestige.getStageUses("Jewel of Three Prayers (Exalted)", JEWEL_OF_THREE_PRAYERS, DDBItem)).toEqual({
      max: "7",
      spent: 0,
      recovery: [{ period: "dawn", type: "recoverAll", formula: "" }],
    });
  });

  it("works on the truncated description DDB actually ships per stage", () => {
    const awakenedOnly = JEWEL_OF_THREE_PRAYERS.slice(0, JEWEL_OF_THREE_PRAYERS.indexOf("<p><em><strong>Exalted"));
    expect(Vestige.getStageUses("Jewel of Three Prayers (Awakened)", awakenedOnly, DDBItem)?.max).toBe("5");
  });

  it("returns null for an unsuffixed name", () => {
    expect(Vestige.getStageUses("Cabal’s Ruin", CABALS_RUIN, DDBItem)).toBeNull();
  });

  it("returns null for a staged item with no charges", () => {
    expect(Vestige.getStageUses("Blade of Broken Mirrors (Exalted)", NO_CHARGE_VESTIGE, DDBItem)).toBeNull();
  });

  it("returns null when the description has no stage headings", () => {
    expect(Vestige.getStageUses("Wand of Wonder (Exalted)", "<p>The wand has 7 charges.</p>", DDBItem)).toBeNull();
  });

  it("returns null when the named stage is absent from the description", () => {
    const dormantOnly = CABALS_RUIN.slice(0, CABALS_RUIN.indexOf("<h4>Awakened</h4>"));
    expect(Vestige.getStageUses("Cabal’s Ruin (Exalted)", dormantOnly, DDBItem)).toBeNull();
  });

  it("returns null for an empty description", () => {
    expect(Vestige.getStageUses("Cabal’s Ruin (Exalted)", "", DDBItem)).toBeNull();
  });
});
