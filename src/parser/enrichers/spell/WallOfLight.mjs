/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../mixins/DDBEnricherMixin.mjs";

export default class WallOfLight extends DDBEnricherMixin {

  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Place Wall",
      removeDamageParts: true,
      damageParts: foundry.utils.deepClone(this.data.damage.parts[0]),
      data: {
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
          name: "Turn End Damage",
          type: "damage",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          partialDamageParts: [0],
          noSpellslot: true,
          activationOverride: { type: "spec", condition: "Ends turn in Light" },
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
      {
        constructor: {
          name: "Beam of Radiance Attack",
          type: "attack",
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateConsumption: false,
          generateTarget: true,
          partialDamageParts: [0],
          noSpellslot: true,
          rangeOverride: { value: 60, units: "ft" },
          activationOverride: { type: "spec", condition: "" },
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
      data: {
        "system.range": {
          units: "",
        },
      },
    };
  }

  get effects() {
    return {
      name: "Blinded",
      statuses: ["Blinded"],
      options: {
        durationSeconds: 600,
      },
      activityMatch: "Place Wall",
    };
  }

}
