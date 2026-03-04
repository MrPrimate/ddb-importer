import DDBEnricherData from "../data/DDBEnricherData";

export default class WallOfLight extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  get activity() {
    return {
      name: "Place Wall",
      splitDamage: true,
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

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Turn End Damage",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
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
        init: {
          name: "Beam of Radiance Attack",
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
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

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Blinded",
      statuses: ["Blinded"],
      options: {
        durationSeconds: 600,
      },
      activityMatch: "Place Wall",
    }];
  }

}
