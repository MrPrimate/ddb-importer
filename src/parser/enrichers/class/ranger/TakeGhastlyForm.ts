import DDBEnricherData from "../../data/DDBEnricherData";

export default class TakeGhastlyForm extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  get activity(): IDDBActivityData {
    return  {
      name: "Take Ghastly Form",
      targetType: "self",
      rangeSelf: true,
      activationType: "bonus",
      noTemplate: true,
      data: {
        enchant: {
          identifier: "ranger",
          self: true,
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Unnerving Aura",
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
            type: "turnStart",
            condition: "When you transform or start your turn while transformed",
          },
        },
        overrides: {
          id: "ddbUnnervingAura",
          data: {
            save: {
              ability: ["wis"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
            target: {
              affects: {
                type: "creature",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "10",
                units: "ft",
              },
              prompt: false,
            },
            range: {
              units: "self",
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
    return [
      {
        name: "Ancient Armor",
        changes: [
          DDBEnricherData.ChangeHelper.addChange("@scale.hollow-warden.wrath-of-the-wild", 20, "system.attributes.ac.bonus"),
        ],
        data: {
          _id: "AncientArmor0011",
        },
      },
      {
        name: "Ghastly Form",
        activityMatch: "Take Ghastly Form",
        options: {
          durationSeconds: 60,
          expiryType: "turnStart",
        },
        daeSpecialDurations: ["turnStartSource"],
        data: {
          flags: {
            ddbimporter: {
              activityRiders: ["ddbUnnervingAura"],
              effectRiders: ["AncientArmor0011"],
            },
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("{} (Active)", true, "name"),
          DDBEnricherData.ChangeHelper.overrideChange("spec", true, "activities[enchant].activation.type"),
          DDBEnricherData.ChangeHelper.overrideChange("end of duration", true, "activities[enchant].activation.condition"),
          DDBEnricherData.ChangeHelper.overrideChange("End Ghastly Form", true, "activities[enchant].name"),
          DDBEnricherData.ChangeHelper.overrideChange("[]", true, "activities[enchant].consumption.targets"),
        ],
        type: "enchant",
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: ["Unnerving Aura"],
    };
  }
}
