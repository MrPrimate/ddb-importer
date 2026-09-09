import DDBEnricherData from "../data/DDBEnricherData";

export default class TruePolymorph extends DDBEnricherData {


  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Transform",
          type: DDBEnricherData.ACTIVITY_TYPES.TRANSFORM,
        },
        overrides: {
          noConsumeTargets: true,
          removeSpellSlotConsume: true,
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

  override get override(): IDDBOverrideData {
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
