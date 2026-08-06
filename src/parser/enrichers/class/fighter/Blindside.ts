import DDBEnricherData from "../../data/DDBEnricherData";

export default class Blindside extends DDBEnricherData {

  get useDefaultAdditionalActivities() {
    return true;
  }

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    if (!this.isAction) return {};
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "You hit a creature that has not yet taken a turn, that you misdirected this turn, or with an attack roll made with Advantage",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "(5 + 2 * min(floor(@classes.fighter.levels / 15), 1) + 2 * min(floor(@classes.fighter.levels / 18), 1))d6",
            }),
          ],
        },
      },
    };
  }

  get override(): IDDBOverrideData {
    if (this.isAction) return {};
    return {
      uses: {
        max: "1",
        recovery: [{ period: "sr", type: "recoverAll", formula: "" }],
      },
    };
  }

}
