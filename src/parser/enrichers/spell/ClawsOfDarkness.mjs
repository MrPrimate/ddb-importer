/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

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

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Cast",
          type: "utility",
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
            sort: "1",
          },
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Claws of Darkness",
        activityNameMatch: "Cast",
      },
    ];
  }

  get override() {
    return {
      noTemplate: true,
    };
  }

}
