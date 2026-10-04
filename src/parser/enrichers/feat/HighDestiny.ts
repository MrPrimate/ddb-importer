import DDBEnricherData from "../data/DDBEnricherData";

/** The One Ring virtue: Advantage on death saving throws, and becoming stable also restores 1 hit point. */
export default class HighDestiny extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Become Stable",
      targetType: "self",
      activationType: "special",
      activationCondition: "You become stable",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "1", types: ["healing"] }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "High Destiny",
        options: { transfer: true, description: "Advantage on death saving throws." },
        changes: [DDBEnricherData.ChangeHelper.rollModeChange("system.attributes.death.roll.mode", DDBEnricherData.ChangeHelper.ADVANTAGE)],
      },
    ];
  }

}
