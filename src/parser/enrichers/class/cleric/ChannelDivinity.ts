import DDBEnricherData from "../../data/DDBEnricherData";

export default class ChannelDivinity extends DDBEnricherData {

  override get activity(): IDDBActivityData | null {
    if (this.is2014) {
      return null;
    } else if (this.is2024) {
      return {
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        name: "Divine Spark (Healing)",
        targetType: "creature",
        data: {
          healing: DDBEnricherData.basicDamagePart({ customFormula: "(@scale.channel-divinity.spark)d8 + @abilities.wis.mod", types: ["healing"] }),
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
            DDBEnricherData.basicDamagePart({ customFormula: "(@scale.channel-divinity.spark)d8 + @abilities.wis.mod", types: ["radiant", "necrotic"] }),
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) {
      return this._additionalActivitiesCleric2014;
    } else if (this.is2024) {
      return this._additionalActivitiesCleric2024;
    }

    return [];
  }

  get _effectCleric2024(): IDDBEffectHint {
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

  override get effects(): IDDBEffectHint[] {
    if (this.is2014) {
      return [];
    } else if (this.is2024) {
      return [this._effectCleric2024];

    }

    // unreachable: a feature is always 2014 or 2024; the consumer treats null and [] identically
    return [];
  }

  override get override(): IDDBOverrideData | null {
    if (this.is2014) return null;
    const cleric = this.ddbParser.ddbCharacter?.raw.classes.find((klass) => klass.name === "Cleric");

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
      // The Channel Divinity scale counts uses; it must not replace activity damage.
      data: {
        flags: {
          ddbimporter: { skipScale: true },
          ...(cleric ? { dnd5e: { advancementRoot: cleric._id } } : {}),
        },
        system: {
          identifier: "channel-divinity",
          advancement: {
            divineSparkScale: {
              _id: "divineSparkScale",
              type: "ScaleValue",
              name: "Divine Spark Die Count",
              configuration: {
                identifier: "spark",
                type: "number",
                scale: {
                  2: { value: 1 },
                  7: { value: 2 },
                  13: { value: 3 },
                  18: { value: 4 },
                },
              },
              value: {},
            },
          },
        },
      },
    };
  }

}
