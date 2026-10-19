import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Mage Breaker: a concentrating creature hit and damaged by the weapon has Disadvantage on the save
 * to keep Concentration. The effect rides the attack for the user to apply and remove once that
 * save is made.
 */
export default class MageBreaker extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mage Breaker: Disrupted Concentration",
        activityTypesMatch: ["attack"],
        options: {
          transfer: false,
          description: "Disadvantage on the next saving throw to maintain Concentration against this weapon's damage.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1", 20, "system.attributes.concentration.roll.mode"),
        ],
      },
    ];
  }

}
