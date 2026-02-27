import DDBEnricherData from "../../data/DDBEnricherData";

export default class LunarPhenomenon extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity(): IDDBActivityData {
    return {
      name: "Full Moon: Save",
      activationType: "bonus",
      addItemConsume: true,
      data: {
        save: {
          ability: ["con"],
          dc: {
            formula: "",
            calculation: "spellcasting",
          },
        },
        range: {
          units: "self",
        },
        target: {
          template: {
            contiguous: false,
            type: "radius",
            size: "30",
            units: "ft",
          },
          affects: {
            type: "creature",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        init: {
          name: "Full Moon: Heal",
          type: "heal",
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateHealing: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
          healingPart: DDBEnricherData.basicDamagePart({
            number: 3,
            denomination: 8,
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
        },
      },
      {
        init: {
          name: "New Moon: Save",
          type: "save",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateSave: true,
          generateDamage: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          saveOverride: {
            ability: ["dex"],
            dc: {
              formula: "",
              calculation: "spellcasting",
            },
          },
          damageParts: [
            DDBEnricherData.basicDamagePart({
              number: 3,
              denomination: 10,
              type: "necrotic",
            }),
          ],
          rangeOverride: {
            value: "",
            units: "self",
          },
          targetOverride: {
            template: {
              contiguous: false,
              type: "radius",
              size: "30",
              units: "ft",
            },
            affects: {
              type: "creature",
            },
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
      {
        init: {
          name: "New Moon: Invisibility",
          type: "utility",
        },
        build: {
          generateConsumption: false,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
      {
        init: {
          name: "Crescent Moon",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          rangeOverride: {
            value: "60",
            units: "ft",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "willing",
            },
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: 1,
                scaling: { mode: "", formula: "" },
              },
            ],
          },
        },
      },
      {
        init: {
          name: "Spend Sorcery Points to Restore Use",
          type: "utility",
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "none",
            value: null,
            condition: "",
          },
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "",
                value: -1,
                scaling: { mode: "", formula: "" },
              },
              {
                type: "itemUses",
                value: "5",
                target: "Sorcery Points",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Blinded",
        statuses: ["Blinded"],
        activityMatch: "Full Moon: Save",
        options: {
          durationRounds: 1,
        },
      },
      {
        name: "New Moon: Speed Reduced",
        activityMatch: "New Moon",
        changes: [
          DDBEnricherData.ChangeHelper.downgradeChange("0", 100, "system.attributes.movement.all"),
        ],
        options: {
          durationRounds: 1,
        },
      },
      {
        name: "Invisible",
        statuses: ["Invisible"],
        activityMatch: "New Moon: Invisibility",
        options: {
          durationRounds: 1,
        },
      },
      {
        name: "Crescent Moon: Damage Resistance",
        activityMatch: "Crescent Moon",
        changes: DDBEnricherData.allDamageTypes().map((type) => DDBEnricherData.ChangeHelper.damageResistanceChange(type)),
        options: {
          durationRounds: 1,
        },
        daeSpecialDurations: ['turnStartSource'],
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: 'recoverAll', formula: "" }],
      },
    };
  }

}
