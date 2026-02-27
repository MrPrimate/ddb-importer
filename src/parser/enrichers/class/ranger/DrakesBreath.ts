import DDBEnricherData from "../../data/DDBEnricherData";

export default class DrakesBreath extends DDBEnricherData {

  // get addAutoAdditionalActivities() {
  //   return true;
  // }

  damageTypes() {
    return [
      "acid",
      "cold",
      "fire",
      "lightning",
      "poison",
    ];
  }

  get additionalActivities() {
    if (this.isAction) return [];
    return [
      {
        action: {
          name: "Drake's Breath",
          type: "class",
        },
        overrides: {
          id: "damagDrakeBreath",
          addItemConsume: true,
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@scale.drakewarden.drakes-breath",
                  types: this.damageTypes(),
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Use With Spell Slot",
          type: "forward",
        },
        build: {
        },
        overrides: {
          activationType: "special",
          data: {
            activity: {
              id: "damagDrakeBreath",
            },
            consumption: {
              targets: [
                {
                  type: "spellSlots",
                  value: "1",
                  target: "3",
                  scaling: {},
                },
              ],
              scaling: {
                allowed: true,
                max: "",
              },
              spellSlot: true,
            },
            uses: { spent: null, max: "" },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },
    ];
  }

  // not yet implemented for features
  // get combineGrantedDamageModifiers() {
  //   return true;
  // }

  get override() {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Drake's Breath",
        max: "1",
        period: "lr",
      }),
    };
  }

}
