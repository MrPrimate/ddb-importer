import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

/**
 * The parser's save is the bonus-action gravity wave, which strikes one creature and places
 * nothing. The gravity field itself is a 20-foot emanation held with concentration for up to 10
 * minutes, once per dusk: difficult terrain for enemies. Friendly creatures moving at half cost
 * has no region equivalent and stays a note.
 */
export default class RingOfLunarMight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Gravity Wave",
      targetType: "creature",
      targetCount: 1,
      activationType: "bonus",
      activationCondition: "A creature you can see inside the gravity field",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        save: { ability: ["str"], dc: { calculation: "", formula: "16" } },
        damage: { onSave: "none" },
        range: { override: true, value: "20", units: "ft" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Gravity Field", {
        template: { type: "radius", size: "20" },
        affects: "enemy",
        activationCondition: "Friendly creatures other than you spend 1 foot of movement for every 2 feet moved inside",
        duration: { value: "10", units: "minute", concentration: true },
        uses: { spent: 0, max: "1", recovery: [{ period: "dusk", type: "recoverAll" }] },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
        ],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Gravity Wave",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
