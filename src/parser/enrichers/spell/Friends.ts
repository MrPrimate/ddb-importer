import DDBEnricherData from "../data/DDBEnricherData";

export default class Friends extends DDBEnricherData {

  get type() {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    if (this.is2014) return null;
    return {
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

  get effects(): IDDBEffectHint[] {
    const statuses = this.is2014 ? [] : ["Charmed"];
    return [
      {
        name: "Friends",
        statuses,
      },
    ];
  }

}
