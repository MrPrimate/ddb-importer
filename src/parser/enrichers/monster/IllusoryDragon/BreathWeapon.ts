import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The importer-built Illusory Dragon summon. The caster's bonus action moves the
 * dragon and may have it exhale a 60-foot cone; the damage type is picked when the
 * dragon is created, so all six are offered. XGtE deals 7d6, the Arcana Unleashed
 * 2024 printing 6d6. The summon activity's "match saves" links the DC to the caster.
 */
export default class BreathWeapon extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      data: {
        range: {
          units: "self",
        },
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            count: "1",
            contiguous: false,
            type: "cone",
            size: "60",
            units: "ft",
          },
        },
        save: {
          ability: ["int"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          onSave: "half",
          parts: [
            DDBEnricherData.basicDamagePart({
              number: this.is2014 ? 7 : 6,
              denomination: 6,
              types: ["acid", "cold", "fire", "lightning", "necrotic", "poison"],
              scalingMode: "none",
            }),
          ],
        },
      },
    };
  }

}
