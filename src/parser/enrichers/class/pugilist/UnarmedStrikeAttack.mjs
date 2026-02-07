/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class UnarmedStrikeAttack extends DDBEnricherData {

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.pugilist.fisticuffs + @abilities.str.mod",
              types: ["bludgeoning"],
            }),
          ],
        },
      },
    };
  }

}
