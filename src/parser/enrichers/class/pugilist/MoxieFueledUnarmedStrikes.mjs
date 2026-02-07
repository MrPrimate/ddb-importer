/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import UnarmedStrikeAttack from "./UnarmedStrikeAttack.mjs";

export default class MoxieFueledUnarmedStrikes extends UnarmedStrikeAttack {

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
