/* eslint-disable class-methods-use-this */

import { DDBEnricherData } from "../../data/_module.mjs";
import ArcaneShotOption from "./ArcaneShotOption.mjs";

export default class GraspingArrow extends ArcaneShotOption {

  get type() {
    return this.isAction ? "damage" : "none";
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


  get additionalActivities() {
    return this.action
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
          constructor: {
            name: "Escape Check",
            type: "check",
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

  get effects() {
    return this.isAction
      ? []
      : [
        {
          name: "Grasped",
          activityMatch: "Cast",
          changes: [
            DDBEnricherData.ChangeHelper.addChange("-10", 10, "data.attributes.movement.all"),
          ],
        },
      ];
  }

}
