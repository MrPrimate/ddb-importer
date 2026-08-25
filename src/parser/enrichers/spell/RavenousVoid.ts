import DDBEnricherData from "../data/DDBEnricherData";

export default class RavenousVoid extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnStart"],
            activityId: "ddbRavVoiZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbRavVoiZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the sphere or starts its turn there",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            range: {
              override: true,
              units: "spec",
            },
            target: {
              override: true,
            },
            behaviors: [],
          },
        },
      },
    ];
  }

}
