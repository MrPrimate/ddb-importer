/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Shapechanger extends DDBEnricherData {
  get type() {
    return "transform";
  }

  get activity() {
    return {
      targetType: "self",
      data: {
        transform: {
          customize: true,
          mode: "cr",
          preset: "polymorph",
        },
        settings: {
          effects: ["origin", "otherOrigin", "spell"],
          keep: ["mental", "saves", "skills", "languages", "class", "spells", "type", "hp"],
          tempFormula: "@source.attributes.hp.max + 20",
          preset: "polymorph",
          transformTokens: true,
        },
        profiles: [
          {
            cr: "10",
            types: ["beast", "humanoid", "monstrosity"],
          },
        ],
      },
    };
  }
}
