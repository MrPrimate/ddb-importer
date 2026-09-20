import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Spending a charge on a spell leaves a dust vortex in the caster's space. It threatens every
 * creature within 5 feet of it, so it is placed as a 5-foot emanation template, and the save is
 * rolled by hand against a creature that starts its turn inside. Each vortex drifts or vanishes
 * on a d20 at the start of the caster's turns, which means moving or deleting its template.
 */
export default class SandstormStaff extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Dust Vortex", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateDuration: false,
          generateConsumption: false,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Casting a spell with the staff as the focus: +1 to that spell's attack rolls",
          },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: { contiguous: false, units: "ft", type: "radius", size: "5" },
          },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          addItemConsume: true,
          noeffect: true,
        },
      },
      {
        init: { name: "Dust Vortex Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          saveOverride: { ability: ["con"], dc: { calculation: "spellcasting", formula: "" } },
          damageParts: [
            DDBEnricherData.basicDamagePart({ number: 1, denomination: 4, types: ["bludgeoning"] }),
          ],
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn within 5 feet of a dust vortex",
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
        init: { name: "Dust Vortex Drift", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateSave: false,
          generateDamage: false,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Start of each of your turns, once per vortex: 11 or higher moves it 5 feet in a random direction, 10 or lower ends it",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
          rangeOverride: { override: true, value: null, units: "self", special: "" },
        },
        overrides: {
          noConsumeTargets: true,
          noTemplate: true,
          data: { roll: { prompt: false, visible: false, name: "Dust Vortex Drift", formula: "1d20" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded by Dust",
        activityMatch: "Dust Vortex Save",
        statuses: ["Blinded"],
        options: {
          transfer: false,
          durationSeconds: null,
          expiry: "turnEnd",
          description: "Blinded until the end of its turn.",
        },
      },
    ];
  }

}
