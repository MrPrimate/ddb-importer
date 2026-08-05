import DDBEnricherData from "../../data/DDBEnricherData";

export default class AdjustDensity extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "action",
      activationCondition: "Large or smaller (Huge at level 10); up to 1 minute, concentration",
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Adjust Density: Halved Weight",
        options: {
          durationSeconds: 60,
          description: "Speed +10 ft, jump distance doubled, disadvantage on Strength checks and saving throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 30, "system.attributes.movement.walk"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.check.str"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.disadvantage.ability.save.str"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("ability.str", 20, "flags.automated-conditions-5e.check.disadvantage"),
          DDBEnricherData.ChangeHelper.customChange("ability.str", 20, "flags.automated-conditions-5e.save.disadvantage"),
        ],
      },
      {
        name: "Adjust Density: Doubled Weight",
        options: {
          durationSeconds: 60,
          description: "Speed -10 ft, advantage on Strength checks and saving throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("-10", 30, "system.attributes.movement.walk"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.check.str"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.save.str"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("ability.str", 20, "flags.automated-conditions-5e.check.advantage"),
          DDBEnricherData.ChangeHelper.customChange("ability.str", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      },
    ];
  }

}
