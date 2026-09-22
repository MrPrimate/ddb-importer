import RegionBehaviorSettings from "../../../lib/RegionBehaviorSettings";
import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger, regionTarget } from "../data/RegionBuilders";

/**
 * A charge fires a bolt whose vacuum rolls a Strength save at once and makes its 20-foot-radius
 * circle difficult terrain until the start of the wielder's next turn, when the point erupts for
 * a second save. The region remains until that one-shot owner-turn eruption resolves.
 */
export default class RiptideCrossbow extends DDBEnricherData {
  // the parser turns the eruption's damage into a second weapon attack, which it is not
  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const automated = RegionBehaviorSettings.add;
    const eruption = regionTrigger("Eruption", {
      condition: "Start of your next turn after Spectral Tides",
      save: { ability: ["str"], dc: "15" },
      damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 10, types: ["bludgeoning"] })],
      onSave: "half",
    });
    if (!automated) {
      eruption.overrides!.noTemplate = false;
      eruption.build!.targetOverride = regionTarget({ type: "circle", size: "20" });
      eruption.build!.rangeOverride = { override: true, value: "100", units: "ft" };
    }
    return [
      regionPlacer("Spectral Tides", {
        template: { type: "circle", size: "20" },
        range: "100",
        activationCondition: "Pulled 15 feet toward the point on a failure, 5 feet on a success",
        duration: automated
          ? { units: "spec", special: "Until the start of your next turn" }
          : { units: "round", value: "1" },
        consume: true,
        save: { ability: ["str"], dc: "15" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["liquid"] }),
          DDBEnricherData.BehaviorHelper.activity({
            ownerTurn: true,
            events: ["tokenTurnStart"],
            activityName: "Eruption",
            deleteAfterUse: true,
            fallbackDuration: 6,
          }),
        ],
      }),
      eruption,
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
