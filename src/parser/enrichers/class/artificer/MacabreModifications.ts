import DDBEnricherData from "../../data/DDBEnricherData";

export default class MacabreModifications extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Strange Modification: Bloated",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          data: {
            restrictions: {
              allowMagical: true,
            },
          },
        },
      },
      {
        init: {
          name: "Strange Modification: Gaunt",
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
          name: "Strange Modification: Gaunt Save",
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
          name: "Strange Modification: Moist",
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
          name: "Strange Modification: Moist Damage",
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
      {
        type: "enchant",
        name: "Strange Modification: Bloated",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@abilities.int.mod", 10, "activities[save].damage.bonus"),
        ],
        activityMatch: "Strange Modification: Bloated",
      },
      {
        name: "Strange Modification: Gaunt",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("45", 20, "system.attributes.movement.walk"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.climb"),
        ],
        activityMatch: "Strange Modification: Gaunt",
      },
      {
        name: "Strange Modification: Moist",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.swim"),
        ],
        activityMatch: "Strange Modification: Moist",
      },
      {
        name: "Strange Modification: Gaunt Save",
        statuses: ["Frightened"],
        options: {
          durationSeconds: 6,
          expiry: "turnStart",
        },
        activityMatch: "Strange Modification: Gaunt Save",
      },
    ];
  }

}
