/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class OilOfSharpness extends DDBEnricherMixin {

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
