import DDBEnricherData from "../data/DDBEnricherData";

export default class CloudOfDaggers extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityId: "ddbCloDagZoneDa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbCloDagZoneDa1",
        overrides: {
          name: "Ongoing Damage",
          activationType: "special",
          activationCondition: this.is2014 ? "Enters the cube or starts its turn there" : "Enters the cube or ends its turn there",
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
