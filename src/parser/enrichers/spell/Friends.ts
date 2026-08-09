import DDBEnricherData from "../data/DDBEnricherData";

export default class Friends extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData | null {
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

  override get effects(): IDDBEffectHint[] {
    const statuses = this.is2014 ? [] : ["Charmed"];
    return [
      {
        name: "Friends",
        statuses,
      },
    ];
  }

}
