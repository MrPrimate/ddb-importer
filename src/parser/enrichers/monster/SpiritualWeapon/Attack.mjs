/* eslint-disable class-methods-use-this */
// import { utils } from "../../../../lib/_module.mjs";
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Attack extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      targetType: "creature",
      activationType: "bonus",
      noTemplate: true,
      data: {
        range: {
          units: "ft",
          value: "5",
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: this.is2014
                ? "(@flags.dnd5e.summon.level - 1)d8 + @flags.dnd5e.summon.mod"
                : "(@flags.dnd5e.summon.level - 1)d8 + @flags.dnd5e.summon.mod",
              types: ["force"],
            }),
          ],
        },
      },
    };
  }

}
