import DDBEnricherData from "../data/DDBEnricherData";

export default class PrismaticWall extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Create Globe",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
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
        init: {
          name: "Blinding Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
        init: {
          name: "Damage Save",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
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
          damageParts: [DDBEnricherData.basicDamagePart({ number: 1, denomination: 6, types: ["fire", "acid", "lightning", "poison", "cold"] })],
        },
      },
    ];
  }

  get override(): IDDBOverrideData {
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

  get effects(): IDDBEffectHint[] {
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

  get clearAutoEffects() {
    return true;
  }

}
