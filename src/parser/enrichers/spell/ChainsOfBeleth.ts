import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The chains roll a save as they burst out, with the piercing damage, then a second kind of save,
 * with no damage, for a creature that enters the area or starts its turn there. DDB's second
 * damage part is the bludgeoning a Restrained creature takes at the end of its turn. Both of
 * those, and the check to break free, are free rolls made by hand.
 */
export default class ChainsOfBeleth extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      damageParts: [
        DDBEnricherData.basicDamagePart({ number: 8, denomination: 6, types: ["piercing"], scalingMode: "whole", scalingNumber: 1 }),
      ],
      data: {
        damage: { onSave: "none" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the chains for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Crushing Chains", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: true,
          partialDamageParts: [1],
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A creature Restrained by the chains ends its turn",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Break Free", type: DDBEnricherData.ACTIVITY_TYPES.CHECK },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          generateConsumption: false,
          noSpellslot: true,
          checkOverride: { ability: "", associated: ["ath"], dc: { calculation: "spellcasting", formula: "" } },
        },
        overrides: { noeffect: true, noTemplate: true, activationType: "action" },
      },
    ];
  }

  // the parsed Restrained effect would also ride on the crushing damage, which restrains no one
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Restrained",
        activitiesMatch: ["Cast", "Ongoing Save"],
        statuses: ["Restrained"],
        options: {
          transfer: false,
          description: "Restrained while in the area or until it breaks free with a Strength (Athletics) check against the spell save DC.",
        },
      },
    ];
  }

}
