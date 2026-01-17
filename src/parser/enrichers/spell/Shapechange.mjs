/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Shapechange extends DDBEnricherData {
  get type() {
    return "transform";
  }

  get activity() {
    return {
      targetType: "willing",
      name: "Cast",
      data: {
        transform: {
          "customize": true,
          "mode": "cr",
          "preset": "polymorph",
        },
        settings: {
          "effects": this.is2014
            ? [
              "origin",
              "otherOrigin",
              "class",
              "feat",
              "equipment",
              "spell",
            ]
            : [
              "origin",
              "otherOrigin",
              "spell",
            ],
          "keep": this.is2014
            ? [
              "mental",
              "saves",
              "skills",
              "gearProf",
              "languages",
              "feats",
              "items",
              "spells",
              "type",
              "hp",
            ]
            : [
              "mental",
              "saves",
              "skills",
              "languages",
              "spells",
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
            "cr": "max(@details.level, @details.cr)",
            "types": [
              "aberration",
              "beast",
              "celestial",
              "dragon",
              "elemental",
              "fey",
              "fiend",
              "giant",
              "humanoid",
              "monstrosity",
              "ooze",
              "plant",
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
