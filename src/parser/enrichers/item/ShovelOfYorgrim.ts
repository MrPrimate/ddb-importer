import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer } from "../data/RegionBuilders";

/**
 * One enricher for every rarity of the shovel. The necrotic resistance aura arrives at Very Rare,
 * so the +1 (Rare) variant keeps only its weapon attack; the unsuffixed "rarity varies" entry
 * lists every property and gets the aura too.
 */
export default class ShovelOfYorgrim extends DDBEnricherData {

  get hasDenyDeathsTouch(): boolean {
    return !(/,\s*\+1\s*$/).test(this.name);
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (!this.hasDenyDeathsTouch) return [];
    return [
      regionPlacer("Deny Death's Touch", {
        template: { type: "radius", size: "10" },
        // the holder counts as its own ally, so the emanation covers "you and your allies"
        affects: "ally",
        activationType: "special",
        activationCondition: "While holding the shovel",
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({
            effects: DDBEnricherData.SRDEffects.damageResistance("necrotic"),
          }),
        ],
      }),
    ];
  }

}
