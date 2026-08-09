import DDBEnricherData from "../../data/DDBEnricherData";

export default class RallyingCry extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Heroic Rally",
      targetType: "creature",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@classes.fighter.level",
          types: ["healing"],
        }),
      },
    };
  }

}
