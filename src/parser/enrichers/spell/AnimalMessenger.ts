import DDBEnricherData from "../data/DDBEnricherData";

export default class AnimalMessenger extends DDBEnricherData {

  override get type() {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      data: {
        save: {
          ability: ["cha"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
      },
    };
  }

}
