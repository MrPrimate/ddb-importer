import DDBEnricherData from "../../data/DDBEnricherData";

export default class LiveFastBeAGoodLookingCorpse extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Live Fast, Be a Good Looking Corpse: Rapidity",
      useActivitySnippet: true,
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Blood Potency",
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
          consumptionOverride: {
            targets: [
              {
                type: "itemUses",
                target: "blood-potency",
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
