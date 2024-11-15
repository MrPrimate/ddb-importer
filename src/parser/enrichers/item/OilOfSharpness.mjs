/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class OilOfSharpness extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      allowMagical: true,
    };
  }

  get effects() {
    return [
      {
        type: "enchant",
        magicalBonus: {
          bonus: "3",
        },
      },
    ];
  }

}
