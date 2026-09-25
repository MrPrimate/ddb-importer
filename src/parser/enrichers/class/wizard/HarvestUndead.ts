import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024) level 10: a reaction on becoming Bloodied that drops a controlled
 * Undead to 0 HP and heals the wizard for their level. The level 14 Bolster / Extinguish
 * actions belong to Death's Master (DDB shipped that feature under this name until 2026-09-08).
 */
export default class HarvestUndead extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Harvest Undead",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When you become Bloodied",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.wizard.levels",
          types: ["healing"],
        }),
      },
    };
  }

}
