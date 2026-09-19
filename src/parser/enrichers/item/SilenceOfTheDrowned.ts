import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacerData } from "./_ItemRegions";

/**
 * Drinking the potion rolls nothing: it places a 20-foot emanation on the drinker for 10 minutes
 * that applies the stock Silenced effect, as the Silence spell does. The ink spit is only
 * available at heightened potency, so it is a separate save that spends nothing.
 */
export default class SilenceOfTheDrowned extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return regionPlacerData("Drink", {
      template: { type: "radius", size: "20" },
      activationType: "bonus",
      duration: { value: "10", units: "minute" },
      consume: true,
      behaviors: [
        DDBEnricherData.BehaviorHelper.applyEffect({
          effects: DDBEnricherData.SRDEffects.spell("silenced"),
        }),
      ],
    });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Spit Ink", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "13" } },
          activationOverride: { type: "bonus", value: null, condition: "Heightened Potency, while the potion lasts" },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: "30", units: "ft" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded by Ink",
        activityMatch: "Spit Ink",
        statuses: ["Blinded"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          description: "Blinded until the start of the spitter's next turn. A creature that saves is immune to the ink for 24 hours.",
        },
      },
    ];
  }

}
