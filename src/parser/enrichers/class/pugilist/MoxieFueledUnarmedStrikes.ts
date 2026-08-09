import DDBEnricherData from "../../data/DDBEnricherData";
import UnarmedStrikeAttack from "./UnarmedStrikeAttack";

export default class MoxieFueledUnarmedStrikes extends UnarmedStrikeAttack {

  override get activity(): IDDBActivityData {
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
