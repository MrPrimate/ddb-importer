import DDBEnricherData from "../data/DDBEnricherData";

export default class FarRealmShard extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      data: {
        damage: {
          onSave: "none",
        },
      },
    };
  }

}
