import DDBEnricherData from "../../data/DDBEnricherData";

export default class MortalBulwark extends DDBEnricherData {

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      name: "Activate Mortal Bulwark",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      activationType: "bonus",
    };
  }

  /**
   * @returns {DDBAdditionalActivity[]}
   */
  get additionalActivities() {
    return [
      {
        init: {
          name: "Save vs Banishment",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateDamage: true,
          generateTarget: true,
          generateActivation: true,
          durationOverride: {
            value: "",
            units: "inst",
          },
          activationOverride: {
            type: "special",
          },
          targetOverride: {
            affects: {
              value: "1",
              type: "enemy",
            },
          },
        },
        overrides: {
          noConsumeTargets: true,
          data: {
            range: {
              units: "spec",
            },
            save: {
              ability: ["cha"],
              dc: {
                calculation: "spellcasting",
                formula: "",
              },
            },
          },
        },
      },
    ];
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return [{
      name: "Mortal Bulwark",
      changes: [
        DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.attributes.senses.truesight"),
      ],
      atlChanges: [
        DDBEnricherData.ChangeHelper.overrideChange("truesight", 20, "ATL.sight.visionMode"),
        DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "ATL.sight.range"),
      ],
      data: {
        "flags.ddbimporter.activitiesMatch": ["Activate Mortal Bulwark"],
      },
    }];
  }

}
