/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class StandardBearer extends DDBEnricherData {

  get activity() {


    return {
      addItemConsume: true,
      activationType: "special",
      data: {
        target: {
          affects: {
            count: "3",
            type: "ally",
          },
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Bolstered Resolve",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("frighened", 20, "system.traits.ci.value"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("charmed", 20, "system.traits.ci.value"),
        ],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
