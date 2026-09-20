import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The 60-foot emanation is centred on the caster, and the
 * save a creature makes when it enters it or ends its turn there is a free roll made by hand. The
 * caster names the creatures it spares, so the roll is aimed at enemies. Creatures inside can't
 * regain Hit Points and a success still halves Speed; both are left to the table. The Exhaustion
 * DDB parses belongs to the Circle casting only, so the automatic effects are replaced.
 */
export default class Dirge extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the emanation does to a creature belongs to the free roll, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { contiguous: false, units: "ft", type: "radius", size: "60", count: "1" },
        },
      },
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
            condition: "Enters the emanation or ends its turn there, or the emanation enters its space (once per turn); a success still halves its Speed; can't regain Hit Points while inside",
          },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
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
        activityMatch: "Ongoing Save",
        statuses: ["Prone"],
        options: { transfer: false, description: "Cast as a Circle spell, a failure also gives 1 Exhaustion level." },
      },
    ];
  }

}
