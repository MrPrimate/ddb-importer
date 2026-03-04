import DDBEnricherData from "../data/DDBEnricherData";

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

  get effects(): IDDBEffectHint[] {
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
