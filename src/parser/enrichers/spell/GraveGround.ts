import DDBEnricherData from "../data/DDBEnricherData";

/** Four 10-foot squares have no template shape; a 20-foot square stands in for them. */
export default class GraveGround extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "ddbGraveGround01",
      targetType: "enemy",
      data: {
        target: {
          override: true,
          affects: { type: "enemy" },
          template: { type: "square", size: "20", units: "ft" },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbGraveGround02",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbGraveGround02",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Skeletal hands appear, or an enemy enters the area or ends its turn there",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: { override: true, units: "spec" },
            target: { override: true },
            behaviors: [],
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Grave Ground: Weakened",
        activityMatch: "Ongoing Save",
        changes: [DDBEnricherData.ChangeHelper.ruleBonusChange("damage", "-1d6")],
        options: { expiry: "targetEnd" },
      },
    ];
  }

}
