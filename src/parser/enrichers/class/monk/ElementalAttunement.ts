import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementalAttunement extends DDBEnricherData {
  get type() {
    return this.is2014 ? null : DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity() {
    return this.is2014
      ? {}
      : {
        name: "Activate Attunement",
        targetType: "self",
        rangeSelf: true,
        activationType: "turnStart",
        activationCondition: "Start of turn",
        data: {
          enchant: {
            identifier: "monk",
            self: true,
          },
        },
      };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return this.is2014
      ? []
      : [
        {
          init: {
            name: "Elemental Strike",
            type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
          },
          build: {
            generateAttack: true,
            generateDamage: true,
            generateRange: true,
            generateTarget: true,
            generateActivation: true,
            generateConsumption: false,
            damageParts: [
              DDBEnricherData.basicDamagePart({
                customFormula: "@scale.monk.die.die + @mod",
                types: ["bludgeoning", "acid", "cold", "fire", "lightning", "thunder"],
              }),
            ],
          },
          overrides: {
            id: "ddbElementStriAt",
            data: {
              target: {
                affects: {
                  count: "1",
                  type: "creature",
                },
              },
              range: {
                value: 15,
                units: "ft",
              },
              attack: {
                ability: "dex",
                type: {
                  value: "melee",
                  classification: "unarmed",
                },
              },
              duration: {
                units: "inst",
              },
            },
          },
        },
        {
          init: {
            name: "Elemental Save",
            type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
          },
          build: {
            generateSave: true,
            generateRange: false,
            generateTarget: true,
            generateActivation: true,
            generateConsumption: false,
            saveOverride: {
              ability: ["str"],
              dc: { calculation: "wis", formula: "" },
            },
            activationOverride: {
              type: "special",
              condition: "You deal Elemental Strike damage",
            },
          },
          overrides: {
            id: "ddbElementStriSa",
            data: {
              target: {
                affects: {
                  count: "1",
                  type: "creature",
                },
              },
              range: {
                value: 15,
                units: "ft",
              },
              duration: {
                units: "inst",
              },
            },
          },
        },
      ];
  }

  get effects(): IDDBEffectHint[] {
    return this.is2014
      ? []
      : [
        {
          name: "Elemental Attunement",
          activityMatch: "Activate Attunement",
          data: {
            flags: {
              activityMatch: "Activate Attunement",
              ddbimporter: {
                activityRiders: ["ddbElementStriAt", "ddbElementStriSa"],
              },
            },
          },
          changes: [
            DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", true, "name"),
            DDBEnricherData.ChangeHelper.overrideChange("spec", true, "activities[enchant].activation.type"),
            DDBEnricherData.ChangeHelper.overrideChange(
              "end of duration",
              true,
              "activities[enchant].activation.condition",
            ),
            DDBEnricherData.ChangeHelper.overrideChange("End Attunement", true, "activities[enchant].name"),
            DDBEnricherData.ChangeHelper.overrideChange("[]", true, "activities[enchant].consumption.targets"),
          ],
          type: "enchant",
        },
      ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Elemental Strike", "Elemental Save"],
    };
  }
}
