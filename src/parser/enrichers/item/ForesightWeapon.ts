import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Every Foresight weapon: the first attack against each creature in an encounter has Advantage, and
 * if it hits the weapon's damage dice are maximised. AC5e cannot track the first attack per creature,
 * so its rule is a tick box in the damage dialog; the macro activity works the maximum out for tables
 * without AC5e.
 */
export default class ForesightWeapon extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "The first time you hit each creature during an encounter with this weapon",
        parameters: { title: "Foresight", thisItem: true },
      }),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Foresight: First Attack",
        description: "Maximize the weapon's damage dice on the first hit against each creature in an encounter.",
        condition: this.ac5eSelfItemCondition,
        addTo: "base",
        optin: true,
      }),
    ];
  }

}
