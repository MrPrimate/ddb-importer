import DDBEnricherData from "../../data/DDBEnricherData";

export default class CurlUp extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  get activity(): IDDBActivityData {
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

  get additionalActivities(): IDDBAdditionalActivity[] {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curled Up",
        activityMatch: "Curl Up",
        options: {
          description: "AC 19 (no Dexterity bonus, shields allowed); you cannot move, attack, or cast spells with somatic components. If hit you are knocked prone at the end of the turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("flat", 50, "system.attributes.ac.calc"),
          DDBEnricherData.ChangeHelper.overrideChange("19", 50, "system.attributes.ac.flat"),
          DDBEnricherData.ChangeHelper.multiplyChange("0", 50, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
