// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class ElementDamage extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
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

  get activity(): IDDBActivityData {
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        noCreate: true,
        data: {
          img: "systems/dnd5e/icons/svg/statuses/restrained.svg",
        },
      },
    ];
  }

  // get clearAutoEffects() {
  //   return true;
  // }


}
