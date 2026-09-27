import DDBEnricherData from "../../data/DDBEnricherData";

export default class BraceUp extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.pugilist.fisticuffs + @classes.pugilist.levels + @abilities.con.mod",
          types: ["temphp"],
        }),
      },
    };
  }

}
