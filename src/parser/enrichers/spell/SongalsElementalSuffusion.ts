import DDBEnricherData from "../data/DDBEnricherData";

export default class SongalsElementalSuffusion extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Save vs Damage",
      targetType: "enemy",
      removeSpellSlotConsume: true,
      noConsumeTargets: true,
      data: {
        sort: 2,
        target: {
          override: true,
          template: {
            contiguous: false,
            type: "radius",
            size: "15",
            units: "ft",
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Cast",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateActivation: true,
          generateConsumption: true,
          generateDuration: true,
        },
        overrides: {
          name: "Cast",
          data: {
            sort: 1,
          },
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        activityMatch: "Cast",
        options: {
          durationSeconds: 60,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("30", 20, "system.attributes.movement.speeds.fly"),
          DDBEnricherData.ChangeHelper.upgradeChange("true", 2, "system.attributes.movement.hover"),
        ],
      },
      {
        activityMatch: "Save vs Damage",
        statuses: ["prone"],
        name: "Prone",
      },
    ];
  }

  override get combineDamageTypes(): boolean {
    return true;
  }

}
