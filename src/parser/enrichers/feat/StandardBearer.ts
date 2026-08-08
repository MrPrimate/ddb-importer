import DDBEnricherData from "../data/DDBEnricherData";

export default class StandardBearer extends DDBEnricherData {

  get activity(): IDDBActivityData {


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
          DDBEnricherData.ChangeHelper.conditionImmunityChange("frightened"),
          DDBEnricherData.ChangeHelper.conditionImmunityChange("charmed"),
        ],
        options: {
          durationSeconds: 60,
        },
      },
    ];
  }

}
