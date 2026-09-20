import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. A hostile creature in the field is cursed until the end
 * of its next turn, even if it leaves, so a free activity applies the curse by hand: use it on
 * hostile creatures in the field at the cast, and on one that enters it or ends its turn there.
 * DDB's damage part is what a cursed creature takes the first time it is damaged on a turn, which
 * is a second free roll, and the healing it feeds is left to the table.
 */
export default class FieldOfReaping extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // the curse belongs to the free activity, not to the cast
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Reaping Curse", type: DDBEnricherData.ACTIVITY_TYPES.UTILITY },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "A Hostile creature is in the field as it appears, enters it for the first time on a turn or ends its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Reaped Life Force", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateSave: false,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "The first time a cursed creature takes damage during a turn; a creature of your choice in the field regains that many Hit Points",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
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
        name: "Cursed (Field of Reaping)",
        activityMatch: "Reaping Curse",
        options: {
          transfer: false,
          expiry: "targetEnd",
          durationRounds: 1,
          durationSeconds: 6,
          description: "Until the end of its next turn, the first time it takes damage during a turn it takes the spell's extra Necrotic damage.",
        },
      },
    ];
  }

}
