import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Shadowmourne (World of Warcraft): Chaos Bane, a Bonus Action with at least 12 Temporary Hit Points,
 * sacrifices them all; each creature of your choice in a 15-foot Emanation makes a DC 21
 * Constitution save, taking damage equal to the Temporary Hit Points sacrificed, half on a success,
 * and you have Advantage on attack rolls and saves until the end of your next turn. The text gives
 * the damage no type. The weapon's attack and Soul Fragments damage are DDB's.
 */
export default class Shadowmourne extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Chaos Bane", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateDamage: true,
          generateConsumption: false,
          activationOverride: { type: "bonus", value: 1, condition: "You have at least 12 Temporary Hit Points; sacrifice them all" },
          targetOverride: {
            override: true,
            affects: { type: "creature", choice: true },
            template: { contiguous: false, type: "radius", size: "15", units: "ft" },
          },
          rangeOverride: { override: true, units: "self" },
          saveOverride: { ability: ["con"], dc: { calculation: "", formula: "21" } },
          onSave: "half",
          damageParts: [DDBEnricherData.basicDamagePart({ customFormula: "@attributes.hp.temp", types: [] })],
        },
        overrides: {
          noeffect: true,
        },
      },
      {
        init: { name: "Chaos Bane: Empower", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateConsumption: false,
          activationOverride: { type: "special", value: 1, condition: "After Chaos Bane" },
          targetOverride: { override: true, affects: { type: "self" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Chaos Bane",
        activityMatch: "Chaos Bane: Empower",
        options: { transfer: false, expiry: "sourceEnd" },
        changes: [
          DDBEnricherData.ChangeHelper.advantageAttackChange(),
          ...["str", "dex", "con", "int", "wis", "cha"].map((ability) => DDBEnricherData.ChangeHelper.advantageAbilitySaveChange(ability)),
        ],
      },
    ];
  }

}
