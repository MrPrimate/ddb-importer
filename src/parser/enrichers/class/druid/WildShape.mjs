/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WildShape extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      data: {
        duration: {
          value: "(floor(@classes.druid.levels / 2))",
          units: "hour",
        },
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
      },
    };
  }

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Wild Shape",
      max: "@scale.druid.wild-shape-uses",
      period: this.is2014 ? "sr" : "lr",
    });

    if (this.is2024) {
      uses.recovery.push({
        "period": "sr",
        "type": "formula",
        "formula": "1",
      });
    }

    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
