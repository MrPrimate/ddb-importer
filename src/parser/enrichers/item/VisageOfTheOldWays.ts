import DDBEnricherData from "../data/DDBEnricherData";
import { itemText } from "./_ItemActivities";

/**
 * One enricher for every rarity of the mask. The parser's bonus-action damage roll is the extra
 * fire damage from burning. Sacrificial Flame arrives at Very Rare: the emanation originates from
 * a dying creature's body, not from the wearer, so it is a 10-foot circle dropped on that body,
 * with the fire damage rolled by hand for an enemy that starts its turn inside.
 */
export default class VisageOfTheOldWays extends DDBEnricherData {

  get hasSacrificialFlame(): boolean {
    return (/Sacrificial Flame/i).test(itemText(this));
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Fire Within",
      activationType: "special",
      activationCondition: "While burning, on a hit with a weapon attack (a Bonus Action starts or stops the burning)",
      noConsumeTargets: true,
      noTemplate: true,
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["fire"] }),
      ],
      data: {
        range: { override: true, value: null, units: "self", special: "" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.hasSacrificialFlame) return [];
    return [
      {
        init: { name: "Sacrificial Flame", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
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
            condition: "A creature you can see with 0 Hit Points; the flame goes out if it regains any",
          },
          targetOverride: {
            override: true,
            affects: { type: "enemy" },
            template: { contiguous: false, units: "ft", type: "circle", size: "10" },
          },
          rangeOverride: { override: true, value: "30", units: "ft" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Sacrificial Flame Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature Hostile to you starts its turn within 10 feet of the burning body",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

}
