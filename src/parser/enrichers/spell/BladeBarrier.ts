import DDBEnricherData from "../data/DDBEnricherData";

export default class BladeBarrier extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      data: {
        // DDB provides no template for the wall shapes; give the straight wall so the
        // region has an area to attach to (the ringed wall is the Place Ring activity)
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
        // "a ringed wall up to 60 feet in diameter, 20 feet high, and 5 feet thick"
        duplicate: true,
        id: "ddbBlaBarRingPl1",
        overrides: {
          name: "Place Ring",
          data: {
            target: {
              override: true,
              template: {
                count: "1",
                contiguous: false,
                type: "ring",
                size: "30",
                width: "5",
                height: "20",
                units: "ft",
              },
            },
          },
        },
      },
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
