/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EmissaryOfPeace extends DDBEnricherData {

  get effects() {
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
