import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

/**
 * A charge fires a bolt whose vacuum rolls a Strength save at once and makes its 20-foot-radius
 * circle difficult terrain until the start of the wielder's next turn, when the point erupts for
 * a second save. The eruption is tied to the wielder's turn, which a region cannot see, so it is
 * its own save used by hand over the same area.
 */
export default class RiptideCrossbow extends DDBEnricherData {

  // the parser turns the eruption's damage into a second weapon attack, which it is not
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Spectral Tides", {
        template: { type: "circle", size: "20" },
        range: "100",
        activationCondition: "Pulled 15 feet toward the point on a failure, 5 feet on a success",
        duration: { value: "1", units: "round" },
        consume: true,
        save: { ability: ["str"], dc: "15" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["liquid"] }),
        ],
      }),
      regionPlacer("Eruption", {
        template: { type: "circle", size: "20" },
        range: "100",
        activationType: "special",
        activationCondition: "Start of your next turn after Spectral Tides",
        save: { ability: ["str"], dc: "15" },
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, types: ["bludgeoning"] }),
        ],
        onSave: "half",
        linkEffects: true,
        behaviors: [],
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Eruption",
        statuses: ["Prone"],
        options: { transfer: false },
      },
    ];
  }

}
