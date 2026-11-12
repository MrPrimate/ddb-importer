import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Every weapon of sharpness (and Tearulai): hitting an object maximises the weapon's damage dice.
 * AC5e cannot tell an object from a creature, so its rule is a tick box in the damage dialog; the
 * macro activity works the maximum out for tables without AC5e.
 */
export default class SwordOfSharpness extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      DDBEnricherData.maximumDamageActivity({
        condition: "When you attack an object with this weapon and hit",
        parameters: { title: "Maximum Damage Against an Object", thisItem: true },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Sharpness: Objects",
        description: "Maximize the weapon's damage dice when you hit an object.",
        condition: this.ac5eSelfItemCondition,
        addTo: "base",
        optin: true,
      }),
    ];
  }

}
