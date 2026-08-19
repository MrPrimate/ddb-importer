import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class FiendishResilience extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  damageTypes() {
    return DDBEnricherData.allDamageTypes(["force"]);
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Resistance",
      activationType: "special",
      activationCondition: "Finish a short or long rest",
      addItemConsume: true,
    };
  }

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "1",
        recovery: [
          { period: "sr", type: "recoverAll", formula: undefined },
        ],
      },
      retainOriginalConsumption: true,
    };
  }

  override get effects(): IDDBEffectHint[] {
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

  override get clearAutoEffects(): boolean {
    return true;
  }

}
