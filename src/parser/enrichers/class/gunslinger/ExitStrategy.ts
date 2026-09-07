import DDBEnricherData from "../../data/DDBEnricherData";

export default class ExitStrategy extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "reaction",
      activationCondition: "You take damage",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Exit Strategy: Invisible",
        options: {
          expiry: "sourceStart",
        },
        statuses: ["Invisible"],
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Regain Use (1 Risk Die)",
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
            condition: "No action required",
          },
        },
        overrides: {
          addItemConsume: true,
          itemConsumeTargetName: "Risk",
          itemConsumeValue: "1",
          additionalConsumptionTargets: [
            {
              type: "itemUses",
              target: "",
              value: "-1",
              scaling: { mode: "", formula: "" },
            },
          ],
        },
      },
    ];
  }

}
