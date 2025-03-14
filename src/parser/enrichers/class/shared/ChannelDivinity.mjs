/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ChannelDivinity extends DDBEnricherData {

  get _activityCleric2024() {
    return {
      type: "heal",
      name: "Divine Spark (Healing)",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({ customFormula: "(ceil(@classes.cleric.levels/6))d8 + @abilities.wis.mod", types: ["healing"] }),
        range: {
          value: "30",
          units: "ft",
        },
      },
    };
  }

  get _activityPaladin2024() {
    return {
      type: "none",
    };
  }


  get activity() {
    if (this.is2014) {
      return {};
    } else if (this.is2024) {
      if (this.isClass("Cleric")) {
        return this._activityCleric2024;
      } else if (this.isClass("Paladin")) {
        return this._activityPaladin2024;
      }
    }

    return null;

  }

  get _additionalActivitiesCleric2024() {
    return [
      {
        constructor: {
          name: "Divine Spark (Save vs Damage)",
          type: "save",
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          saveOverride: {
            ability: ["con"],
            dc: { calculation: "wis", formula: "" },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({ customFormula: "(ceil(@classes.cleric.levels/6))d8 + @abilities.wis.mod", types: ["radiant", "necrotic"] }),
          ],
          onSave: "half",
          rangeOverride: {
            units: "ft",
            value: "30",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
              choice: false,
              special: "",
            },
          },
        },
      },
      {
        constructor: {
          name: "Turn Undead",
          type: "save",
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateRange: true,
          generateConsumption: true,
          saveOverride: {
            ability: ["wis"],
            dc: { calculation: "wis", formula: "" },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
          targetOverride: {
            affects: {
              count: "",
              type: "creature",
              choice: true,
              special: "Undead Creatures of your choice",
            },
          },
        },
      },
    ];
  }

  get _additionalActivitiesPaladin2024() {
    return [
      {
        action: {
          name: "Channel Divinity: Divine Sense",
          type: "class",
          rename: ["Divine Sense"],
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ];
  }

  get additionalActivities() {
    if (this.is2014) {
      return [];
    } else if (this.is2024) {
      if (this.ddbParser.klass === "Cleric") {
        return this._additionalActivitiesCleric2024;
      } else if (this.ddbParser.klass === "Paladin") {
        return this._additionalActivitiesPaladin2024;
      }
    }

    return [];
  }

  get _effectCleric2024() {
    return {
      name: "Turned",
      options: {
        durationSeconds: 60,
        description: "The effect ends if the creature takes damage.",
      },
      data: {
        "flags.ddbimporter.activityMatch": "Turn Undead",
      },
      statuses: ["Frightened", "Incapacitated"],
    };
  }

  get _effectPaladin2024() {
    return {
      name: "Divine Sense",
      options: {
        durationSeconds: 600,
      },
    };
  }

  get effects() {
    if (this.is2014) {
      return [];
    } else if (this.is2024) {
      if (this.isClass("Cleric")) {
        return [this._effectCleric2024];
      } else if (this.isClass("Paladin")) {
        return [this._effectPaladin2024];
      }
    }

    return null;
  }

  get override() {
    if (this.is2014) return null;

    return {
      data: {
        "system.uses.recovery": [
          { period: "sr", type: 'formula', formula: "1" },
          { period: "lr", type: 'recoverAll', formula: undefined },
        ],
      },
    };
  }

}
