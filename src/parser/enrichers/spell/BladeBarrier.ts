import DDBEnricherData from "../data/DDBEnricherData";

/**
 * DDB provides no template for the wall shapes, so the cast places the straight wall and a copy
 * places the ringed one. The save a creature makes later in the wall is a free copy of the cast
 * with no slot and no template, rolled by hand.
 */
export default class BladeBarrier extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Place Wall",
      data: {
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
                type: "cylinder",
                size: "30",
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
          // 2014 "enters ... for the first time on a turn or starts its turn there";
          // 2024 rolls at cast, then "enters the wall's space or ends its turn there"
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
          },
        },
      },
    ];
  }

}
