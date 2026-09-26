import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

/**
 * The haint drifts around the INSPIRED creature, so its 15-foot aura is an emanation placed on that
 * creature's token (click it when placing), which then follows it, not one on the bard. Inside it the
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
        template: { type: "radius", size: "15" },
        affects: "ally",
        range: "60",
        activationType: "special",
        activationCondition: "When you inspire a creature with Bardic Inspiration; place it on that creature",
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
