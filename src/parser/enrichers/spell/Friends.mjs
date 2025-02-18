/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Friends extends DDBEnricherData {

  get type() {
    return this.is2014 ? "utility" : "save";
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

  get effects() {
    const statuses = this.is2014 ? [] : ["Charmed"];
    return [
      {
        name: "Friends",
        statuses,
      },
    ];
  }

}
