import DDBEnricherData from "../../data/DDBEnricherData";

export default class BraceUp extends DDBEnricherData {
  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.pugilist.fisticuffs + @classes.pugilist.level + @abilities.con.mod",
          types: ["temphp"],
        }),
      },
    };
  }

}
