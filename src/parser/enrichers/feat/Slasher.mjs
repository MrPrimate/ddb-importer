/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Slasher extends DDBEnricherData {

  get activity() {
    return {
      type: "none",
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Hamstring",
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Hit a creature with an attack that deals slashing damage",
        },
      },
      {
        constructor: {
          name: "Enhanced Critical",
          type: "utility",
        },
        build: {
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          activationType: "special",
          activationCondition: "Crit a creature with an attack that deals slashing damage",
        },
      },
    ];
  }

  get effects() {
    return [
      {
        name: "Slashed: Hamstrung",
        options: {
          description: "Speed penalty until the start of the origins next turn",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-10", 20, "system.attributes.speed.walk"),
        ],
        data: {
          "flags.ddbimporter.activitiesMatch": ["Hamstring"],
        },
      },
      {
        name: "Slashed: Enhanced Critical",
        options: {
          description: "Disadvantage on attack rolls until the start of the origins next turn",
        },
        data: {
          "flags.ddbimporter.activitiesMatch": ["Enhanced Critical"],
        },
      },
    ];
  }

}
