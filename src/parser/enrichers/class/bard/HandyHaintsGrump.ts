import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

/**
 * The haint drifts around the INSPIRED creature, so its 15-foot aura is a fixed circle dropped on
 * that creature and dragged along when it moves, not an emanation on the bard. Inside it the
 * creature and its allies have Advantage on Intimidation checks and Strength saves, which are
 * stock effects. DDB's "Grump: Advantage" action only restates that, with a template that would
 * follow the bard, so it is left out; its Reaction is kept.
 */
export default class HandyHaintsGrump extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get builtFeaturesFromActionFilters(): string[] {
    return ["Grump: Reaction"];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Grump: Place Aura", {
        template: { type: "circle", size: "15" },
        affects: "ally",
        range: "60",
        activationType: "special",
        activationCondition: "When you inspire a creature with Bardic Inspiration; centre it on that creature and move it with them",
        duration: { value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: [
              DDBEnricherData.SRDEffects.skillAdvantage("itm"),
              DDBEnricherData.SRDEffects.saveAdvantage("str"),
            ],
          }),
        ],
      }),
    ];
  }

}
