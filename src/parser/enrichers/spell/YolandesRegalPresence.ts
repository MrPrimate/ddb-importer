import DDBEnricherData from "../data/DDBEnricherData";

export default class YolandesRegalPresence extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.activity({
            events: ["tokenEnter", "tokenTurnEnd"],
            // the caster always stands in their own emanation and never forces the save on themselves
            excludeSelf: true,
            activityId: "ddbYolRegZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbYolRegZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the emanation or ends its turn there",
          removeSpellSlotConsume: true,
          noConsumeTargets: true,
          noTemplate: true,
          data: {
            duration: { override: true, units: "inst", concentration: false },
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
