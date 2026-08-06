import DDBEnricherData from "../../data/DDBEnricherData";

export default class FinalJudgement extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity(): IDDBActivityData {
    return {
      name: "Divine Spirits (Cast Spirit Guardians)",
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      data: {
        range: {
          units: "self",
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Restore Divine Spirits Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateConsumption: true,
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          generateUtility: true,
          activationOverride: {
            type: "special",
            value: null,
            condition: "Expend 3 Divine Points (no action required)",
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
                target: "Divine Blessings",
                value: "3",
                scaling: { mode: "", formula: "" },
              },
            ],
            scaling: { allowed: false, max: "" },
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      uses: {
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Radiant Blade",
        ignoreTransfer: true,
        options: {
          transfer: true,
          disabled: true,
          description: "The sanctified blade is a magic weapon, emits Bright Light in a 30-foot radius and Dim Light for an additional 30 feet, and deals an extra 2d4 Radiant damage on a hit.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("2d4[radiant]", 20, "system.bonuses.mwak.damage"),
        ],
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "upgrade", 30, 20),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.dim", "upgrade", 60, 20),
        ],
      },
    ];
  }

}
