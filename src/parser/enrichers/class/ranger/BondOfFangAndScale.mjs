/* eslint-disable class-methods-use-this */
import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class BondOfFangAndScale extends DDBEnricherData {

  get type() {
    return "utility";
  }

  damageTypes() {
    return [
      "acid",
      "cold",
      "fire",
      "lightning",
      "poison",
    ];
  }

  get activity() {
    return {
      name: "Damage bonus",
      type: "damage",
      noeffect: true,
      activationType: "special",
      activationCondition: "The drake’s Bite attack deals extra damage",
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.drakewarden.drake-companion",
              types: this.damageTypes(),
            }),
          ],
        },
      },
    };
  }

  get effects() {

    const activeType = this.ddbParser?._chosen.find((a) =>
      utils.nameString(a.label).endsWith(" Resistance"),
    )?.label?.split(" Resistance")[0].toLowerCase() ?? "";

    return this.damageTypes().map((type) => {
      return {
        name: ` Bond of Fang and Scale, Resistance: ${utils.capitalize(type)}`,
        options: {
          transfer: activeType.includes(type),
          disabled: !activeType.includes(type),
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(type, 20, "system.traits.dr.value"),
        ],
      };
    });
  }

  get clearAutoEffects() {
    return true;
  }

}
