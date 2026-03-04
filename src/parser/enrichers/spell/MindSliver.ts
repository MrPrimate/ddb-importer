import DDBEnricherData from "../data/DDBEnricherData";

export default class MindSliver extends DDBEnricherData {

  get effects(): IDDBEffectHint[] {
    return [
      {
        changes: [
          DDBEnricherData.ChangeHelper.addChange("-1d4", 20, "system.bonuses.abilities.save"),
        ],
        daeSpecialDurations: ["isSave" as const],
      },
    ];
  }

}
