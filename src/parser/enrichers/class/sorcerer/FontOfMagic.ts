import DDBEnricherData from "../../data/DDBEnricherData";

export default class FontOfMagic extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DDBMACRO;
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
        system: {
          uses: {
            max: null,
            spent: null,
            recovery: [],
          },
        },
      },
    };
  }

}
