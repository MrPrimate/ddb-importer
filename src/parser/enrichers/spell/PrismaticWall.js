/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class PrismaticWall extends DDBEnricherMixin {

  get type() {
    return "utility";
  }

  get activity() {
    return {
      name: "Place Wall",
      data: {
        target: {
          override: true,
          template: {
            type: "wall",
            size: "90",
            width: "1/12",
            height: "30",
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
          name: "Create Globe",
          type: "utility",
        },
        build: {
          generateDamage: false,
          generateConsumption: true,
          generateSave: false,
          generateTarget: true,
          targetOverride: {
            override: true,
            template: {
              contiguous: false,
              type: "radius",
              size: "15",
              units: "ft",
            },
            affects: {},
          },
        },
      },
      {
        constructor: {
          name: "Blinding Save",
          type: "save",
        },
        build: {
          generateDamage: false,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: { type: "spec", condition: "Within 20ft" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: {},
          },
        },
      },
      {
        constructor: {
          name: "Damage Save",
          type: "save",
        },
        build: {
          generateDamage: true,
          generateConsumption: false,
          generateSave: true,
          generateTarget: true,
          noSpellslot: true,
          activationOverride: { type: "spec", condition: "Moving through" },
          durationOverride: { units: "inst", concentration: false },
          targetOverride: {
            override: true,
            affects: { type: "creature" },
            template: {},
          },
          damageParts: [DDBEnricherMixin.basicDamagePart({ number: 1, denomination: 6, types: ["fire", "acid", "lightning", "poison", "cold"] })],
        },
      },
    ];
  }

  get override() {
    return {
      data: {
        "system.target": {
          template: {
            contiguous: false,
            type: "",
            size: "",
            width: "",
            units: "",
          },
        },
      },
    };
  }

  get effects() {
    return [
      {
        name: "Blinded",
        statuses: ["Blinded"],
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Blinding Save",
      },
      {
        name: "Restrained",
        statuses: ["Restrained"],
        options: {
          durationSeconds: 6,
          description: "Save at the end of each turn, 3 failures results in &Reference[Petrified]",
        },
        activityMatch: "Damage Save",
      },
      {
        name: "Petrified",
        statuses: ["Petrified"],
        activityMatch: "Damage Save",
      },
      {
        name: "Blinded",
        statuses: ["Blinded"],
        options: {
          durationSeconds: 60,
        },
        activityMatch: "Damage Save",
      },
    ];
  }

  clearAutoEffects() {
    return true;
  }

}
