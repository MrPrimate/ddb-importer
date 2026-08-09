import DDBEnricherData from "../../data/DDBEnricherData";

export default class ForceBallista extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      activationType: "bonus",
      activationCondition: "Only if the artificer uses a bonus action, in addition the cannon can also move",
      data: {
        range: {
          value: 120,
          long: null,
          units: "ft",
        },
        damage: {
          parts: [DDBEnricherData.basicDamagePart({
            bonus: "",
            type: "force",
          })],
        },
      },
    };
  }

}
