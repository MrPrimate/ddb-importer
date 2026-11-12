import DDBEnricherData from "../../data/DDBEnricherData";

export default class DarkOnesBlessing extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: this.is2014
        ? "When you reduce a hostile creature to 0 Hit Points"
        : "When you reduce an enemy to 0 Hit Points or an enemy within 10 feet of you is reduced to 0 Hit Points",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: `@abilities.cha.mod + @classes.${this.classIdentifier("Warlock")}.levels`,
          types: ["temphp"],
        }),
      },
    };
  }

}
