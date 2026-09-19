import DDBEnricherData from "../data/DDBEnricherData";
import { itemText } from "./_ItemActivities";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * One enricher for every rarity of the mask. The parser's bonus-action damage roll is the extra
 * fire damage from burning. Sacrificial Flame arrives at Very Rare: the emanation originates from
 * a dying creature's body, not from the wearer, so it is a stationary 10-foot circle dropped on
 * that body, and its region rolls the fire damage for an enemy that starts its turn inside.
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
      regionPlacer("Sacrificial Flame", {
        template: { type: "circle", size: "10" },
        range: "30",
        affects: "enemy",
        activationType: "bonus",
        activationCondition: "A creature you can see with 0 Hit Points; the flame goes out if it regains any",
        duration: { value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Sacrificial Flame Damage",
          }),
        ],
      }),
      regionTrigger("Sacrificial Flame Damage", {
        affects: "enemy",
        condition: "A creature Hostile to you starts its turn within 10 feet of the burning body",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"] }),
        ],
      }),
    ];
  }

}
