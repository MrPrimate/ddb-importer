import DDBEnricherData from "../../data/DDBEnricherData";

export default class AmongTheDead extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      data: {
        save: {
          ability: ["wis"],
          dc: {
            calculation: "spellcasting",
          },
        },
      },
    };
  }

}
