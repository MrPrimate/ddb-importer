import DDBEnricherData from "../data/DDBEnricherData";

export default class Cloudkill extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbCloKilSpellSa",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityId: "ddbCloKilZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbCloKilZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: this.is2014 ? "Enters the cloud or starts its turn there" : "Enters the cloud or ends its turn there",
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
