import DDBEnricherData from "../data/DDBEnricherData";

export default class Shapechanger extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.TRANSFORM;
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
