/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class WildShape extends DDBEnricherData {
  get type() {
    return "transform";
  }

  get activity() {
    return {
      data: {
        duration: {
          value: "(floor(@classes.druid.levels / 2))",
          units: "hour",
        },
        img: "systems/dnd5e/icons/svg/abilities/intelligence.svg",
        transform: {
          customize: false,
          identifier: "druid",
          preset: "wildshape",
          mode: "cr",
        },
        profiles: [
          {
            cr: "max(1/4, @subclasses.moon.levels / 3)",
            name: "Wildshape",
            uuid: null,
            sizes: [],
            types: ["beast"],
            movement: ["fly"],
            level: {
              min: 2,
              max: 3,
            },
          },
          {
            cr: "max(1/2, @subclasses.moon.levels / 3)",
            name: "Wildshape",
            uuid: null,
            sizes: [],
            types: ["beast"],
            movement: ["fly"],
            level: {
              min: 4,
              max: 7,
            },
          },
          {
            cr: "max(1, @subclasses.moon.levels / 3)",
            name: "Wildshape",
            uuid: null,
            sizes: [],
            types: ["beast"],
            movement: [],
            level: {
              min: 8,
              max: null,
            },
          },
        ],
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
        period: "sr",
        type: "formula",
        formula: "1",
      });
    }

    return {
      data: {
        "system.uses": uses,
      },
    };
  }
}
