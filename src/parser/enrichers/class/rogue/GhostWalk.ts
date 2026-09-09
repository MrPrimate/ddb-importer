import DDBEnricherData from "../../data/DDBEnricherData";

export default class GhostWalk extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Activate",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Spectral Form",
        activityMatch: "Activate",
        options: {
          durationSeconds: 600,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 2, "system.attributes.movement.fly"),
          DDBEnricherData.ChangeHelper.overrideChange("true", 2, "system.attributes.movement.hover"),
        ],
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.all"),
        ],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Spend Soul Trinket to Restore Use",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
                value: "1",
                target: "Tokens of the Departed",
                scaling: { allowed: false, max: "" },
              },
            ],
          },
        },
      },
    ];
  }

  // get useDefaultAdditionalActivities() {
  //   return true;
  // }

  // get addToDefaultAdditionalActivities() {
  //   return true;
  // }

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Ghost Walk",
        includesName: true,
        max: "1",
        period: "lr",
      }),
    };
  }

}
