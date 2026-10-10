import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Enchantment: once before a charming Enchantment spell ends, an action forces the chosen creature
 * to make an Intelligence save against the spell save DC or lose hours of memory.
 */
export default class AlterMemories extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    const ability = this.is2014 ? "Charisma" : "Intelligence";
    return {
      name: "Alter Charmed Memories",
      targetType: "creature",
      targetCount: 1,
      activationType: "action",
      activationCondition: "Once before your charming Enchantment spell ends",
      data: {
        save: {
          ability: ["int"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        duration: {
          override: true,
          units: "inst",
          special: `Lost memories: 1 + ${ability} modifier hours (minimum 1)`,
        },
      },
    };
  }

}
