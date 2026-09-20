import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The 30-foot aura follows the caster and calls for the
 * save from a creature that enters it or starts its turn there, a free roll made by hand.
 * It harms creatures of the caster's choice, so the roll is aimed at enemies.
 */
export default class AuraOfDesecration extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the aura does to a creature belongs to the free roll, not to the cast
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Ongoing Save", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Enters the aura for the first time on a turn or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Desecrated",
        activityMatch: "Ongoing Save",
        options: {
          transfer: false,
          expiry: "targetStart",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Can't regain Hit Points until the start of its next turn.",
        },
      },
    ];
  }

}
