import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "./_ItemRegions";

/**
 * The shadow twin of the Helm of Brilliance. While it holds a sapphire the wearer's 120-foot
 * blindsight area also harms the living, so that area is a 120-foot emanation whose region rolls
 * the necrotic damage for anything that starts its turn inside and is neither Undead nor a
 * Construct. The parser's single save is reshaped into the rays released when the helm is
 * destroyed.
 */
export default class CrownOfInfiniteMidnight extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Destruction: Shadowy Rays",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Rolled a 1 on the d20 after failing a save against a spell and taking Necrotic damage",
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
      regionPlacer("Sapphire Blindsight", {
        template: { type: "radius", size: "120" },
        activationType: "special",
        activationCondition: "While the helm has at least one sapphire",
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: "Sapphire Blindsight Damage",
            excludeTypes: ["undead", "construct"],
            excludeSelf: true,
          }),
        ],
      }),
      regionTrigger("Sapphire Blindsight Damage", {
        condition: "A living creature starts its turn within the wearer's blindsight",
        damageParts: [
          DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] }),
        ],
      }),
    ];
  }

}
