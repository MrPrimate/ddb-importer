/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ElementDamage extends DDBEnricherData {
  get type() {
    return "save";
  }

  static elementals = [
    {
      name: "Air",
      type: "lightning",
    },
    {
      name: "Earth",
      type: "thunder",
    },
    {
      name: "Fire",
      type: "fire",
    },
    {
      name: "Water",
      type: "cold",
    },
  ];

  get activity() {
    const damageType = ElementDamage.elementals.find((d) => d.name === this.data.name.split("Element")[0].trim())?.type;
    return {
      id: "ddbElemDamageSav",
      targetType: "creature",
      activationType: "special",
      activationCondition: "Enters the spirit’s space or starts its turn within 5 feet of it",
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 8,
              denomination: 8,
              types: damageType ? [damageType] : [],
            }),
          ],
        },
      },
    };
  }

  // get clearAutoEffects() {
  //   return true;
  // }


}
