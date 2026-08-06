import DDBEnricherData from "../../data/DDBEnricherData";

export default class GrantTemporaryHitPoints extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      activationType: "bonus",
      data: {
        description: {
          chatFlavor: "While the target has these Temporary Hit Points, it can lose all of them when it hits with a weapon or Unarmed Strike to deal that many extra Radiant damage.",
        },
        range: {
          value: 30,
          units: "ft",
        },
        duration: {
          units: "minute",
          value: "10",
        },
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "floor(@classes.bard.levels / 2) + @abilities.cha.mod",
          types: ["temphp"],
        }),
      },
    };
  }

}
