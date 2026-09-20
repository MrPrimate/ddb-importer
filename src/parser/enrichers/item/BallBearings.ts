import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Spilling the bag rolls nothing: it places a 10-foot square. The "Ball Bearings Save" activity
 * is rolled by hand against each creature that enters, and knocks the creature that fails it
 * Prone.
 */
export default class BallBearings extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Spill Ball Bearings",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        target: {
          override: true,
          affects: {
            type: "creature",
          },
          template: {
            contiguous: false,
            type: "square",
            size: "10",
            units: "ft",
          },
        },
        range: {
          override: true,
          value: "10",
          units: "ft",
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Ball Bearings Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateSave: true,
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          saveOverride: { ability: ["dex"], dc: { calculation: "", formula: "10" } },
          activationOverride: {
            type: "special",
            condition: this.is2014
              ? "Enters the area (not needed when moving through at half speed)"
              : "Enters the area for the first time on a turn",
          },
          targetOverride: {
            override: true,
            affects: {
              count: "1",
              type: "creature",
            },
            template: {},
          },
          // the square is placed by "Spill Ball Bearings", so this rolls against whoever entered it
          rangeOverride: {
            override: true,
            value: null,
            units: "self",
            special: "",
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Ball Bearings Save",
        statuses: ["Prone"],
        options: {
          transfer: false,
        },
      },
    ];
  }

}
