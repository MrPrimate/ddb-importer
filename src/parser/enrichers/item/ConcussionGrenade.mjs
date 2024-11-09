/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class ConcussionGrenade extends DDBEnricherMixin {

  get activity() {
    return {
      data: {
        range: {
          value: "60",
          unit: "ft",
        },
      },
    };
  }

}
