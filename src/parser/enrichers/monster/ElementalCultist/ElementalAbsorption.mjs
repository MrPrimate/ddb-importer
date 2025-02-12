/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementalAbsorption extends DDBEnricherData {

  get type() {
    return "heal";
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

  get effects() {
    return this.damageTypes().map((type) => {
      return {
        name: `Elemental Absorption, Resistance: ${utils.capitalize(type)}`,
        options: {
          transfer: false,
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(type, 20, "system.traits.dr.value"),
        ],
      };
    });
  }

}
