import DDBEnricherData from "../data/DDBEnricherData";

export default class CloakOfShadowsEnshrouded extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Enshrouded",
        options: {
          durationTurns: 1,
          expiry: "turnEnd",
          description: "You have Advantage on your next Dexterity (Stealth) check this turn. Without DAE the effect lasts for every Stealth check until the end of the turn.",
        },
        // DAE ends the effect after the one Stealth check; the native expiry is the ceiling
        daeSpecialDurations: ["isSkill.ste"],
        changes: [
          DDBEnricherData.ChangeHelper.advantageSkillChange("ste"),
        ],
      },
    ];
  }

}
