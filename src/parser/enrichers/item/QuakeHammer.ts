import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Quake Hammer: once per dawn, a Magic action smashes the hammer down within 5 feet or throws it to
 * a point within 60 feet: a 10 foot radius Dexterity save for 2d6 bludgeoning, half on a success,
 * Prone on a failure.
 */
export default class QuakeHammer extends DDBEnricherData {

  static TREMOR = "Tremor";

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
      itemProperty(QuakeHammer.TREMOR, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 6, types: ["bludgeoning"] })],
        onSave: "half",
        activationType: "action",
        condition: "Smash the hammer into the ground within 5 feet, or throw it at a point on the ground within 60 feet; you are not affected",
        template: { type: "radius", size: "10" },
        range: { value: "60", units: "ft" },
        // the parser reads the once-per-dawn limit onto the item's own uses
        charges: "1",
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Quake Hammer: Prone",
        activityMatch: QuakeHammer.TREMOR,
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
