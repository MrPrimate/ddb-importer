/* eslint-disable class-methods-use-this */
import utils from "../../../../lib/utils.js";
import DDBEnricherMixin from "../../mixins/DDBEnricherMixin.mjs";

export default class FiendishResilience extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  damageTypes() {
    return DDBEnricherMixin.allDamageTypes(["force"]);
  }

  get activity() {
    return {
      name: "Resistance",
      activationType: "special",
      activationCondition: "Finish a short or long rest",
    };
  }

  get override() {
    return {
      data: {
        "flags.ddbimporter.retainOriginalConsumption": true,
        "system.uses": {
          spent: 0,
          max: 1,
          recovery: [
            { period: "sr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

  get effects() {
    const activeType = this.ddbParser?._chosen.find((a) =>
      this.damageTypes().includes(a.label.toLowerCase()),
    )?.label.toLowerCase() ?? "";

    const effects = this.damageTypes().map((type) => {
      return {
        name: `Fiendish Resilience: ${utils.capitalize(type)}`,
        options: {
          transfer: true,
          disabled: activeType !== type,
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(type, 20, "system.traits.dr.value"),
        ],
      };
    });

    return effects;

  }

  get clearAutoEffects() {
    return true;
  }

}
