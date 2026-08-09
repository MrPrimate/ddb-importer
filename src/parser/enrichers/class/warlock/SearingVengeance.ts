import DDBEnricherData from "../../data/DDBEnricherData";

export default class SearingVengeance extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Use",
      noeffect: true,
      activationCondition: "You or an ally make a death saving throw",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Damage Roll",
          type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
        },
        build: {
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateActivation: true,
          generateDamage: true,
        },
        overrides: {
          data: {
            range: {
              value: 30,
              units: "ft",
            },
            target: {
              affects: {
                type: "enemy",
              },
              template: {
                contiguous: false,
                type: "radius",
                size: "30",
                units: "ft",
              },
            },
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [{
      name: "Searing Vengeance: Blinded",
      options: {
        durationSeconds: 6,
      },
      statuses: ["Blinded"],
    }];
  }

}
