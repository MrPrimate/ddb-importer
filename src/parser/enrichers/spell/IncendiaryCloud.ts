import DDBEnricherData from "../data/DDBEnricherData";

export default class IncendiaryCloud extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbIncCloSpellSa",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbIncCloZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbIncCloZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the cloud or ends its turn there",
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
