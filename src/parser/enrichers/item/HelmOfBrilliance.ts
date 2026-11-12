import DDBEnricherData from "../data/DDBEnricherData";
import { regionPlacer, regionTrigger } from "../data/RegionBuilders";

/**
 * A multi-property helm. The parser's single save is the closest match for the beams released
 * when the helm is destroyed, so it is reshaped into that; the diamond light becomes a 30-foot
 * emanation on the wearer whose region rolls the radiant damage for any Undead that starts its
 * turn inside. The helm's spells arrive as cast activities from DDB's own spell list. As the
 * official DMG item, the fire opal's flames are an enchantment on a weapon; the official enchantment
 * has no changes, so this one adds the extra 1d6 Fire damage to the weapon's attack.
 */
export default class HelmOfBrilliance extends DDBEnricherData {

  static FLAMES_NAME = "Fire Opal Flames";

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
      {
        init: { name: HelmOfBrilliance.FLAMES_NAME, type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT },
        build: { generateActivation: true, generateConsumption: false },
        overrides: {
          activationType: "action",
          activationCondition: "While the helm has at least one fire opal, on a weapon you are holding",
          noConsumeTargets: true,
          noTemplate: true,
          targetType: "object",
          targetCount: "1",
          data: {
            restrictions: { type: "weapon", allowMagical: true },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Burst Into Flames",
        type: "enchant",
        activityMatch: HelmOfBrilliance.FLAMES_NAME,
        options: {
          transfer: false,
          description: "The weapon deals an extra 1d6 Fire damage on a hit until you use a Bonus Action to end the flames or stop holding it.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (Flaming)", 20, "name"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(
            JSON.stringify({ number: 1, denomination: 6, types: ["fire"] }),
            20,
            "activities[attack].damage.parts",
          ),
        ],
      },
    ];
  }

}
