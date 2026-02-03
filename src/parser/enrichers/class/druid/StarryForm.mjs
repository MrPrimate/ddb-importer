/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class StarryForm extends DDBEnricherData {
  get type() {
    return "enchant";
  }

  get activity() {
    return {
      noTemplate: true,
      targetType: "self",
      activationType: "bonus",
      name: "Assume Starry Form",
      id: utils.namedIDStub("assume", { prefix: "starry", postfix: "core" }),
      data: {
        enchant: {
          self: true,
        },
        duration: { value: "10", units: "minutes" },
      },
    };
  }

  get starForms() {
    return ["Archer", "Chalice", "Dragon"];
  }

  formActivityName(formType) {
    if (formType === "Archer") {
      return "Archer Attack";
    }
    if (formType === "Chalice") {
      return "Chalice Healing";
    }
    if (formType === "Dragon") {
      return "Dragon Constitution";
    }
    return "Unknown";
  }

  get formActivities() {
    return [
      {
        constructor: {
          name: this.formActivityName("Archer"),
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: true,
          attackOverride: {
            ability: "spellcasting",
            type: {
              classification: "spell",
              value: "ranged",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.stars.starry-form + @abilities.wis.mod",
              type: "radiant",
            }),
          ],
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          id: utils.namedIDStub("Archer", { prefix: "form", postfix: "" }),
        },
      },
      {
        constructor: {
          name: this.formActivityName("Chalice"),
          type: "heal",
        },
        build: {
          generateAttack: false,
          generateConsumption: false,
          generateTarget: true,
          generateDamage: false,
          generateHealing: true,
          healingPart: DDBEnricherData.basicDamagePart({
            customFormula: "@scale.stars.starry-form + @abilities.wis.mod",
            type: "healing",
          }),
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
          rangeOverride: {
            value: "30",
            units: "ft",
          },
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          id: utils.namedIDStub("Chalice", { prefix: "form", postfix: "" }),
        },
      },
      {
        constructor: {
          name: "Twinkling Constellations (Change Form)",
          type: "forward",
        },
        build: {
          targetOverride: {
            affects: {
              count: "1",
              type: "self",
            },
          },
          rangeOverride: {
            units: "self",
          },
          activationOverride: {
            type: "turnStart",
            value: 1,
            condition: "Start of each turn",
          },
        },
        overrides: {
          noTemplate: true,
          targetType: "self",
          noConsumeTargets: true,
          id: utils.namedIDStub("Twinkling", { prefix: "act", postfix: "" }),
          data: {
            activity: {
              id: utils.namedIDStub("assume", { prefix: "starry", postfix: "core" }),
            },
            midiProperties: {
              confirmTargets: "default",
            },
          },
        },
      },

    ];
  }

  get additionalActivities() {
    return [
      ...this.formActivities,
    ];
  }

  get enchantEffects() {
    const results = [];

    for (const formType of this.starForms) {
      [
        { min: null, max: 9 },
        { min: 10, max: 13 },
        { min: 14, max: null },
      ].forEach((data) => {
        let activityRiders = [];
        if (formType === "Archer") {
          activityRiders = [
            utils.namedIDStub("Archer", { prefix: "form", postfix: "" }),
          ];
        }
        if (formType === "Chalice") {
          activityRiders = [
            utils.namedIDStub("Chalice", { prefix: "form", postfix: "" }),
          ];
        }
        if (data.min && data.min >= 10) {
          activityRiders.push(
            utils.namedIDStub("Twinkling", { prefix: "act", postfix: "" }),
          );
        }
        const effect = {
          // name: `Type: ${formType} (${data.min !== null ? data.min : "1"}-${data.max !== null ? data.max : "20"})`,
          name: formType,
          type: "enchant",
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange(`Active: ${formType}`, 20, "activities[enchant].name"),
          ],
          activityMatch: "Assume Starry Form",
          data: {
            _id: utils.namedIDStub(formType, { prefix: "choice", postfix: `ef${data.min !== null ? data.min : "1"}` }),
            duration: {
              "seconds": 600,
              "startTime": null,
              "rounds": 100,
              "turns": null,
              "startRound": null,
              "startTurn": null,
              "combat": null,
            },
            flags: {
              ddbimporter: {
                activityRiders,
                effectRiders: [utils.namedIDStub(formType, { prefix: "ef", postfix: `${data.min !== null ? data.min : "1"}` })],
                effectIdLevel: {
                  min: data.min,
                  max: data.max,
                },
              },
            },
          },
        };
        results.push(effect);
      });
    }
    return results;
  }

  get formEffects() {
    const results = [];


    const atlChanges = [
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "20"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", CONST.ACTIVE_EFFECT_MODES.UPGRADE, "10"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "#f3f5e5"),
      DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", CONST.ACTIVE_EFFECT_MODES.OVERRIDE, "0.35"),
      DDBEnricherData.ChangeHelper.atlChange(
        "ATL.light.animation",
        CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        '{"type": ""starlight"", "speed": 5,"intensity": 5}',
      ),
    ];

    for (const formType of this.starForms) {
      [
        { min: null, max: 9 },
        { min: 10, max: 13 },
        { min: 14, max: null },
      ].forEach((data) => {
        const changes = [];
        if (formType === "Dragon") {
          changes.push(
            DDBEnricherData.ChangeHelper.upgradeChange("10", 10, "system.attributes.concentration.roll.min"),
          );
        }
        if (data.min && data.min >= 10 && formType === "Dragon") {
          changes.push(
            DDBEnricherData.ChangeHelper.upgradeChange("20", 20, "system.attributes.movement.fly"),
            DDBEnricherData.ChangeHelper.upgradeChange("true", 20, "system.attributes.movement.hover"),
          );
        }
        if (data.min && data.min >= 14) {
          changes.push(
            DDBEnricherData.ChangeHelper.unsignedAddChange("bludgeoning", 20, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("piercing", 20, "system.traits.dr.value"),
            DDBEnricherData.ChangeHelper.unsignedAddChange("slashing", 20, "system.traits.dr.value"),
          );
        }
        const effect = {
          name: `Starry Form: ${formType} (Level ${data.min !== null ? data.min : "1"}-${data.max !== null ? data.max : "20"})`,
          options: {
            durationSeconds: 600,
            transfer: true,
          },
          activityMatch: this.formActivityName(formType),
          changes,
          atlChanges,
          data: {
            _id: utils.namedIDStub(formType, { prefix: "ef", postfix: `${data.min !== null ? data.min : "1"}` }),
            flags: {
              dae: {
                selfTarget: true,
                selfTargetAlways: true,
              },
              ddbimporter: {
                effectIdLevel: {
                  min: data.min,
                  max: data.max,
                },
              },
            },
          },
        };

        results.push(effect);
      });

    }

    return results;
  }


  get effects() {
    const results = [
      ...this.enchantEffects,
      ...this.formEffects,
    ];


    return results;
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.ignoredConsumptionActivities": ["Archer Attack", "Chalice Healing", "Dragon Constitution", "Twinkling Constellations (Change Form)"],
      },
    };
  }
}
