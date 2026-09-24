import DDBEnricherData from "../data/DDBEnricherData";

export default class SpellfireStorm extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbSpellStormSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbSpellStormSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            duration: { override: true, units: "inst", concentration: false },
            behaviors: [],
            range: {
              override: true,
              units: "spec",
            },
            target: {
              override: true,
            },
          },
        },
      },
    ];
  }

}
