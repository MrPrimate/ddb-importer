import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Sylvan Circle level 3. Wild Instincts: Disengage as a Bonus Action, then until the end of the
 * turn +15 feet of Speed and Advantage on Athletics and Acrobatics checks; Intelligence modifier
 * (minimum once) uses per Long Rest. The cantrips and Nature skill are DDB grants.
 */
export default class AgrestalSpirit extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Wild Instincts",
      activationType: "bonus",
      activationCondition: "Take the Disengage action",
      targetType: "self",
      rangeSelf: true,
      addItemConsume: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Wild Instincts",
        options: {
          expiry: "turnEnd",
        },
        changes: [
          DDBEnricherData.ChangeHelper.movementBonusChange("15"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("ath"),
          DDBEnricherData.ChangeHelper.advantageSkillChange("acr"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Agrestal Spirit: Wild Instincts",
        max: "max(1, @abilities.int.mod)",
        period: "lr",
      }),
    };
  }

}
