/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class SpellStoringItem extends DDBEnricherData {

  get type() {
    return this.is2014 ? null : "none";
  }

  get additionalActivities() {
    if (this.is2014) return [];
    return [
      { action: { name: "Spell-Storing Item: Store Spell", type: "class", rename: ["Store Spell"] } },
    ];
  }

  get override() {
    if (this.is2014) return null;
    return {
      data: {
        "system.uses": {
          max: "",
          spent: null,
          recovery: [],
        },
      },
    };
  }


}
