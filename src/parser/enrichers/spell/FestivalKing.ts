import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The aura belongs to the chosen creature, not the caster,
 * so the area is a 20-foot circle dropped on the target. DDB gives the spell no template. The
 * save a creature makes against the aura is a free roll made by hand.
 */
export default class FestivalKing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the aura does to a creature belongs to the free roll, not to the cast
      noeffect: true,
      data: {
        target: {
          override: true,
          affects: { type: "creature" },
          template: { contiguous: false, units: "ft", type: "circle", size: "20", count: "1" },
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
          generateDamage: false,
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Moves within 20 feet of the Festival King for the first time on a turn or starts its turn there; automatic success if it can't be charmed",
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
        name: "Enamored with the Festival King",
        activityMatch: "Ongoing Save",
        options: {
          transfer: false,
          description: "Spends its action and Bonus Action at the start of its turn admiring the Festival King. Ends if it starts its turn outside the aura.",
        },
      },
    ];
  }

}
