import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class BondOfFangAndScale extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
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

    const activeType = this.ddbParser.isMuncher
      ? null
      : this.ddbParser?._chosen?.find((a) =>
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
          DDBEnricherData.ChangeHelper.damageResistanceChange(type),
        ],
      };
    });
  }

  get clearAutoEffects() {
    return true;
  }

}
