/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WindWall extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      splitDamage: true,
      data: {
        target: {
          override: true,
          template: {
            count: "5",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "1",
            height: "15",
            units: "ft",
          },
        },
      },
    };
  }

}
