/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WallOfThorns extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Place Wall",
      splitDamage: true,
      data: {
        img: "icons/magic/nature/root-vine-entwined-thorns.webp",
        target: {
          override: true,
          template: {
            type: "wall",
            size: "60",
            width: "5",
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
          name: "Create Circle",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: true,
          generateSave: true,
          generateTarget: true,
          img: "icons/magic/nature/trap-spikes-thorns-green.webp",
          partialDamageParts: [0],
          targetOverride: {
            override: true,
            template: {
              count: "1",
              contiguous: false,
              type: "cylinder",
              size: "20",
              height: "20",
              width: "5",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Save to Travel Through Wall",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          img: "icons/magic/nature/root-vine-entangled-humanoid.webp",
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
