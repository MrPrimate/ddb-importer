import { DDBEnricherData } from "../../data/_module";
import ArcaneShotOption from "./ArcaneShotOption";

export default class GraspingArrow extends ArcaneShotOption {

  static MOVEMENT_DAMAGE_NAME = "Movement Damage";

  static ESCAPE_CHECK_NAME = "Escape Check";

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity(): IDDBActivityData {
    return this.isAction
      ? {
        name: "Cast",
        data: {
          range: {
            value: null,
            long: null,
            units: "spec",
          },
        },
      }
      : null;
  }

  // the feature keeps DDB's action-matched Cast activity, so its own activities must be added to
  // it rather than replaced by it
  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.isAction
      ? []
      : [
        {
          duplicate: true,
          overrides: {
            name: GraspingArrow.MOVEMENT_DAMAGE_NAME,
            noConsumeTargets: true,
            data: {
              damage: {
                parts: [
                  DDBEnricherData.basicDamagePart({
                    customFormula: "@scale.arcane-archer.arcane-shot-options",
                    types: ["slashing"],
                  }),
                ],
              },
            },
          },
        },
        {
          init: {
            name: GraspingArrow.ESCAPE_CHECK_NAME,
            type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
          },
          build: {
            generateCheck: true,
            generateActivation: true,
            generateTarget: false,
            generateRange: false,
            activationOverride: { type: "action", value: 1, condition: "The target or any creature that can reach it" },
            checkOverride: {
              "associated": [
                "ath",
              ],
              "ability": "str",
              "dc": {
                "calculation": "int",
                "formula": "",
              },
            },
          },
          overrides: { noConsumeTargets: true },
        },
      ];
  }

  /**
   * CONSUMPTION_LINKS points every Grasping Arrow activity at the Arcane Shot uses post-import;
   * only the Cast spends one.
   */
  override get override(): IDDBOverrideData | null {
    return this.isAction
      ? null
      : { ignoredConsumptionActivities: [GraspingArrow.MOVEMENT_DAMAGE_NAME, GraspingArrow.ESCAPE_CHECK_NAME] };
  }

  override get effects(): IDDBEffectHint[] {
    return this.isAction
      ? []
      : [
        {
          name: "Grasped",
          activityMatch: "Cast",
          changes: [
            DDBEnricherData.ChangeHelper.customChange("-10", 10, "system.attributes.movement.all"),
          ],
        },
      ];
  }

}
