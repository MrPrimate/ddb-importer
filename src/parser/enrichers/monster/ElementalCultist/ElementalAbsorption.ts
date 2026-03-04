import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementalAbsorption extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  damageTypes() {
    return [
      "acid",
      "cold",
      "fire",
      "lightning",
      "thunder",
    ];
  }

  get activity() {
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          bonus: "10",
          types: ["temphp"],
        }),
      },
    };
  }

  get effects(): IDDBEffectHint[] {
    return this.damageTypes().map((type) => {
      return {
        name: `Elemental Absorption, Resistance: ${utils.capitalize(type)}`,
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.damageResistanceChange(type),
        ],
      };
    });
  }

}
