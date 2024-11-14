/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class BonesOfTheEarth extends DDBEnricherMixin {

  get override() {
    return {
      data: {
        "system.target.template": {
          count: "6",
          size: "2.5",
        },
      },
    };
  }

}
