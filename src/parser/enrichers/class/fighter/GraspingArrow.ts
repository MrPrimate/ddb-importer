import { DDBEnricherData } from "../../data/_module";
import ArcaneShotOption from "./ArcaneShotOption";

export default class GraspingArrow extends ArcaneShotOption {

  override get type(): IDDBActivityType | null {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get activity(): IDDBActivityData | null {
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

  override get addToDefaultAdditionalActivities(): boolean {
    return this.isAction;
  }


  override get additionalActivities(): IDDBAdditionalActivity[] {
    return this.isAction
      ? []
      : [
        {
          duplicate: true,
          overrides: {
            name: "Movement Damage",
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
            name: "Escape Check",
            type: DDBEnricherData.ACTIVITY_TYPES.CHECK,
          },
          build: {
            generateCheck: true,
            generateTarget: false,
            generateRange: false,
            checkOverride: {
              "associated": [
                "ath",
              ],
              "ability": ["str"],
              "dc": {
                "calculation": "int",
                "formula": "",
              },
            },
          },
        },
      ];
  }

  override get effects(): IDDBEffectHint[] {
    return this.isAction
      ? []
      : [
        {
          name: "Grasped",
          activityMatch: "Cast",
          changes: [
            DDBEnricherData.ChangeHelper.movementBonusChange("-10", 10),
          ],
        },
      ];
  }

}
