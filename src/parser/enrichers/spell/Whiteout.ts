import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast: the snow is difficult terrain and catches a creature that
 * enters it or begins its turn there, a free roll made by hand. Creatures with Resistance or
 * Immunity to Cold damage pass automatically, and the caster can spare a few named creatures; both
 * are left to the table.
 */
export default class Whiteout extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the snow does to a creature belongs to the free roll, not to the cast
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
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Begins its turn in the snow or enters it; automatic success with Resistance or Immunity to Cold damage",
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
        name: "Whiteout: Exhaustion",
        activityMatch: "Ongoing Save",
        options: {
          transfer: false,
          description: "Gains 1 Exhaustion level, which ends when the spell does. Raise the Exhaustion level by hand.",
        },
      },
    ];
  }

}
