import DDBEnricherData from "../../data/DDBEnricherData";

export default class StealLuck extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction ? null : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "reaction",
      activationCondition: "A creature you can see within 30 feet is about to make a D20 Test with Advantage",
      addItemConsume: true,
      additionalConsumptionTargets: [
        {
          type: "itemUses",
          target: "Misfortunist",
          value: "-1",
          scaling: { mode: "", formula: "" },
        },
      ],
      data: {
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
      // Improved Steal Luck (level 17) grants 3 uses, recovering on a Long Rest
      uses: {
        max: "@classes.rogue.levels >= 17 ? 3 : 1",
        recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
