import DDBEnricherData from "../data/DDBEnricherData";

export default class BladeBarrier extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      data: {
        // DDB provides no template for the wall shapes; give the straight wall so the
        // region has an area to attach to (the 60 ft diameter ring is a manual resize)
        target: {
          override: true,
          template: {
            count: "1",
            contiguous: false,
            type: "wall",
            size: "100",
            width: "5",
            height: "20",
            units: "ft",
          },
        },
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain(),
          DDBEnricherData.BehaviorHelper.activity({
            // 2014 "enters ... for the first time on a turn or starts its turn there";
            // 2024 rolls at cast, then "enters the wall's space or ends its turn there"
            events: ["tokenEnter", this.is2014 ? "tokenTurnStart" : "tokenTurnEnd"],
            activityId: "ddbBlaBarZoneSa1",
          }),
        ],
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "ddbBlaBarZoneSa1",
        overrides: {
          name: "Ongoing Save",
          activationType: "special",
          activationCondition: this.is2014
            ? "Enters the wall's area for the first time on a turn or starts its turn there"
            : "Enters the wall's space or ends its turn there",
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
