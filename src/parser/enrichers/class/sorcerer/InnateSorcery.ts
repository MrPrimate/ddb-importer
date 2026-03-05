import DDBEnricherData from "../../data/DDBEnricherData";

export default class InnateSorcery extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Innate Sorcery",
      addItemConsume: true,
    };
  }

  get effects(): IDDBEffectHint[] {
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


  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Innate Sorcery",
      max: "2",
      period: "lr",
    });

    return {
      uses,
    };
  }

}
