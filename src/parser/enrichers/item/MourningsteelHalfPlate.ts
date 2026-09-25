import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The parser's lone damage roll belongs to the Unholy Aura, so the primary becomes the Death
 * Transference reaction and the aura is built here: a 5-foot emanation for 1 minute, used on the
 * wearer so they gain its marker effect, with the necrotic damage rolled by hand for a Celestial
 * that moves within 5 feet or starts its turn there. Celestials having Disadvantage on attacks
 * against the wearer only is recorded on that marker effect; an effect applied to the Celestial
 * would cover all of its attacks.
 */
export default class MourningsteelHalfPlate extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Death Transference",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You are subjected to Necrotic damage: take none and gain Temporary Hit Points equal to half of it",
      removeDamageParts: true,
      noTemplate: true,
      noeffect: true,
      data: {
        range: { override: true, value: null, units: "self", special: "" },
        duration: { override: true, value: "", units: "inst" },
        uses: { spent: 0, max: "1", recovery: [{ period: "dusk", type: "recoverAll" }] },
        consumption: {
          targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
          scaling: { allowed: false, max: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Unholy Aura", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: { type: "bonus", value: null, condition: "A 5-foot emanation around you" },
          targetOverride: { override: true, affects: { type: "self" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          noTemplate: true,
          data: {
            uses: { spent: 0, max: "1", recovery: [{ period: "dusk", type: "recoverAll" }] },
            consumption: {
              targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
              scaling: { allowed: false, max: "" },
            },
          },
        },
      },
      {
        init: { name: "Unholy Aura Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateSave: false,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 10, types: ["necrotic"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "A Celestial moves within 5 feet for the first time on its turn or starts its turn there (ignores Resistance and Immunity)",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: { noConsumeTargets: true, noTemplate: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Unholy Aura",
        activityMatch: "Unholy Aura",
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Celestials have Disadvantage on attack rolls against you. Once before the aura ends, you can choose to succeed on a failed saving throw against an effect from a Celestial.",
        },
      },
    ];
  }

}
