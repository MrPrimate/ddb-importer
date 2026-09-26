import DDBEnricherData from "../data/DDBEnricherData";
import { regionTrigger } from "../data/RegionBuilders";

const ONGOING = "Ongoing Save";

/**
 * A thrown orb that fills a 20-foot sphere where it shatters for 1d4 rounds, and rolls nothing as
 * it does: the region fires "Ongoing Save" at a creature that starts its turn in the scent or moves
 * into it on its turn (being inside as it spreads is not entering). A failure is Unconscious for 1
 * minute, ending early if the creature takes damage. DDB picks up the DC as an extra save ability,
 * so the save is restated.
 */
export default class WisteriaDragonPerfume extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Throw Orb",
      targetType: "creature",
      activationType: "action",
      noeffect: true,
      data: {
        // the scent fills a sphere where the orb shatters, not an emanation following whoever was clicked
        target: {
          override: true,
          affects: { type: "creature" },
          template: { count: "1", contiguous: false, type: "sphere", size: "20", units: "ft" },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            enterOn: "movement",
            activityName: ONGOING,
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [regionTrigger(ONGOING, {
      condition: "Starts its turn in the scent or enters it on its turn",
      save: { ability: ["con"], dc: "19" },
      onSave: "none",
    })];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unconscious (Wisteria Perfume)",
        activityMatch: ONGOING,
        statuses: ["Unconscious"],
        daeSpecialDurations: ["isDamaged"],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Unconscious for 1 minute. The effect ends early if the creature takes any damage. Floral dragons other than wisteria dragons have Disadvantage on the save.",
        },
      },
    ];
  }

}
