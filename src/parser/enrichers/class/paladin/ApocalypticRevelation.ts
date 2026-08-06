import DDBEnricherData from "../../data/DDBEnricherData";

export default class ApocalypticRevelation extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Activate",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
      targetType: "self",
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Blinding Glory",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateTarget: true,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "An enemy starts its turn within 5 feet of you",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "enemy",
            },
          },
          saveOverride: {
            ability: ["con"],
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
        },
        overrides: {
          noConsumeTargets: true,
        },
      },
      {
        init: {
          name: "Spend Spell Slot to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateConsumption: true,
          generateTarget: true,
          generateActivation: true,
          generateUtility: true,
          noeffect: true,
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
                value: "-1",
                scaling: { mode: "", formula: "" },
              },
              {
                type: "spellSlots",
                value: "1",
                target: "5",
                scaling: { mode: "", formula: "" },
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
        name: "Apocalyptic Revelation",
        activitiesMatch: ["Activate"],
        options: {
          durationSeconds: 60,
          description: "Blinding Glory: enemies starting their turn within 5 feet must succeed on a Constitution save or be Blinded until the start of their next turn. See the Truth: Truesight with a range of 60 feet. Smite the Heretic: as a Bonus Action, choose a creature within 60 feet; you and your allies have Advantage on attack rolls against it.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.attributes.senses.truesight"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.overrideChange("truesight", 20, "ATL.sight.visionMode"),
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "ATL.sight.range"),
        ],
      },
      {
        name: "Blinding Glory: Blinded",
        activitiesMatch: ["Blinding Glory"],
        statuses: ["blinded"],
        options: {
          durationRounds: 1,
          description: "Blinded until the start of its next turn.",
        },
      },
    ];
  }

}
