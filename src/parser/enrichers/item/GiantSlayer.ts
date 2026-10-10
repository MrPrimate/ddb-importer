import DDBEnricherData from "../data/DDBEnricherData";
import utils from "../../../lib/Utils";
import { noExtraAttackDamage, unrestrictedDamageParts, weaponRange } from "./_ItemActivities";

/**
 * Giant Slayer: a hit against a Giant deals an extra 2d6 of the weapon's type. A rule condition
 * cannot see the target, so the record DDB leaves unrestricted gets an "Against Giants" attack
 * beside the plain one, the same shape as the "Restriction:" attack its weapon variants get from
 * DDB's "Against Giants" modifier. The prone save the parser builds as an action is retimed to
 * the hit on a Giant, on the plain record and on every weapon variant.
 */
export default class GiantSlayer extends DDBEnricherData {

  static AGAINST_GIANTS = "Against Giants";

  // the parser's save rider (Whelm's Shock Wave, Giant Slayer's prone save) stays beside the
  // attack built here
  override get keepParsedActivities(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData | null {
    return unrestrictedDamageParts(this).length > 0 ? noExtraAttackDamage() : null;
  }

  override get override(): IDDBOverrideData {
    const reach = weaponRange(this);
    return {
      func: ({ enricher }) => {
        const activities = (enricher.data.system as { activities?: Record<string, I5eActivity> }).activities ?? {};
        for (const activity of Object.values(activities)) {
          if (activity.type !== "save") continue;
          // fresh objects: the parser's activities share activation, range and target objects
          activity.activation = { type: "special", value: null, condition: "When you hit a Giant with this weapon" } as I5eActivity["activation"];
          activity.range = { override: true, value: reach.value, units: reach.units, special: "" } as I5eActivity["range"];
          activity.target = {
            override: true,
            template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
            affects: { count: "1", type: "creature", choice: false, special: "The Giant you hit" },
            prompt: false,
          } as I5eActivity["target"];
        }
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const parts = unrestrictedDamageParts(this);
    if (parts.length === 0) return [];
    return [
      {
        init: {
          name: GiantSlayer.AGAINST_GIANTS,
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
          id: utils.namedIDStub(GiantSlayer.AGAINST_GIANTS, { prefix: "ddbItem" }),
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          includeBaseDamage: true,
          damageParts: parts,
          activationOverride: { type: "action", value: 1, condition: "Attacking a Giant" },
          noeffect: true,
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
          data: { damage: { includeBase: true, parts } },
        },
      },
    ];
  }

}
