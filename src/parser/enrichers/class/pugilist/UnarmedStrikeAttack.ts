import DDBEnricherData from "../../data/DDBEnricherData";

export default class UnarmedStrikeAttack extends DDBEnricherData {

  get activity(): IDDBActivityData {
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
