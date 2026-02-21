import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArcaneRecovery extends DDBEnricherData {

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
