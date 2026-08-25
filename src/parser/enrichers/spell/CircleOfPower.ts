import DDBEnricherData from "../data/DDBEnricherData";

export default class CircleOfPower extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Circle of Power" }),
        ],
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Circle of Power",
        standalone: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.magicResistance.all"),
          DDBEnricherData.ChangeHelper.customChange("1", 20, "flags.midi-qol.superSaver.all"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("isSpell", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
        options: {
          durationSeconds: 600,
          description: "Advantage on saving throws against spells and magical effects; a successful save against an effect that deals half damage on a success deals no damage instead.",
        },
      },
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              type: "ally",
            },
          },
        },
      },
    };
  }

}
