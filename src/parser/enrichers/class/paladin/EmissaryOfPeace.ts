import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmissaryOfPeace extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 20, "system.skills.per.bonuses.check"),
        ],
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
