import DDBEnricherData from "../data/DDBEnricherData";
export default class EldritchClawTattoo extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ENCHANT;
  }

  /**
   * @returns {IDDBActivityData}
   */
  get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      name: "Eldritch Claw Tattoo",
      activationType: "special",
      allowMagical: true,
      data: {
        flags: {
          ddbimporter: {
            activityRiders: ["DDBEldritchMaul1"],
          },
        },
      },
    };
  }

  /**
   * @returns {IDDBAdditionalActivity[]}
   */
  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Eldritch Maul",
          type: DDBEnricherData.ACTIVITY_TYPES.ENCHANT,
        },
        build: {
          generateActivation: true,
          generateDamage: false,
        },
        overrides: {
          id: "DDBEldritchMaul1",
          activationType: "bonus",
          addItemConsume: true,
          itemConsumeTargetName: "Eldritch Claw Tattoo",
          data: {
            restrictions: {
              type: "weapon",
              allowMagical: true,
            },
            enchant: {
              self: true,
            },
            duration: { value: "1", units: "minutes" },
          },
        },
      },
    ];
  }

  /**
   * @returns {DDBEffectHint[]}
   */
  get effects() {
    return [
      {
        type: "enchant",
        activityMatch: "Eldritch Claw Tattoo",
        magicalBonus: {
          makeMagical: true,
          bonus: "1",
        },
        data: {
          flags: {
            ddbimporter: {
              activityRiders: ["DDBEldritchMaul1"],
            },
          },
        },
      },
      {
        name: "Eldritch Maul",
        activityMatch: "Eldritch Maul",
        type: "enchant",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(`[["1d6", "force"]]`, 20, "system.damage.parts"),
          DDBEnricherData.ChangeHelper.overrideChange(`{} [Eldritch Maul]`, 25, "name"),
          DDBEnricherData.ChangeHelper.upgradeChange("15", 20, "system.range.value"),
          DDBEnricherData.ChangeHelper.overrideChange("ft", 20, "system.range.units"),
        ],
        // data: {
        //   flags: {
        //     ddbimporter: {
        //       activityRiders: ["ddbMartialArtsSt"],
        //     },
        //   },
        // },
      },
    ];
  }

}
