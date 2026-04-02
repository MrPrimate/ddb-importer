import DDBEnricherData from "../data/DDBEnricherData";

export default class ShiningSmite extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      data: {
        damage: {
          critical: {
            allow: true,
          },
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Shedding Light",
        atlChanges: [
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.bright", "override", "5"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.color", "override", "#ffffff"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.alpha", "override", "0.25"),
          DDBEnricherData.ChangeHelper.atlChange("ATL.light.animation", "override", "{\"type\": \"pulse\", \"speed\": 3,\"intensity\": 1}"),
        ],
      },
    ];
  }

}
