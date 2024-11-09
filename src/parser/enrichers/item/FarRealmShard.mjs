/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class FarRealmShard extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
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
