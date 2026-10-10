import DDBEnricherData from "../../data/DDBEnricherData";

export default class LiveFastBeAGoodLookingCorpse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Live Fast, Be a Good Looking Corpse: Rapidity",
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Live Fast, Be a Good Looking Corpse: Rapidity (Turns)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: true,
          chatFlavor: "The additional action lasts for a number of turns equal to your Proficiency Bonus.",
          activationOverride: {
            type: "bonus",
            value: 1,
            condition: "",
          },
          // DDB's turn counter: the feature's proficiency-bonus uses tick down one per turn
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
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Live Fast, Be a Good Looking Corpse",
        includesName: true,
        max: "@prof",
      }),
    };
  }

}
