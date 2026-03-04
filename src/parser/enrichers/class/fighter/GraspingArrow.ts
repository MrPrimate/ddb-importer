import { DDBEnricherData } from "../../data/_module";
import ArcaneShotOption from "./ArcaneShotOption";

export default class GraspingArrow extends ArcaneShotOption {

  get type() {
    return this.isAction ? DDBEnricherData.ACTIVITY_TYPES.DAMAGE : DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  get activity() {
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

  get addToDefaultAdditionalActivities() {
    return this.isAction;
  }


  get additionalActivities(): IDDBAdditionalActivity[] {
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
            generateTargets: false,
            generateRange: false,
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
        },
      ];
  }

  get effects(): IDDBEffectHint[] {
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
