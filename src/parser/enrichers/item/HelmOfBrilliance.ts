import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A multi-property helm. The parser's single save is the closest match for the beams released
 * when the helm is destroyed, so it is reshaped into that; the diamond light's radiant damage is
 * an activity rolled by hand for any Undead that starts its turn within 30 feet of the wearer.
 * The helm's spells arrive as cast activities from DDB's own spell list.
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
      {
        init: { name: "Diamond Light Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["radiant"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "While the helm has at least one diamond: an Undead starts its turn within 30 feet of the wearer",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

}
