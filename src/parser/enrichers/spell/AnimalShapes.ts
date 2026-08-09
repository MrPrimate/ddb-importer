import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimalShapes extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
  }

  override get activity(): IDDBActivityData {
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

  override get additionalActivities(): IDDBAdditionalActivity[] {
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

  override get override(): IDDBOverrideData {
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
