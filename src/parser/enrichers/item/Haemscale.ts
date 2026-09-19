import DDBEnricherData from "../data/DDBEnricherData";
import { itemText, itemUses } from "./_ItemActivities";
import { regionPlacer } from "./_ItemRegions";

/**
 * One enricher for every armour type and rarity. The parser's reaction is Repulse; the Aura is an
 * emanation whose radius grows with rarity (20, 30 or 40 feet) and lasts until the wearer's next
 * turn. The rules let the wearer pick which ferrous creatures it hinders, which a region cannot
 * ask, so it is difficult terrain for enemies. DDB carries no charges for the armour.
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
      regionPlacer("Arcanomagnetic Aura", {
        template: { type: "radius", size: this.auraRadius },
        affects: "enemy",
        activationType: "bonus",
        activationCondition: "Hinders creatures of your choice that are made of ferrous metal or wear ferrous armour",
        duration: { value: "1", units: "round" },
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      }),
    ];
  }

  override get override(): IDDBOverrideData {
    return itemUses(this, "7", [{ period: "dawn", type: "formula", formula: "1d4 + 3" }]);
  }

}
