import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneUndertaker extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Understanding of Death",
      targetType: "self",
      activationType: "special",
      activationCondition: "When you take the Help action to stabilize a creature",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Knowledge from the Dead",
        options: {
          transfer: true,
          description: "Add 1d4 to Intelligence (History) and Wisdom (Medicine) checks.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleBonusChange("check", "1d4", {
            conditions: { k: "roll.skill", o: "in", v: ["his", "med"] },
          }),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
