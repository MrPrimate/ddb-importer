/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class AdventurersAtlas extends DDBEnricherData {
  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Create Magical Map",
      activationType: "special",
      targetType: "creature",
      addItemConsume: true,
      data: {
        sort: 2,
        duration: {
          units: "perm",
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Adventurer's Atlas Initiative Bonus",
        activitiesMatch: ["Create Magical Map"],
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.attributes.init.bonus"),
        ],
      },
      {
        name: "Adventurer's Atlas Initiative Bonus",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1d4", 20, "system.attributes.init.bonus"),
        ],
        activitiesMatch: ["Not real"],
        data: {
          _id: "ddbAtlasInitBonu",
        },
      },
      {
        name: "Magical Map",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`Magical Map`, 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("icons/sundries/scrolls/scroll-bound-green.webp", 20, "img"),
        ],
        activitiesMatch: ["Create Magical Map (Enchantment)"],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: null,
                max: 14,
              },
              activityRiders: [],
              effectRiders: ["ddbAtlasInitBonu"],
            },
          },
        },
      },
      {
        name: "Magical Map",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange(`Magical Map`, 20, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("icons/sundries/scrolls/scroll-bound-green.webp", 20, "img"),
        ],
        activitiesMatch: ["Create Magical Map (Enchantment)"],
        data: {
          flags: {
            ddbimporter: {
              effectIdLevel: {
                min: 15,
                max: null,
              },
              activityRiders: ["ddbEnchantSafeHa", "ddbEnchantUnerPa"],
              effectRiders: ["ddbAtlasInitBonu"],
            },
          },
        },
      },
    ];
  }

  get additionalActivities() {
    const results = [
      {
        constructor: {
          name: "Superior Atlas: Safe Haven",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateRange: false,
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          targetType: "self",
          noConsumeTargets: true,
          activationCondition: "You get reduced to 0 HP, and are not dead",
          data: {
            sort: 3,
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@classes.artificer.levels * 2",
              types: ["healing"],
            }),
            consumption: {
              scaling: {
                allowed: true,
                max: "20",
              },
              spellSlot: true,
              targets: [],
            },
            visibility: {
              identifier: "artificer",
              level: {
                min: 15,
                max: null,
              },
            },
          },
        },
      },
      {
        constructor: {
          name: "Superior Atlas: Unerring Path",
          type: "cast",
        },
        build: {
          generateCast: true,
          generateRange: false,
          generateActivation: false,
          generateTarget: false,
        },
        overrides: {
          activationType: "special",
          targetType: "self",
          addActivityConsume: true,
          noConsumeTargets: true,
          addSpellUuid: "Find the Path",
          data: {
            sort: 4,
            visibility: {
              identifier: "artificer",
              level: {
                min: 15,
                max: null,
              },
            },
            spell: {
              spellbook: true,
            },
            uses: {
              max: "1",
              spent: 0,
              recovery: [{ period: "lr", type: 'recoverAll', formula: undefined }],
            },
          },
        },
      },
    ];
    results.push(...this._getEnchantActivities());
    return results;
  }

  _getEnchantActivities() {
    return [
      {
        constructor: {
          name: "Create Magical Map (Enchantment)",
          type: "enchant",
        },
        build: {
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              type: "object",
            },
          },
        },
        overrides: {
          addItemConsume: true,
          data: {
            sort: 1,
            midiProperties: {
              triggeredActivityId: "none",
              triggeredActivityTargets: "targets",
              triggeredActivityRollAs: "self",
              forceDialog: false,
              confirmTargets: "never",
            },
            restrictions: {
              allowMagical: true,
            },
          },
        },
      },
      {
        constructor: {
          name: "Superior Atlas: Safe Haven",
          type: "heal",
        },
        build: {
          generateHealing: true,
          generateRange: false,
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          id: "ddbEnchantSafeHa",
          activationType: "special",
          targetType: "self",
          activationCondition: "You get reduced to 0 HP, and are not dead",
          noConsumeTargets: true,
          data: {
            healing: DDBEnricherData.basicDamagePart({
              customFormula: "@scaling *2", // "@classes.artificer.levels * 2",
              types: ["healing"],
            }),
            consumption: {
              scaling: {
                allowed: true,
                max: "20",
              },
              spellSlot: true,
              targets: [],
            },
          },
        },
      },
      {
        constructor: {
          name: "Superior Atlas: Unerring Path",
          type: "cast",
        },
        build: {
          generateCast: true,
          generateRange: false,
          generateActivation: false,
          generateTarget: false,
        },
        overrides: {
          id: "ddbEnchantUnerPa",
          activationType: "special",
          targetType: "self",
          addActivityConsume: true,
          noConsumeTargets: true,
          addSpellUuid: "Find the Path",
          data: {
            spell: {
              spellbook: true,
            },
            uses: {
              max: "1",
              spent: 0,
              recovery: [{ period: "lr", type: 'recoverAll', formula: undefined }],
            },
          },
        },
      },
    ];
  }
}
