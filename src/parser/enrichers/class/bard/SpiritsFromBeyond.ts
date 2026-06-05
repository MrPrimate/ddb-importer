import DDBEnricherData from "../../data/DDBEnricherData";

export default class SpiritsFromBeyond extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Channeling",
      activationType: "special",
      data: {
        roll: {
          name: "Roll for Channeling",
          formula: "1d12",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        action: {
          name: "Controlled Channeling",
          type: "class",
        },
      },
      {
        init: {
          name: "1. Beloved",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration + @abilities.cha.mod",
            }),
          },
        },
      },
      {
        init: {
          name: "2. Sharpshooter",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@scale.bard.inspiration + @abilities.cha.mod",
                  type: "force",
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "3. Avenger",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@scale.bard.inspiration",
                  type: "force",
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "4. Renegade",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "special",
          targetType: "special",
        },
      },
      {
        // TO DO: add advantage effect
        init: {
          name: "5. Fortune Teller",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
        },
      },
      {
        init: {
          name: "6. Wayfarer",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scale.bard.inspiration + @classes.bard.levels",
              type: "temphp",
            }),
          },
        },
      },
      {
        init: {
          name: "7. Trickster",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            save: {
              ability: ["str"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              onSave: "half",
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "2 * @scale.bard.inspiration",
                  type: "force",
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "8. Shade",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
        },
      },
      {
        init: {
          name: "8. Shade - Save vs Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          activationType: "special",
          data: {
            save: {
              ability: ["con"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "2 * @scale.bard.inspiration",
                  type: "necrotic",
                }),
              ],
            },
            range: {
              units: "spec",
            },
            target: {
              affects: {
                type: "creature",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "5",
                width: "",
                height: "",
                units: "ft",
              },
            },
          },
        },
      },
      {
        init: {
          name: "9. Arsonist",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
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
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "4 * @scale.bard.inspiration",
                  type: "fire",
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "10. Coward",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          activationType: "action",
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            range: {
              units: "spec",
            },
            target: {
              affects: {
                type: "creature",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "30",
                width: "",
                height: "",
                units: "ft",
              },
            },
          },
        },
      },
      {
        init: {
          name: "11. Brute",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        overrides: {
          activationType: "action",
          data: {
            save: {
              ability: ["str"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            damage: {
              onSave: "half",
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "3 * @scale.bard.inspiration",
                  type: "thunder",
                }),
              ],
            },
            range: {
              units: "spec",
            },
            target: {
              affects: {
                type: "creature",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "30",
                width: "",
                height: "",
                units: "ft",
              },
            },
          },
        },
      },
      {
        init: {
          name: "12. Priest",
          type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
        },
        overrides: {
          activationType: "action",
          targetType: "creature",
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "2 * @scale.bard.inspiration",
              type: "healing",
            }),
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spirits from Beyond - Speed Bonus",
        options: {
          durationSeconds: null,
        },
        changes: [
          DDBEnricherData.ChangeHelper.addChange("10", 20, "system.attributes.movement.walk"),
        ],
        activityMatch: "6. Wayfarer",
      },
      {
        name: "Spirits from Beyond - Charmed",
        options: {
          durationSeconds: 6,
          expiry: "turnStart",
        },
        statuses: ["Charmed"],
        activityMatch: "7. Trickster",
      },
      {
        name: "Spirits from Beyond - Invisible",
        options: {
          durationSeconds: 6,
          expiry: "turnEnd",
        },
        statuses: ["Invisible"],
        activityMatch: "8. Shade",
      },
      {
        name: "Spirits from Beyond - Frightened",
        options: {
          durationSeconds: 6,
          expiry: "turnStart",
          description: "The creature can take either an action or a Bonus Action, not both",
        },
        daeSpecialDurations: ["turnStartSource"],
        statuses: ["Frightened"],
        activityMatch: "10. Coward",
        changes: [
          DDBEnricherData.ChangeHelper.multiplyChange("0.5", 100, "system.attributes.movement.walk"),
        ],
      },
      {
        name: "Spirits from Beyond - Prone",
        options: {
          durationSeconds: null,
        },
        statuses: ["Prone"],
        activityMatch: "11. Brute",
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        name: "Channel Spirit",
        type: "class",
      }),
    };
  }

}
