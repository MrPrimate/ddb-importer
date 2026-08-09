import DDBEnricherData from "../../data/DDBEnricherData";

export default class ManeuverBiteTheBullet extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "bonus",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "1@scale.gunslinger.risk.die + @classes.gunslinger.levels",
          types: ["temphp"],
        }),
      },
    };
  }

}
