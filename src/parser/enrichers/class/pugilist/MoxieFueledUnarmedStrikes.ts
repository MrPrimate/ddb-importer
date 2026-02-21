import DDBEnricherData from "../../data/DDBEnricherData";
import UnarmedStrikeAttack from "./UnarmedStrikeAttack";

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
