import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Staff of the Forgotten One: Invoke Curse spends a charge and an action on one creature within 60
 * feet, a Constitution save against your spell save DC or it is cursed: it can't regain hit points
 * and is vulnerable to necrotic damage until a greater restoration, remove curse or similar spell
 * ends it. The parser reads only numbered DCs, so it builds the staff's other saves (The Forgotten
 * One, Destroying the Staff) and misses this one; those parsed saves are kept beside it, retimed:
 * the possession save is the wielder's own when they spend charges, and Destroying the Staff is
 * an action exploding in a 30 foot radius on the staff. Neither rolls the staff's weapon damage.
 * While on your person it doubles your proficiency bonus for Arcana and History checks.
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

  static POSSESSION = "The Forgotten One";

  static DESTROY = "Destroying the Staff";

  override get override(): IDDBOverrideData {
    return {
      func: ({ enricher }) => {
        const activities = (enricher.data.system as { activities?: Record<string, I5eActivity> }).activities ?? {};
        for (const activity of Object.values(activities)) {
          if (activity.type !== "save") continue;
          // fresh objects: the parser's activities share activation, range and target objects
          if (activity.name === StaffOfTheForgottenOne.POSSESSION) {
            activity.activation = {
              type: "special",
              value: null,
              condition: "Each time a creature other than Acererak expends any of the staff's charges, a 50 percent chance: on a failure you are possessed and become an NPC under the DM's control",
            } as I5eActivity["activation"];
            activity.range = { override: true, value: null, units: "self", special: "" } as I5eActivity["range"];
            activity.target = {
              override: true,
              template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
              affects: { count: "", type: "self", choice: false, special: "" },
              prompt: false,
            } as I5eActivity["target"];
            activity.damage = { ...activity.damage, includeBase: false, parts: [] } as I5eSaveActivity["damage"];
          } else if (activity.name === StaffOfTheForgottenOne.DESTROY) {
            activity.activation = { type: "action", value: 1, condition: "Break the staff over one knee or a solid surface; the staff is destroyed" } as I5eActivity["activation"];
            activity.range = { override: true, value: null, units: "self", special: "" } as I5eActivity["range"];
            activity.target = {
              override: true,
              template: { count: "1", contiguous: false, type: "radius", size: "30", width: "", height: "", units: "ft" },
              affects: { count: "", type: "creature", choice: false, special: "Each creature in the 30-foot-radius sphere centered on the staff" },
              prompt: true,
            } as I5eActivity["target"];
            activity.damage = { ...activity.damage, includeBase: false } as I5eSaveActivity["damage"];
          }
        }
      },
    };
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
        name: "Staff of the Forgotten One: Lore",
        changes: ["arc", "his"].map((skill) => DDBEnricherData.ChangeHelper.upgradeChange("2", 20, `system.skills.${skill}.value`)),
        options: {
          transfer: true,
          durationSeconds: null,
          description: "While the staff is on your person, your proficiency bonus is doubled for Intelligence (Arcana) and Intelligence (History) checks.",
        },
      },
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
