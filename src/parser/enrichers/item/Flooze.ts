import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty, textDC } from "./_ItemActivities";

/**
 * Flooze: Reachier spends up to 4 charges for 5 feet of reach each until the end of the turn.
 * The Very Rare flail's Sticky Fingers disarms instead of dealing damage (Strength save), and
 * freeing the stuck item is a Strength check that burns whoever tries it with acid either way.
 */
export default class Flooze extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities = [
      itemProperty("Reachier", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        condition: "No action required: +5 feet of reach per charge until the end of your turn",
        charges: "1",
        scalingMax: "4",
        selfTarget: true,
        noeffect: true,
      }),
    ];
    if ((/Sticky Fingers/i).test(this.text)) {
      const dc = textDC(this.text, /DC (\d+) Strength saving throw/i, "16");
      activities.push(
        itemProperty("Sticky Fingers", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
          save: { ability: ["str"], formula: dc },
          condition: "Instead of dealing damage when you hit a Medium or smaller creature holding an item: it lets go and the item sticks in the flail",
          noeffect: true,
        }),
        itemCheck("Free the Stuck Item", {
          ability: "str",
          dc,
          condition: "A creature within reach of the flooze",
        }),
        itemProperty("Free the Stuck Item: Acid", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["acid"] })],
          condition: "The creature taking the action to free the item, success or failure",
          noeffect: true,
        }),
      );
    }
    return activities;
  }

}
