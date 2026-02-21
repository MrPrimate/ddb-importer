import DDBEnricherData from "../../data/DDBEnricherData";

export default class FontOfMagicSorceryPoints extends DDBEnricherData {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    return {
      noConsumeTargets: true,
      data: {
        name: "Convert Sorcery Points/Spell Slots",
        macro: {
          name: "Conversion Macro",
          function: "ddb.feat.fontOfMagic",
          visible: false,
          parameters: "",
        },
      },
    };
  }

  get override() {
    return {
      data: {
        "name": "Sorcery Points",
      },
    };
  }

}
