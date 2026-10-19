import DDBEnricherData from "../../data/DDBEnricherData";

export default class Howl extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetSelf: true,
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "con", formula: "" },
        },
        target: {
          affects: {
            count: "",
            type: "enemy",
            choice: true,
          },
          template: {
            contiguous: false,
            type: "radius",
            size: "15",
            units: "ft",
          },
          prompt: false,
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Howl",
        options: {
          expiry: "sourceStart",
          description: "Disadvantage on attack rolls and saving throws until the start of the howler's next turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.attack.all"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.attack.disadvantage"),
          DDBEnricherData.ChangeHelper.ac5eChange("1", 20, "flags.automated-conditions-5e.save.disadvantage"),
        ],
      },
    ];
  }

}
