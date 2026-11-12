import DDBEnricherData from "../data/DDBEnricherData";

export default class SiegeStaff extends DDBEnricherData {

  get activity(): IDDBActivityData {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
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
      DDBEnricherData.maximumDamageActivity({
        condition: "When you attack an object with the staff and hit",
        parameters: { title: "Maximum Damage Against an Object", thisItem: true },
      }),
    ];
  }

  // AC5e cannot tell an object from a creature, so maximising the staff's dice is a tick box
  get effects(): IDDBEffectHint[] {
    return [
      DDBEnricherData.maximumDamageEffect({
        name: "Siege Staff: Objects",
        description: "Maximize the staff's weapon damage dice when you hit an object.",
        condition: this.ac5eSelfItemCondition,
        addTo: "base",
        optin: true,
      }),
    ];
  }

}
