/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Protector extends DDBEnricherData {

  get type() {
    return "heal";
  }

  get activity() {
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
          number: 1,
          denomination: 8,
          type: "temphp",
        }),
      },
    };
  }

}
