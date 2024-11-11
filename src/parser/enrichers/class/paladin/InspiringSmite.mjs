/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class InspiringSmite extends DDBEnricherMixin {

  get activities() {
    return {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Immediately after you cast Divine Smite",
      addItemUse: true,
      data: {
        healing: DDBEnricherMixin.basicDamagePart({ number: 2, denomination: 8, bonus: "@classes.paladin.levels", type: "temphp" }),
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

}
