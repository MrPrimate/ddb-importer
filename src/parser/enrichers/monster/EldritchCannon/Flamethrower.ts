import DDBEnricherData from "../../data/DDBEnricherData";

export default class Flamethrower extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
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
