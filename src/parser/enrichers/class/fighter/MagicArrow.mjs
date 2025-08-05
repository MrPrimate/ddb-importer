/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class MagicArrow extends DDBEnricherData {

  get type() {
    return "enchant";
  }

  get activity() {
    return {
      data: {
        restrictions: {
          type: "weapon",
          allowMagical: false,
        },
      },
    };
  }

  get effects() {
    return [{
      type: "enchant",
      magicalBonus: {
        makeMagical: true,
      },
    }];
  }

}
