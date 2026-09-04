import _ArcaneShot2024Option from "./_ArcaneShot2024Option";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraspingShot extends _ArcaneShot2024Option {

  protected override get damageType(): string {
    return "slashing";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: "Escape Check",
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateTarget: false,
          generateRange: false,
          checkOverride: {
            associated: ["ath"],
            ability: ["str"],
            dc: { calculation: "int", formula: "" },
          },
        },
        overrides: { noConsumeTargets: true },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isAction) return [];
    return [
      {
        name: "Grasped",
        activityMatch: this.name,
        statuses: ["Restrained"],
        options: { durationSeconds: 60 },
      },
    ];
  }

}
