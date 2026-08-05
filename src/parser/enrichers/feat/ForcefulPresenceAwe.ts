import DDBEnricherData from "../data/DDBEnricherData";

export default class ForcefulPresenceAwe extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Awe",
        options: {
          durationSeconds: 600,
          description: "You have Advantage on Charisma (Intimidation, Performance, and Persuasion) checks.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.skill.itm"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.skill.prf"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.skill.per"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("skill.itm || skill.prf || skill.per", 20, "flags.automated-conditions-5e.check.advantage"),
        ],
      },
    ];
  }

}
