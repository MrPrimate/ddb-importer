/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InnateSorcery extends DDBEnricherData {

  get activity() {
    return {
      name: "Innate Sorcery",
      addItemConsume: true,
    };
  }

  get effects() {
    return [
      {
        activityMatch: "Innate Sorcery",
        options: {
          description: "Advantage on Sorcerer spell attack rolls",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "system.bonuses.spell.dc"),
        ],
      },
    ];
  }


  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Innate Sorcery",
      max: "2",
      period: "lr",
    });

    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
