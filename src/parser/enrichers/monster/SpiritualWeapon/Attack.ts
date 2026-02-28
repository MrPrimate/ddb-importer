// import { utils } from "../../../../lib/_module";
import DDBEnricherData from "../../data/DDBEnricherData";

export default class Attack extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
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
