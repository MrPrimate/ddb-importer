/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class AnimalShapes extends DDBEnricherData {
  get type() {
    return "transform";
  }

  get activity() {
    return {
      targetType: "willing",
      name: "Cast",
      data: {
        duration: {
          value: "24",
          units: "hour",
        },
        transform: {
          "customize": true,
          "mode": "cr",
          "preset": "polymorph",
        },
        settings: {
          "effects": [
            "origin",
            "otherOrigin",
            "spell",
          ],
          "keep": this.is2014
            ? [
              "mental",
              "type",
            ]
            : [
              "mental",
              "languages",
              "type",
              "hp",
            ],
          "tempFormula": this.is2014 ? "" : "@source.attributes.hp.max",
          "preset": "polymorph",
          "merge": [],
          "other": [],
          "spellLists": [],
          "transformTokens": true,
          "minimumAC": "",
        },
        profiles: [
          {
            "cr": "4",
            "sizes": [
              "tiny",
              "sm",
              "med",
              "lg",
            ],
            "types": [
              "beast",
            ],
          },
        ],
      },
    };
  }

  get additionalActivities() {
    return [
      {
        duplicate: true,
        overrides: {
          name: "Follow Up Animal Shape",
          noConsumeTargets: true,
          activationType: "action",
          data: {
            settings: {
              tempFormula: "",
            },
          },
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        system: {
          target: {
            affects: {
              "count": "",
              "type": "willing",
            },
          },
        },
      },
    };
  }

}
