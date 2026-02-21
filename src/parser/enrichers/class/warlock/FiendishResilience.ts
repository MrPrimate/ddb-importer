import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class FiendishResilience extends DDBEnricherData {

  get type() {
    return "utility";
  }

  damageTypes() {
    return DDBEnricherData.allDamageTypes(["force"]);
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
          spent: null,
          max: "1",
          recovery: [
            { period: "sr", type: 'recoverAll', formula: undefined },
          ],
        },
      },
    };
  }

  get effects() {
    const activeType = this.ddbParser.isMuncher
      ? null
      : this.ddbParser._chosen?.find((a) =>
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
          DDBEnricherData.ChangeHelper.damageResistanceChange(type),
        ],
      };
    });

    return effects;

  }

  get clearAutoEffects() {
    return true;
  }

}
