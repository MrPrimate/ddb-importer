import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Infusion of Light (Oath of the Holy, World of Warcraft; the WoW Paladin's Holy Specialization):
 * a spell that deals Radiant damage refills the Lay On Hands pool by the Radiant dice rolled, up to
 * the pool's maximum. The activity restores one point per scaling step, so the player scales it to
 * the total rolled.
 */
export default class InfusionOfLight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Refill Lay On Hands",
      activationType: "special",
      activationCondition: "You cast a spell that deals Radiant damage: scale to the Radiant total rolled",
      targetType: "self",
      noConsumeTargets: true,
      additionalConsumptionTargets: [
        { type: "itemUses", target: "lay-on-hands", value: "-1", scaling: { mode: "amount", formula: "" } },
      ],
      data: {
        consumption: { scaling: { allowed: true, max: `5 * @classes.${this.classIdentifier("Paladin")}.levels` } },
      },
    };
  }

}
