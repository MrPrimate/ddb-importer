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

  get _activityPaladin() {
    return {
      type: "none",
    };
  }


  get activity() {
    if (this.is2014) {
      if (this.isClass("Cleric")) {
        return this._activityCleric2014;
      } else if (this.isClass("Paladin")) {
        return this._activityPaladin;
      }
    } else if (this.is2024) {
      if (this.isClass("Cleric")) {
        return this._activityCleric2024;
      } else if (this.isClass("Paladin")) {
        return this._activityPaladin;
      }
    }

    return null;

  }

  get _additionalActivitiesCleric2014() {
    return [
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
              special: "Undead Creatures",
            },
          },
        },
      },
    ];
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

  get _additionalActivitiesPaladin2014() {
    return [
      { action: { name: "Channel Divinity: Sacred Weapon", type: "class" } },
      { action: { name: "Channel Divinity: Turn the Unholy", type: "class" } },
      { action: { name: "Channel Divinity: Conquering Presence", type: "class" } },
      { action: { name: "Channel Divinity: Guided Strike", type: "class" } },
      { action: { name: "Channel Divinity: Peerless Athlete", type: "class" } },
      { action: { name: "Channel Divinity: Inspiring Smite", type: "class" } },
      { action: { name: "Channel Divinity: Emissary of Peace", type: "class" } },
      { action: { name: "Channel Divinity: Rebuke the Violent", type: "class" } },
      { action: { name: "Channel Divinity: Nature’s Wrath", type: "class" } },
      { action: { name: "Channel Divinity: Turn the Faithless", type: "class" } },
      { action: { name: "Channel Divinity: Champion Challenge", type: "class" } },
      { action: { name: "Channel Divinity: Turn the Tide", type: "class" } },
      { action: { name: "Channel Divinity: Watcher's Will", type: "class" } },
      { action: { name: "Channel Divinity: Abjure the Extraplanar", type: "class" } },
      { action: { name: "Channel Divinity: Abjure Enemy", type: "class" } },
      { action: { name: "Channel Divinity: Vow of Enmity", type: "class" } },
      { action: { name: "Channel Divinity: Control Undead", type: "class" } },
      { action: { name: "Channel Divinity: Dreadful Aspect", type: "class" } },
      { action: { name: "Channel Divinity: Vow of Sustenance", type: "class" } },
      { action: { name: "Channel Divinity: Share Vitality", type: "class" } },
      { action: { name: "Channel Divinity: Marine Layer", type: "class" } },
      { action: { name: "Channel Divinity: Fury of the Tides", type: "class" } },
      { action: { name: "Channel Divinity: Absorb Magic", type: "class" } },
      { action: { name: "Channel Divinity: Expeditious Command", type: "class" } },
      { action: { name: "Channel Divinity: Mark of the Heretic", type: "class" } },
      { action: { name: "Channel Divinity: Inquisitor's Eye", type: "class" } },
    ];
  }

  get additionalActivities() {
    if (this.is2014) {
      if (this.ddbParser.klass === "Cleric") {
        return this._additionalActivitiesCleric2014;
      } else if (this.ddbParser.klass === "Paladin") {
        return this._additionalActivitiesPaladin2014;
      }
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
