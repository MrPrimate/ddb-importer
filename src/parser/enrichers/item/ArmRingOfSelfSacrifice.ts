import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Aggressive Strike: spend 2 charges when you hit to deal the attack's maximum damage. A macro
 * activity spends the charges and works out that maximum from the recent attack. The force damage
 * the wearer takes back (the attack's minimum) is left to the table.
 */
export default class ArmRingOfSelfSacrifice extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        name: "Aggressive Strike",
        condition: "When you hit a creature with an attack",
        itemConsume: "2",
        parameters: {
          title: "Aggressive Strike",
          sources: [{ type: "any" }],
          activityTypes: ["attack"],
        },
      }),
    ];
  }

}
