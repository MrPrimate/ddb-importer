import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Vampiric Embrace (Shadow Domain, World of Warcraft; the WoW Priest's Shadow Specialization):
 * while Shadowform is active, each 1d6 rolled for a spell's extra damage heals one creature within
 * 30 feet by the number rolled.
 */
export default class VampiricEmbrace extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Heal",
      activationType: "special",
      activationCondition: "While Shadowform is active, when you roll the 1d6 extra damage for a spell (heal the number rolled)",
      targetType: "creature",
      data: {
        range: { units: "ft", value: "30" },
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["healing"] }),
      },
    };
  }

}
