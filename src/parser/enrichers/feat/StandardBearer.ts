import DDBEnricherData from "../data/DDBEnricherData";

export default class StandardBearer extends DDBEnricherData {

  override get activity(): IDDBActivityData {


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

  override get effects(): IDDBEffectHint[] {
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
