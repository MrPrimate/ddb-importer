/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class FontOfMagic extends DDBEnricherMixin {

  get type() {
    return "ddbmacro";
  }

  get activity() {
    return {
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

}
