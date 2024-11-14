/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WallOfIce extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Place Panels",
      removeDamageParts: true,
      damageParts: foundry.utils.deepClone(this.data.damage.parts[0]),
      data: {
        img: "icons/magic/water/barrier-ice-wall-snow.webp",
        target: {
          override: true,
          template: {
            count: "10",
            contiguous: true,
            type: "wall",
            size: "10",
            width: "1",
            height: "10",
            units: "ft",
          },
        },
      },
    };
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Create Dome/Globe",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          img: "icons/magic/water/barrier-ice-shield.webp",
          partialDamageParts: [0],
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "sphere",
              size: "10",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Frigid Air Save",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          img: "icons/magic/water/snowflake-ice-blue-white.webp",
          generateTarget: true,
          partialDamageParts: [1],
          noSpellslot: true,
          activationOverride: { type: "spec", condition: "Moving through/starting in Frigid Air" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: {
              type: "creature",
            },
            template: {},
          },
        },
      },
    ];
  }

  get override() {
    return {
      noTemplate: true,
    };
  }

}
