/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InnateSorcery extends DDBEnricherData {

  get activity() {
    return {
      name: "Innate Sorcery",
    };
  }

  get effects() {
    return [
      {
        activityMatch: "Innate Sorcery",
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.bonuses.spell.dc"),
        ],
      },
    ];
  }

}
