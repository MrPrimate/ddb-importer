/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AirRender extends DDBEnricherData {

  get type() {
    return "attack";
  }

  get activity() {
    return {
      name: "Attack as Normal Bow",
      noeffect: true,
    };
  }

  get override() {
    return {
      data: {
        system: {
          magicalBonus: null,
          "ammunition.type": "",
        },
      },
    };
  }

  get addAutoAdditionalActivities() {
    return false;
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Wind Mote Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateActivation: true,
          generateTarget: true,
          noeffect: true,
        },
        overrides: {
          noeffect: true,
          data: {
            attack: {
              bonus: "1",
            },
            damage: {
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 1,
                  denomination: 6,
                  bonus: "1 + @mod",
                  types: ["bludgeoning", "piercing", "slashing"],
                }),
              ],
            },
          },
        },
      },
      {
        constructor: {
          name: "Bludgeoning Gust Save",
          type: "save",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
          generateSave: true,
        },
        overrides: {
          data: {
            save: {
              ability: "str",
              dc: {
                calculation: "",
                formula: "15",
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Slashing Tornado Save",
          type: "save",
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateSave: true,
          generateDamage: true,
          targetOverride: {
            affects: {
              type: "creature",
            },
            template: {
              type: "radius",
              size: "5",
              units: "ft",
            },
          },
        },
        overrides: {
          noeffect: true,
          data: {
            save: {
              ability: "dex",
              dc: {
                calculation: "",
                formula: "15",
              },
            },
            damage: {
              onSave: "none",
              includeBase: false,
              parts: [
                DDBEnricherData.basicDamagePart({
                  number: 2,
                  denomination: 6,
                  types: ["slashing"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

}
