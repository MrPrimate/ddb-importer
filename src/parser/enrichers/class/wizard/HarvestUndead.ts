import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Necromancer (AU 2024). DDB currently names both the level 10 reaction and the level 14
 * mastery feature "Harvest Undead" (bug reported 2026-09-03), so one document carries the
 * reaction heal plus the level 14 Bolster / Extinguish actions until the character carries the
 * corrected "Death's Master" feature, which then owns them (see DeathsMaster).
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.hasClassFeature({ featureName: "Death's Master" })) return [];
    return [
      { action: { name: "Bolster Undead: Bonus Temp HP", type: "class" } },
      { action: { name: "Extinguish Undead", type: "class" } },
    ];
  }

}
