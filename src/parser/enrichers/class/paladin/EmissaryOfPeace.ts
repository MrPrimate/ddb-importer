import DDBEnricherData from "../../data/DDBEnricherData";

export default class EmissaryOfPeace extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("5", 20, "system.skills.per.roll.bonus"),
        ],
        options: {
          durationSeconds: 600,
        },
      },
    ];
  }

}
