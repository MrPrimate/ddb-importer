/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class InspiringSmite extends DDBEnricherData {

  get activities() {
    return {
      type: "heal",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Immediately after you cast Divine Smite",
      addItemUse: true,
      data: {
        healing: DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, bonus: "@classes.paladin.levels", type: "temphp" }),
        range: {
          units: "ft",
          value: 30,
        },
      },
    };
  }

}
