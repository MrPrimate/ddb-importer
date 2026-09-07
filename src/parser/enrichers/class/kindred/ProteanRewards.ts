import DDBEnricherData from "../../data/DDBEnricherData";

export default class ProteanRewards extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    if (this.isAction) return {};
    return {
      name: "Protean Rewards: Flesh of Marble",
      useActivitySnippet: true,
      targetType: "self",
      activationType: "action",
      addItemConsume: true,
      itemConsumeTargetName: "feat:blood-potency",
      itemConsumeValue: 2,
      data: {
        duration: { value: "1", units: "minute", special: "" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Gifts of Survival: Feral Fortitude (Flesh of Marble)",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          noeffect: true,
          generateActivation: true,
          generateTarget: true,
          generateUtility: true,
          generateConsumption: false,
          chatFlavor: "Your Gifts of Survival Damage Reduction is doubled while Flesh of Marble lasts.",
          activationOverride: {
            type: "reaction",
            value: 1,
            condition: "",
          },
        },
        overrides: {
          useActivitySnippet: true,
        },
      },
    ];
  }

}
