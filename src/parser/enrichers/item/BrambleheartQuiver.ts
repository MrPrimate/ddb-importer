import DDBEnricherData from "../data/DDBEnricherData";
import HoardItem from "./_HoardItem";
import { itemActivity, itemProperty, itemUses } from "./_ItemActivities";

/**
 * Brambleheart Quiver. DDB ships it as a container, but a container can hold no activities, so it
 * imports as a plain wondrous item (NON_CONTAINERS). Its uses are the 4 magic arrows grown on it,
 * 1d3 + 1 regrown at dawn. Picking one enchants an arrow with +2 for the minute it stays magical.
 * After a hit with one, a bonus action command word deals 2d4 piercing to the target and grows a
 * Spike Growth field around a point within 5 feet of it, without concentration, until the start of
 * your next turn.
 */
export default class BrambleheartQuiver extends DDBEnricherData {

  static PICK = "Pick a Magic Arrow";

  static FIELD = "Thorn Field";

  static FIELD_DAMAGE = "Thorn Field: Movement Damage";

  override get stopDefaultActivity(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "4", [{ period: "dawn", type: "formula", formula: "1d3 + 1" }]);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      HoardItem.withDuration({
        init: { name: BrambleheartQuiver.PICK, type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateTarget: true,
          activationOverride: { type: "special", value: null, condition: "Pick an arrow grown on the quiver (no action required)" },
        },
        overrides: {
          targetType: "self",
          noTemplate: true,
          addItemConsume: true,
          itemConsumeValue: "1",
          data: {
            restrictions: { type: "consumable", categories: ["ammo"], allowMagical: true },
          },
        },
      }, "minute", "1"),
      HoardItem.withDuration(itemProperty("Thorn Command", DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["piercing"] })],
        activationType: "bonus",
        condition: "You hit a target with one of the quiver's magic arrows: the arrow becomes a field of thorns",
        range: { value: null, units: "any" },
        noeffect: true,
      })),
      HoardItem.withDuration(itemActivity(BrambleheartQuiver.FIELD, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        noeffect: true,
        // the field is the 20-foot Spike Growth area, placed as a template; its movement damage is
        // rolled by hand with the field damage activity
        noTemplate: false,
      }, {
        activationOverride: { type: "special", value: null, condition: "Part of the Thorn Command: centred on a point within 5 feet of the target" },
        rangeOverride: { value: "5", units: "ft" },
        targetOverride: {
          affects: { type: "", count: "", choice: false },
          template: { type: "radius", size: "20", units: "ft", count: "1", contiguous: false, width: "", height: "" },
        },
      }), "round", "1"),
      HoardItem.withDuration(itemActivity(BrambleheartQuiver.FIELD_DAMAGE, DDBEnricherData.ACTIVITY_TYPES.DAMAGE, {
        data: {
          damage: { includeBase: false, parts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["piercing"] })] },
        },
      }, {
        generateDamage: true,
        damageParts: [DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["piercing"] })],
        activationOverride: { type: "special", value: null, condition: "Moves 5 feet in the thorn field (2d4 per 5 feet moved)" },
        targetOverride: { affects: { type: "creature", count: "1", choice: false }, template: { type: "" } },
      })),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Brambleheart Arrow",
        type: "enchant",
        activityMatch: BrambleheartQuiver.PICK,
        // the magical bonus helper names the arrow "{} (Brambleheart Arrow)" from the effect name
        magicalBonus: { makeMagical: true, bonus: "2" },
        options: {
          description: "A thorned arrow picked from the Brambleheart Quiver: +2 to attack and damage rolls while you are attuned to the quiver. It stops being magical 1 minute after it is picked.",
        },
      },
    ];
  }

}
