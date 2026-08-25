import DDBEnricherData from "../data/DDBEnricherData";

export default class Moonbeam extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      id: "ddbMoonbeamSpSav",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityId: "ddbMoonbeamZone1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbMoonbeamZone1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: this.is2014 ? "Enters the beam or starts its turn there" : "Enters the beam or ends its turn there",
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
