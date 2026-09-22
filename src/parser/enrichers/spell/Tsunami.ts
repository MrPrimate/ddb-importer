import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Tsunami: the wave loses 1d10 of damage each round, tracked as six uses that the cast fills and each start-of-turn save spends.
 */
export default class Tsunami extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Create Tsunami",
      addItemConsume: true,
      itemConsumeValue: "-6",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Start of Turn Wave",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateDuration: true,
          durationOverride: {
            units: "inst",
            concentration: false,
          },
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          noSpellslot: true,
          noeffect: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "At the start of each of your turns the wave moves 50 feet and loses 1d10 of damage",
          },
          saveOverride: {
            ability: ["str"],
            dc: { calculation: "spellcasting", formula: "" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(@item.uses.value)d10",
              types: ["bludgeoning"],
            }),
          ],
          targetOverride: {
            affects: { count: "", type: "creature", choice: false, special: "" },
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeValue: 1,
          data: {
            damage: { onSave: "half" },
          },
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        max: "6",
        spent: 0,
        recovery: [],
      },
    };
  }

}
