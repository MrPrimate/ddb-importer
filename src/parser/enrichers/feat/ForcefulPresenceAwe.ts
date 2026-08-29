import DDBEnricherData from "../data/DDBEnricherData";

export default class ForcefulPresenceAwe extends DDBEnricherData {

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
        name: "Awe",
        options: {
          durationSeconds: 600,
          description: "You have Advantage on Charisma (Intimidation, Performance, and Persuasion) checks.",
        },
        changes: [
          // One rule change gated on the skill being rolled
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("check", {
            conditions: { k: "roll.skill", o: "in", v: ["itm", "prf", "per"] },
          }),
        ],
      },
    ];
  }

}
