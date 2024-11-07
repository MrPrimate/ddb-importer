/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class ArcaneRecovery extends DDBEnricherMixin {

  get activity() {
    return {
      type: "ddbmacro",
      data: {
        macro: {
          name: "Arcane Recovery",
          function: "ddb.feat.arcaneRecovery",
          visible: false,
          parameters: "",
        },
      },
    };
  }

}
