import DDBEnricherData from "../data/DDBEnricherData";

export default class GreaterDisciplineAuspex extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Auspex: Heightened Awareness",
        options: {
          durationSeconds: 60,
          description: "You have Advantage on Intelligence and Wisdom checks and saving throws.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.check.int"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.check.wis"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.save.int"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.ability.save.wis"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("ability.int || ability.wis", 20, "flags.automated-conditions-5e.check.advantage"),
          DDBEnricherData.ChangeHelper.customChange("ability.int || ability.wis", 20, "flags.automated-conditions-5e.save.advantage"),
        ],
      },
    ];
  }

}
