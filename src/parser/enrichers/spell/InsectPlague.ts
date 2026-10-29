import DDBEnricherData from "../data/DDBEnricherData";

export default class InsectPlague extends DDBEnricherData {
  override get activity(): IDDBActivityData {
    return {
      name: "Cast",
      id: "ddbInsPlaSpellSa",
      data: {
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          // the 2024 text limits the save to once per turn; 2014 rolls entering and ending a turn apart
          ...DDBEnricherData.BehaviorHelper.activityPerEvent({
            events: ["tokenEnter", "tokenTurnEnd"],
            activityId: "ddbInsPlaZoneSa1",
          }, this.is2014),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbInsPlaZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: "Enters the area or ends its turn there",
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
