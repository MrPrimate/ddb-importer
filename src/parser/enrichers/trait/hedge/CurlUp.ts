import DDBEnricherData from "../../data/DDBEnricherData";

export default class CurlUp extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Quill Retaliation",
      targetType: "creature",
      activationType: "special",
      activationCondition: "A creature misses you with a melee attack while you are curled up",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, type: "piercing" }),
          ],
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Curl Up",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          activationOverride: { type: "action", condition: "" },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curled Up",
        activityMatch: "Curl Up",
        options: {
          description: "AC 19 (no Dexterity bonus, shields allowed); you cannot move, attack, or cast spells with somatic components. If hit you are knocked prone at the end of the turn.",
        },
        changes: [
          // formulas add: base AC 19 with no dex, but shields and bonuses still
          // stack ("shields allowed") - the old flat calc wrongly bypassed them
          DDBEnricherData.ChangeHelper.acFormulaAddChange("19", 50),
          DDBEnricherData.ChangeHelper.multiplyChange("0", 50, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
