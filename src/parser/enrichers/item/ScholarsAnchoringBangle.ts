import DDBEnricherData from "../data/DDBEnricherData";

export default class ScholarsAnchoringBangle extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Single-Minded Focus",
      targetType: "self",
      activationType: "reaction",
      activationCondition: "When you fail a save to maintain Concentration",
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Deep Knowledge",
        options: {
          transfer: true,
          description: "Treat a d20 roll of 9 or lower as a 10 on Study checks with a proficient skill (applied to every Intelligence check).",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("10", 20, "system.abilities.int.check.roll.min"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [{ period: "dawn", type: "recoverAll" }],
      },
    };
  }

}
