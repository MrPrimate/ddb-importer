/* eslint-disable class-methods-use-this */
import utils from "../../../../lib/utils.js";
import DDBEnricherMixin from "../../DDBEnricherMixin.js";

export default class FiendishResilience extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  damageTypes() {
    return this.allDamageTypes(["force"]);
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
      utils.nameString(a.label).endsWith("Damage"),
    )?.label?.split(" Damage")[0].toLowerCase() ?? "";


    console.warn("FiendishResilience", { activeType, this: this });

    return this.damageTypes().map((type) => {
      return {
        name: `Fiendish Resilience: ${utils.capitalize(type)}`,
        options: {
          transfer: activeType.includes(type),
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherMixin.generateUnsignedAddChange(type, 20, "system.traits.dr.value"),
        ],
      };
    });
  }

  get clearAutoEffects() {
    return true;
  }

}
