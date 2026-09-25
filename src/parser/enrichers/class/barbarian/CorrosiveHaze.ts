import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * The upgraded smoke blinds. Placing it rolls nothing: the 10-foot emanation is a template only,
 * and a separate Constitution save, against a DC built on the barbarian's own Constitution, is
 * rolled by hand at a hostile creature that enters the smoke or starts its turn there. The
 * parser's Blinded effect already ends at the start of the creature's next turn, so it is kept
 * and only steered away from the placer.
 */
export default class CorrosiveHaze extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Emanate Corrosive Smoke",
      targetType: "enemy",
      activationType: "special",
      activationCondition: "While raging",
      noConsumeTargets: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { contiguous: false, units: "ft", type: "radius", size: "10" },
        },
        range: { override: true, value: null, units: "self", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Corrosive Haze Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "con", formula: "" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "A hostile creature enters the smoke or starts its turn there; creatures that don't rely on eyesight are immune",
          },
          targetOverride: {
            override: true,
            affects: { count: "1", type: "enemy" },
            template: {},
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            damage: { onSave: "none" },
          },
        },
      },
    ];
  }

}
