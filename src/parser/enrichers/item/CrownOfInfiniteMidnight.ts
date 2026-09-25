import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The shadow twin of the Helm of Brilliance. While it holds a sapphire the wearer's 120-foot
 * blindsight area also harms the living: the necrotic damage is an activity rolled by hand for
 * anything that starts its turn inside and is neither Undead nor a Construct. The parser's single
 * save is reshaped into the rays released when the helm is destroyed.
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
      {
        init: { name: "Sapphire Blindsight Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["necrotic"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "While the helm has at least one sapphire: a living creature (not Undead or a Construct) starts its turn within 120 feet of the wearer",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

}
