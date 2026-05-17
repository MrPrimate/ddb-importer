import DDBEnricherData from "../../data/DDBEnricherData";

export default class BalefulHowl extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      data: {
        save: {
          ability: ["wis"],
        },
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Frozen",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("0", 100, "system.attributes.movement.walk"),
        ],
      },
    ];
  }

}
