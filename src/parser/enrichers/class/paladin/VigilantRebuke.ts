import DDBEnricherData from "../../data/DDBEnricherData";

export default class VigilantRebuke extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  /**
   * @returns {DDBActivityData}
   */
  override get activity(): IDDBActivityData {
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
