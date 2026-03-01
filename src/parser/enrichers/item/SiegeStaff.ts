import DDBEnricherData from "../data/DDBEnricherData";

export default class SiegeStaff extends DDBEnricherData {

  get activity() {
    return {
      addItemConsume: false,
      noeffect: true,
      data: {
        damage: {
          includeBase: true,
          parts: [],
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Battering Strike Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          addItemConsume: true,
          itemConsumeValue: "1",
          addConsumptionScalingMax: "@item.uses.value",
          data: {
            damage: {
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "(@scaling)d6",
                  types: ["bludgeoning"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Fire Pot Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "special",
          addItemConsume: false,
          data: {
            damage: {
              onSave: "half",
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 6,
                  types: ["fire"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Trebuchet",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          targetType: "creature",
          activationType: "action",
          addItemConsume: true,
          itemConsumeValue: "3",
          data: {
            save: {
              ability: ["dex"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              onSave: "half",
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 4,
                  denomination: 8,
                  types: ["bludgeoning"],
                }),
              ],
            },
          },
        },
      },
    ];
  }


}
