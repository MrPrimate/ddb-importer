import DDBEnricherData from "../../data/DDBEnricherData";

export default class MacabreModifications extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      // {
      //   init: {
      //     name: "Macabre Modification: Bloated",
      //     type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
      //   },
      //   build: {
      //     generateActivation: true,
      //     generateDamage: false,
      //   },
      //   overrides: {
      //     noTemplate: true,
      //     data: {
      //       restrictions: {
      //         allowMagical: true,
      //       },
      //     },
      //   },
      // },
      {
        init: {
          name: "Macabre Modification: Bloated Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@abilities.int.mod",
                  types: ["necrotic"],
                }),
              ],
            },
          },
        },
      },
      {
        init: {
          name: "Macabre Modification: Gaunt",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          noTemplate: true,
          activationType: "special",
          targetType: "creature",
        },
      },
      {
        init: {
          name: "Macabre Modification: Gaunt Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
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
                type: "enemy",
                choice: true,
              },
              template: {
                count: "",
                contiguous: false,
                type: "radius",
                size: "10",
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
          name: "Macabre Modification: Moist",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
        },
      },
      {
        init: {
          name: "Macabre Modification: Moist Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          activationType: "special",
          targetType: "creature",
          data: {
            damage: {
              parts: [
                DDBEnricherData.basicDamagePart({
                  customFormula: "@abilities.int.mod",
                  types: ["acid"],
                }),
              ],
            },
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      // {
      //   type: "enchant",
      //   name: "Macabre Modification: Bloated",
      //   changes: [
      //     DDBEnricherData.ChangeHelper.addChange("@abilities.int.mod", 10, "system.damage.bonus"),
      //   ],
      //   activityMatch: "Macabre Modification: Bloated",
      //   data: {
      //     duration: {
      //       seconds: null,
      //     },
      //   },
      // },
      {
        name: "Macabre Modification: Gaunt",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("45", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
        ],
        activityMatch: "Macabre Modification: Gaunt",
        data: {
          duration: {
            seconds: null,
          },
        },
      },
      {
        name: "Macabre Modification: Moist",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
        activityMatch: "Macabre Modification: Moist",
      },
      {
        name: "Macabre Modification: Gaunt Save",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 6,
          expiry: "turnStart",
        },
        activityMatch: "Macabre Modification: Gaunt Save",
        data: {
          duration: {
            seconds: null,
          },
        },
      },
    ];
  }

}
