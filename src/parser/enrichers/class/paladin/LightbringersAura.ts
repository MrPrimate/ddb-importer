import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Lightbringer's Aura (Oath of the Holy, World of Warcraft; the WoW Paladin's Holy Specialization):
 * a spell or Lay On Hands that restores Hit Points to a Bloodied creature within your Aura of
 * Protection restores an extra 1d6.
 */
export default class LightbringersAura extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Extra Healing",
      activationType: "special",
      activationCondition: "When your spell or Lay On Hands heals a Bloodied creature within your Aura of Protection",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["healing"] }),
      },
    };
  }

}
