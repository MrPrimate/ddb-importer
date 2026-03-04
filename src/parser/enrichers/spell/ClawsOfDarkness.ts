import DDBEnricherData from "../data/DDBEnricherData";

export default class ClawsOfDarkness extends DDBEnricherData {

  get activity() {
    return {
      targetType: "creature",
      overrideTarget: true,
      targetCount: "1",
      data: {
        sort: 2,
        duration: {
          override: true,
          value: null,
          units: "inst",
        },
        attack: {
          type: {
            value: "melee",
          },
        },
      },
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cast",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateTarget: true,
        },
        overrides: {
          targetSelf: true,
          overrideTarget: true,
          rangeSelf: true,
          overrideRange: true,
          data: {
            sort: 1,
          },
        },
      },
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Claws of Darkness",
        activityMatch: "Cast",
      },
    ];
  }

  get override() {
    return {
      noTemplate: true,
    };
  }

}
