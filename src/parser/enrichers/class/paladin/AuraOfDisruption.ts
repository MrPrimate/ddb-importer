import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * A passive emanation, 10 feet growing to 30 at level 18. "Place Aura" only draws it; the
 * Constitution save against the paladin's spell save DC is rolled by hand at a hostile creature
 * ending its turn inside while concentrating on a spell. DDB records the aura's size as the
 * save's damage; it is the template size here. Hiding allies from scrying sensors has no effect
 * form.
 */
export default class AuraOfDisruption extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Place Aura",
      targetType: "enemy",
      activationType: "special",
      noConsumeTargets: true,
      noeffect: true,
      removeDamageParts: true,
      data: {
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { contiguous: false, units: "ft", type: "radius", size: "@scale.spelldrinker.aura-of-disruption" },
        },
        range: { override: true, value: null, units: "self", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Disruption Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "A hostile creature ends its turn in the aura while concentrating on a spell: on a failure it loses Concentration",
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
