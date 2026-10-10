import DDBEnricherData from "../../data/DDBEnricherData";

/** Sorrow Knight Solemn Gaze: reading a creature's looming emotion is a Wisdom save against 8 + Wisdom + proficiency. */
export default class EmpatheticInquiry extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Empathetic Inquiry",
      targetType: "creature",
      activationType: "action",
      addItemConsume: true,
      data: {
        range: {
          override: true,
          value: "30",
          units: "ft",
        },
        save: {
          ability: ["wis"],
          dc: {
            calculation: "",
            formula: "8 + @abilities.wis.mod + @prof",
          },
        },
      },
    };
  }

}
