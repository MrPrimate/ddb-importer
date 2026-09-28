import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Whirlpool Dart: once per dawn, thrown at a point within 20 feet as an action, a 15 foot radius,
 * 10 foot high whirlpool: Strength save for 4d4 bludgeoning and a 15 foot pull toward the centre,
 * half and no pull on a success.
 */
export default class WhirlpoolDart extends DDBEnricherData {

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Whirlpool", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["str"], formula: "13" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 4, denomination: 4, types: ["bludgeoning"] })],
        onSave: "half",
        activationType: "action",
        condition: "Throw the dart at a point and speak its command word; you are not affected. A failed save pulls a creature up to 15 feet toward the centre",
        template: { type: "cylinder", size: "15", height: "10" },
        range: { value: "20", units: "ft" },
        // the parser reads the once-per-dawn limit onto the item's own uses
        charges: "1",
        noeffect: true,
      }),
    ];
  }

}
