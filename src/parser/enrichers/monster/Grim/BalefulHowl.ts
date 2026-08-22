import DDBEnricherData from "../../data/DDBEnricherData";

export default class BalefulHowl extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        save: {
          ability: ["wis"],
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frozen",
        changes: [
          DDBEnricherData.ChangeHelper.movementMultiplierChange("0", 100),
        ],
      },
    ];
  }

}
