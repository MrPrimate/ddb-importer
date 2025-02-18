/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class GuardianAura extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "special",
      activationCondition: "Start of each of targets turn",
      addItemConsume: true,
      itemConsumeValue: "20",
      noTemplate: true,
      data: {
        range: {
          units: "ft",
          value: "10",
        },
        save: {
          ability: ["dex"],
          dc: {
            calculation: "spellcasting",
            formula: "",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "20",
              damageType: "radiant",
            }),
          ],
        },
      },
    };
  }

  get override() {
    return {
      data: {
        system: {
          uses: {
            spent: "0",
            max: "60",
            recovery: [],
          },
        },
      },
    };
  }

}
