import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast: the line blasts from the caster and catches a creature
 * that starts its turn in it, a free roll made by hand. Turning the line is a Bonus Action, and
 * movement toward the caster costs double; both are left to the table.
 * The Magus Class has an unrelated Bitter Wind cantrip (a plain Constitution save), which keeps
 * the default parse.
 */
export default class BitterWind extends DDBEnricherData {

  get isCantrip(): boolean {
    return (this.ddbParser?.ddbDefinition as IDDBSpellDefinition | undefined)?.level === 0;
  }

  override get type(): IDDBActivityType | null {
    if (this.isCantrip) return null;
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData | null {
    if (this.isCantrip) return null;
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the line does to a creature belongs to the free roll, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "line", size: "120", count: "1", width: "20" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isCantrip) return [];
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
          generateDamage: true,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Starts its turn in the line (Disadvantage in cold weather, in darkness, or when upcast)",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
    ];
  }

}
