import DDBEnricherData from "../../data/DDBEnricherData";

export default class Flamethrower extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      activationCondition: "Only if the artificer uses a bonus action, in addition the cannon can also move",
      data: {
        damage: {
          onSave: "half",
          parts: [DDBEnricherData.basicDamagePart({
            bonus: "",
            type: "fire",
          })],
        },
      },
    };
  }

}
