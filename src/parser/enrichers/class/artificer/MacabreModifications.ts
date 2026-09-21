import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

const GAUNT_SAVE = "Macabre Modification: Gaunt Save";

/**
 * The Gaunt aura belongs to the reanimated companion, which the artificer's feature cannot reach
 * as a document. It is placed from here instead: an emanation attaches to the token the user
 * clicks, so the artificer places it on the companion and it fires the save kept on this feature.
 */
export default class MacabreModifications extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
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
      regionPlacer("Macabre Modification: Gaunt Aura", {
        template: { type: "radius", size: "10", count: "1" },
        affects: "enemy",
        activationType: "special",
        activationCondition: "Place on the reanimated companion's token",
        duration: { units: "perm" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenTurnStart"],
            activityName: GAUNT_SAVE,
            excludeSelf: true,
          }),
        ],
      }),
      {
        init: {
          name: GAUNT_SAVE,
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "A hostile creature of your choice starts its turn within 10 feet of the companion",
          targetType: "enemy",
          // the aura holds the area; the save is rolled for the one creature it fires at
          noTemplate: true,
          noConsumeTargets: true,
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
            duration: { override: true, value: "", units: "inst" },
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

  override get effects(): IDDBEffectHint[] {
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
          DDBEnricherData.ChangeHelper.upgradeChange("45", 20, "system.attributes.movement.speeds.walk"),
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.climb"),
        ],
        activityMatch: "Macabre Modification: Gaunt",
        data: {
          duration: {
            value: null,
            units: null as unknown as TEffectDurationUnit, // null clears the duration units; local type is narrower
          },
        },
      },
      {
        name: "Macabre Modification: Moist",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.swim"),
        ],
        activityMatch: "Macabre Modification: Moist",
      },
      {
        name: "Macabre Modification: Gaunt Save",
        statuses: ["Frightened"],
        options: {
          // "Frightened condition until the start of its next turn"
          expiry: "targetStart",
        },
        activityMatch: GAUNT_SAVE,
        data: {
          duration: {
            value: null,
            units: null as unknown as TEffectDurationUnit, // null clears the duration units; local type is narrower
          },
        },
      },
    ];
  }

}
