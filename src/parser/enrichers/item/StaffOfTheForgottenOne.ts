import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Staff of the Forgotten One: Invoke Curse spends a charge and an action on one creature within 60
 * feet, a Constitution save against your spell save DC or it is cursed: it can't regain hit points
 * and is vulnerable to necrotic damage until a greater restoration, remove curse or similar spell
 * ends it. The parser reads only numbered DCs, so it builds the staff's other saves (The Forgotten
 * One, Destroying the Staff) and misses this one; those parsed saves are kept beside it.
 */
export default class StaffOfTheForgottenOne extends DDBEnricherData {

  static CURSE = "Invoke Curse";

  override get keepParsedActivities(): boolean {
    return true;
  }

  // the parser reads the possession as Incapacitated and links it to every save on the staff;
  // possession is DM control, not a condition, so the auto status goes
  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(StaffOfTheForgottenOne.CURSE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["con"], calculation: "spellcasting" },
        activationType: "action",
        condition: "While holding the staff: one creature you can see",
        range: { value: "60", units: "ft" },
        charges: "1",
        // the curse lasts until a spell ends it, so the activity duration must not cap the effect
        data: { duration: { units: "perm" } },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Cursed by the Forgotten One",
        activityMatch: StaffOfTheForgottenOne.CURSE,
        changes: [DDBEnricherData.ChangeHelper.damageVulnerabilityChange("necrotic")],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: null,
          description: "Cursed: can't regain hit points and has vulnerability to necrotic damage. A greater restoration, remove curse, or similar spell ends the curse.",
        },
      },
    ];
  }

}
