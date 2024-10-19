/* eslint-disable class-methods-use-this */
import DDBBaseEnricher from "../DDBBaseEnricher.js";
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class InspiringSmite extends DDBEnricherMixin {

  activities() {
    return {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      condition: "Immediately after you cast Divine Smite",
      addItemUse: true,
      data: {
        healing: DDBBaseEnricher.basicDamagePart({ number: 2, denomination: 8, bonus: "@classes.paladin.levels", type: "temphp" }),
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

}
