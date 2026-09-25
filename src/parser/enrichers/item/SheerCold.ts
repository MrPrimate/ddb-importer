import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A natural 20 coats the ground toward the target in ice for 1 minute, as a cone or a line at the
 * wielder's choice, so each shape is its own activity. Both are icy difficult terrain, and the
 * slip save is rolled by hand for a creature that enters or starts its turn there, as is the
 * struck target's own save against being frozen in place.
 */
export default class SheerCold extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Slick Ice (Cone)", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "You rolled a 20 on the d20 for an attack with this weapon; the ice is difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "cone", size: "15" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Slick Ice (Line)", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: true,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "You rolled a 20 on the d20 for an attack with this weapon; the ice is difficult terrain",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "line", size: "30", width: "5" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
          durationOverride: { override: true, value: "1", units: "minute" },
        },
        overrides: {
          noConsumeTargets: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Slick Ice Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "10" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the ice for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
      {
        init: { name: "Frozen in Place Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "15" } },
          activationOverride: {
            type: "special",
            value: null,
            condition: "The target of the attack that rolled the 20",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Slick Ice Save",
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "Frozen in Place",
        activityMatch: "Frozen in Place Save",
        statuses: ["Restrained"],
        options: {
          transfer: false,
          expiry: "sourceStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Restrained until the start of the wielder's next turn.",
        },
      },
    ];
  }

}
