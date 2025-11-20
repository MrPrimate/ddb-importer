/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CircleForms extends DDBEnricherData {
  get type() {
    return "transform";
  }

  get activity() {
    return {
      noTemplate: true,
      targetType: "self",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Wild Shape",
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
            name: "Circle Form",
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
            name: "Circle Form",
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
            name: "Circle Form",
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

  get effects() {
    return [
      {
        name: "Circle Form AC",
        options: {
          description: "You gain a minimum AC of 13 + your Wisdom modifier.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("13 + @abilities.wis.mod", 20, "system.attributes.ac.min"),
        ],
      },
    ];
  }

}
