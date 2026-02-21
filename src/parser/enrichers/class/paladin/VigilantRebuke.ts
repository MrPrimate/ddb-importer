import DDBEnricherData from "../../data/DDBEnricherData";

export default class VigilantRebuke extends DDBEnricherData {

  get type() {
    return "save";
  }

  /**
   * @returns {DDBActivityData}
   */
  get activity() {
    return {
      targetType: "enemy",
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              number: 2,
              denomination: 8,
              bonus: "@abilities.cha.mod",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

}
