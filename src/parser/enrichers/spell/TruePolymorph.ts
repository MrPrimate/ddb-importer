import DDBEnricherData from "../data/DDBEnricherData";

export default class TruePolymorph extends DDBEnricherData {


  get additionalActivities() {
    return [
      {
        init: {
          name: "Transform",
          type: "transform",
        },
        overrides: {
          noConsumeTargets: true,
          name: "Transform",
          data: {
            transform: {
              "customize": false,
              "mode": "cr",
              "preset": "polymorph",
            },
            settings: {
              "effects": [
                "origin",
                "otherOrigin",
                "spell",
              ],
              "keep": [],
              "tempFormula": "@source.attributes.hp.max",
              "preset": "polymorph",
              "merge": [],
              "other": [],
              "spellLists": [],
              "transformTokens": true,
              "minimumAC": "",
            },
            profiles: [
              {
                "types": [
                  "beast",
                ],
              },
            ],
          },
        },
      },
    ];
  }

  get override() {
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
