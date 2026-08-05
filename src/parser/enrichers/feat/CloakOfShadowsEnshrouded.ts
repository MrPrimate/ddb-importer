import DDBEnricherData from "../data/DDBEnricherData";

export default class CloakOfShadowsEnshrouded extends DDBEnricherData {

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
        name: "Enshrouded",
        options: {
          durationTurns: 1,
          description: "You have Advantage on your next Dexterity (Stealth) check this turn.",
        },
        daeSpecialDurations: ["isSkill.ste"],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.skill.ste"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.customChange("skill.ste", 20, "flags.automated-conditions-5e.check.advantage"),
        ],
      },
    ];
  }

}
