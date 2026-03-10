import DDBEnricherData from "../../data/DDBEnricherData";

export default class AmongTheDead extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        save: {
          ability: "wis",
          dc: {
            calculation: "spellcasting",
          },
        },
      },
    };
  }

}
