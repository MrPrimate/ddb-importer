/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class AcidVial extends DDBEnricherMixin {

  get activity() {
    return {
      type: "attack",
      addItemConsume: true,
      targetType: "creature",
      data: {
        attack: {
          ability: "dex",
          type: {
            value: "ranged",
            classification: "weapon",
          },
        },
      },
    };
  }

}
