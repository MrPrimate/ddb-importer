import DDBEnricherData from "../../data/DDBEnricherData";

export default class RallyingCry extends DDBEnricherData {
  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity() {
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
