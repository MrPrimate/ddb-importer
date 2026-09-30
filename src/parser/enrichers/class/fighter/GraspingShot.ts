import _ArcaneShot2024Option from "./_ArcaneShot2024Option";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class GraspingShot extends _ArcaneShot2024Option {

  static ESCAPE_CHECK_NAME = "Escape Check";

  protected override get damageType(): string {
    return "slashing";
  }

  // the option base keeps only DDB's action-matched activities unless its own are added to them
  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      {
        init: {
          name: GraspingShot.ESCAPE_CHECK_NAME,
          type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
        },
        build: {
          generateCheck: true,
          generateActivation: true,
          generateTarget: false,
          generateRange: false,
          activationOverride: { type: "action", value: 1, condition: "The Grasped creature or a creature within reach of it" },
          checkOverride: {
            associated: ["ath"],
            ability: "str",
            dc: { calculation: "int", formula: "" },
          },
        },
        overrides: { noConsumeTargets: true },
      },
    ];
  }

  /**
   * CONSUMPTION_LINKS points every Grasping Shot activity at the Arcane Shot uses post-import; the
   * Escape Check is made by the grasped creature, so it must stay free.
   */
  override get override(): IDDBOverrideData {
    return {
      ignoredConsumptionActivities: [GraspingShot.ESCAPE_CHECK_NAME],
    };
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
