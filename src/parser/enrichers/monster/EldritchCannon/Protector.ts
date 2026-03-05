import DDBEnricherData from "../../data/DDBEnricherData";

export default class Protector extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      activationType: "bonus",
      activationCondition: "Only if the artificer uses a bonus action, in addition the cannon can also move",
      data: {
        target: {
          affects: {
            type: "ally",
            choice: true,
          },
          template: {
            count: "",
            contiguous: false,
            type: "radius",
            size: "10",
            width: "",
            height: "",
            units: "ft",
          },
        },
        healing: DDBEnricherData.basicDamagePart({
          number: this.is2014 ? 1 : null,
          denomination: this.is2014 ? 8 : null,
          bonus: "",
          type: "temphp",
        }),
      },
    };
  }

}
