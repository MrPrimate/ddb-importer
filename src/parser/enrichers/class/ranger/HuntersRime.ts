import DDBEnricherData from "../../data/DDBEnricherData";

export default class HuntersRime extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          number: 1,
          denomination: 10,
          types: ["temphp"],
        }),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Rimed Hunter's Mark",
        statuses: ["Marked"],
        options: {
          durationSeconds: 3600,
          description: "Can't take the Disengage action while marked by your Hunter's Mark.",
        },
      },
    ];
  }

}
