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
    return {
      data: {
        "system.uses.max": "@scale.druid.wild-shape-uses",
      },
    };
  }

}
