import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * A multi-property helm. The parser's single save is the closest match for the beams released
 * when the helm is destroyed, so it is reshaped into that; the diamond light becomes a 30-foot
 * emanation on the wearer whose region rolls the radiant damage for any Undead that starts its
 * turn inside. The helm's spells arrive as cast activities from DDB's own spell list.
 */
export default class HelmOfBrilliance extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Destruction: Beams of Light",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Rolled a 1 on the d20 after failing a save against a spell and taking Fire damage",
      removeDamageParts: true,
      noConsumeTargets: true,
      data: {
        save: { ability: ["dex"], dc: { calculation: "", formula: "17" } },
        damage: { onSave: "none" },
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, type: "radius", size: "60", units: "ft" },
        },
        range: { override: true, value: null, units: "self", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Diamond Light", {
        template: { type: "radius", size: "30" },
        activationType: "special",
        activationCondition: "While the helm has at least one diamond",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Diamond Light Damage",
            types: ["undead"],
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Diamond Light Damage", {
        condition: "An Undead starts its turn in the helm's light",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["radiant"] }),
        ],
      }),
    ];
  }

}
