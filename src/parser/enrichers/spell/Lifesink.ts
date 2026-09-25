import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Nothing is rolled as the spell is cast. The 15-foot emanation is centred on the caster and deals
 * its damage, with no save, to any other creature that enters it or starts its turn there, a free
 * roll made by hand. The caster's own healing at the start of its turn is a second free roll.
 */
export default class Lifesink extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      removeDamageParts: true,
      // what the emanation does to a creature belongs to the free roll, not to the cast
      noeffect: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Lifesink Damage", type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE },
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
          noSpellslot: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Any other creature enters the emanation or starts its turn there",
          },
          targetOverride: { override: true, affects: { count: "1", type: "creature" }, template: {} },
        },
        overrides: {
          data: { range: { override: true, units: "spec" } },
        },
      },
      {
        init: { name: "Regain Hit Points", type: DDBEnricherData.ACTIVITY_TYPES.HEAL },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateHealing: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          noSpellslot: true,
          healingPart: DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["healing"], scalingMode: "none" }),
          activationOverride: { type: "special", value: null, condition: "Start of your turn: add 1 for each creature in the emanation" },
          targetOverride: { override: true, affects: { type: "self" }, template: {} },
        },
      },
    ];
  }

}
