// @vitest-environment jsdom
// Pins the class SPECIAL_ADVANCEMENTS renames that move a DDB feature scale onto the identifier
// official dnd5e content rolls, through the same lookup the feature and description parsers use.

// the class parsers sit in an import cycle with AdvancementHelper; loading the feature
// factory first resolves it the way the production entry point does
import "../../../src/parser/features/CharacterFeatureFactory";
import DDBClass from "../../../src/parser/classes/DDBClass";
import DDBDataUtils from "../../../src/parser/lib/DDBDataUtils";

const favoredFoeScales = [
  { level: 1, description: "", fixedValue: null, dice: { diceCount: 1, diceValue: 4, fixedValue: null, diceString: "1d4" } },
  { level: 6, description: "", fixedValue: null, dice: { diceCount: 1, diceValue: 6, fixedValue: null, diceString: "1d6" } },
  { level: 14, description: "", fixedValue: null, dice: { diceCount: 1, diceValue: 8, fixedValue: null, diceString: "1d8" } },
];

const martialArtsScales = [
  { level: 4, description: "", fixedValue: null, dice: { diceCount: 1, diceValue: 4, fixedValue: null, diceString: "1d4" } },
  { level: 5, description: "", fixedValue: null, dice: { diceCount: 1, diceValue: 6, fixedValue: null, diceString: "1d6" } },
];

function makeDDB(classId: number, className: string): any {
  return {
    character: {
      classes: [
        {
          definition: { id: classId, name: className, classFeatures: [] },
          subclassDefinition: null,
          classFeatures: [],
          level: 20,
          isStartingClass: true,
        },
      ],
      options: { class: [], race: [], feat: [] },
      choices: { class: [], race: [], feat: [] },
      modifiers: { class: [], race: [], background: [], item: [], feat: [], condition: [] },
      optionalClassFeatures: [],
      characterValues: [],
    },
    classOptions: [],
  };
}

describe("DDBClass.SPECIAL_ADVANCEMENTS", () => {
  it("renames the Favored Foe scale to the official ranger die", () => {
    expect(DDBClass.SPECIAL_ADVANCEMENTS["Favored Foe"].functionArgs).toEqual({
      newName: "Favored Foe Die",
      identifier: "die",
    });
  });

  it("links the bare Favored Foe option definition to @scale.ranger.die", () => {
    const option: any = { id: 3035739, name: "Favored Foe", classId: 5, levelScales: favoredFoeScales };
    expect(DDBDataUtils.getScaleValueString(makeDDB(5, "Ranger"), option)).toEqual({
      name: "Favored Foe",
      value: "@scale.ranger.die",
      rollable: true,
      dice: true,
      current: null,
    });
  });

  it("builds no scale from Quickened Healing and links it to the Martial Arts die", () => {
    expect(DDBClass.NOT_ADVANCEMENT_FOR_FEATURE).toContain("Quickened Healing");
    expect(DDBClass.SPECIAL_ADVANCEMENTS["Quickened Healing"].functionArgs).toEqual({ identifier: "die" });
    const option: any = { id: 3035384, name: "Quickened Healing", classId: 2, levelScales: martialArtsScales };
    expect(DDBDataUtils.getScaleValueString(makeDDB(2, "Monk"), option)).toEqual({
      name: "Quickened Healing",
      value: "@scale.monk.die",
      rollable: true,
      dice: true,
      current: null,
    });
  });
});
