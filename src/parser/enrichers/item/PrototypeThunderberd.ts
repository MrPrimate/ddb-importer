import DDBEnricherData from "../data/DDBEnricherData";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Prototype Thunderberd: fired as a crossbow during the Attack action, it spends 1 or more
 * charges for a 1 foot wide line 10 feet long plus 10 per charge; each creature in it makes a
 * Dexterity save against 1d6 piercing plus 1d6 lightning per charge, half on a success.
 * `@scaling` counts the charges (it is 1 on an unscaled use). Spending the last charge and
 * rolling a 1 on a d20 blows the halberd apart.
 */
export default class PrototypeThunderberd extends WeaponProperties {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty("Bolt Shot", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["piercing"] }),
          DDBEnricherData.basicDamagePart({ customFormula: "(@scaling)d6", types: ["lightning"] }),
        ],
        onSave: "half",
        condition: "Instead of an attack during the Attack action, with a bolt loaded; the line is 10 feet long plus 10 feet per charge",
        template: { type: "line", size: "20", width: "1" },
        range: { value: null, units: "self" },
        charges: "1",
        scalingMax: "@item.uses.value",
        noeffect: true,
      }),
      itemProperty("Overcharged Explosion", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 10, denomination: 6, types: ["piercing"] })],
        onSave: "half",
        condition: "You expend the last charge and roll a 1 on a d20: the halberd is destroyed",
        template: { type: "radius", size: "10" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

}
