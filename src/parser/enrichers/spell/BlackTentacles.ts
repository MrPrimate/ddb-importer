import DDBEnricherData from "../data/DDBEnricherData";

export default class BlackTentacles extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityId: "ddbBlaTenZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbBlaTenZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: this.is2014 ? "Enters the area or starts its turn there" : "Enters the area or ends its turn there",
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
