import DDBEnricherData from "../data/DDBEnricherData";
import { itemText, itemUses } from "./_ItemActivities";

/**
 * One enricher for every armour type and rarity. The parser's reaction is Repulse; the Aura is an
 * emanation whose radius grows with rarity (20, 30 or 40 feet) and lasts until the wearer's next
 * turn; it is difficult terrain for the ferrous creatures the wearer picks, which is left to the
 * table. DDB carries no charges for the armour.
 */
export default class Haemscale extends DDBEnricherData {

  /** The unsuffixed "rarity varies" entry names no radius, so it takes the smallest. */
  get auraRadius(): string {
    const match = (/aura with a (\d+)-foot radius/i).exec(itemText(this));
    return match ? match[1] : "20";
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Repulse",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "Targeted by a weapon attack using a ferrous weapon or ammunition: the attack roll has Disadvantage",
      addItemConsume: true,
      noTemplate: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Arcanomagnetic Aura", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "bonus",
            value: null,
            condition: "Difficult terrain for creatures of your choice that are made of ferrous metal or wear ferrous armour",
          },
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, units: "ft", type: "radius", size: this.auraRadius },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "round" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "dawn", type: "formula", formula: "1d4 + 3" }]);
  }

}
