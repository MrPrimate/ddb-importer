import DDBEnricherData from "../data/DDBEnricherData";

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
