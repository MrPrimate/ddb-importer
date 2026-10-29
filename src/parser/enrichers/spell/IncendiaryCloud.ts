import DDBEnricherData from "../data/DDBEnricherData";

export default class IncendiaryCloud extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "ddbIncCloSpellSa",
      data: {
        behaviors: [
          // the 2024 text limits the save to once per turn; 2014 rolls entering and ending a turn apart
          ...DDBEnricherData.BehaviorHelper.activityPerEvent({
            events: ["tokenEnter", "tokenTurnEnd"],
            // 2024 also counts "the Sphere moves into its space" ("auto" gives movementOrArea); the 2014
            // cloud moving onto a creature is not it entering
            ...(this.is2014 ? { enterOn: "movement" as const } : {}),
            activityId: "ddbIncCloZoneSa1",
          }, this.is2014),
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
