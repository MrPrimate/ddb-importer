import DDBEnricherData from "../../data/DDBEnricherData";

export default class FeralTransformation extends DDBEnricherData {

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Transform",
          type: DDBEnricherData.ACTIVITY_TYPES.TRANSFORM,
        },
        overrides: {
          noConsumeTargets: true,
          name: "Transform",
          data: {
            transform: {
              "customize": false,
              "mode": "",
              "preset": "polymorph",
            },
            settings: {
              "effects": [
                "origin",
                "otherOrigin",
                "spell",
              ],
              "keep": [
                "mental",
                "spells",
                "type",
                "hp",
              ],
              "tempFormula": "@source.attributes.hp.max",
              "preset": "polymorph",
              "merge": [
                "saves",
                "skills",
              ],
              "transformTokens": true,
            },
            profiles: this.is2014 || game.settings.get("ddb-importer", "adventure-policy-use2024-monsters")
              ? [
                {
                  "name": "Giant Spider#16895",
                },
                {
                  "name": "Dire Wolf#16841",
                },
                {
                  "name": "Giant Octopus#16888",
                },
              ]
              : [
                {
                  "name": "Giant Spider#4775821",
                },
                {
                  "name": "Dire Wolf#4775812",
                },
                {
                  "name": "Giant Octopus#5195023",
                },
              ],
          },
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          midiProperties: {
            autoFailFriendly: true,
          },
        },
      },
    };
  }
}
