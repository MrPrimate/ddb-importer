import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinity extends DDBEnricherData {

  get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return null;
    } else if (this.is2024) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
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

    return null;

  }

  get _additionalActivitiesCleric2014(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Turn Undead",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  get _additionalActivitiesCleric2024(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Divine Spark (Save vs Damage)",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
        init: {
          name: "Turn Undead",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return this._additionalActivitiesCleric2014;
    } else if (this.is2024) {
      return this._additionalActivitiesCleric2024;
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
      activityMatch: "Turn Undead",
      statuses: ["Frightened", "Incapacitated"],
    };
  }

  get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [];
    } else if (this.is2024) {
      return [this._effectCleric2024];

    }

    return null;
  }

  get override(): IDDBOverrideData {
    if (this.is2014) return null;

    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Channel Divinity",
      max: "@scale.cleric.channel-divinity",
      period: "lr",
    });

    uses.recovery = [
      { period: "sr", type: "formula", formula: "1" },
      { period: "lr", type: "recoverAll", formula: undefined },
    ];

    return {
      uses,
    };
  }

}
