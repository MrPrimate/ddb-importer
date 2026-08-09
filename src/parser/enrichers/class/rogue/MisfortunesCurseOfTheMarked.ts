import DDBEnricherData from "../../data/DDBEnricherData";

export default class MisfortunesCurseOfTheMarked extends DDBEnricherData {

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Curse of the Marked",
      targetType: "creature",
      activationType: "bonus",
      addItemConsume: true,
      itemConsumeTargetName: "Misfortunist",
      itemConsumeValue: "2",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Curse of the Marked",
        statuses: ["Marked"],
        options: {
          durationSeconds: 3600,
          description: "Evil Eye curse extended to 1 hour; the rogue always knows the direction and distance to this creature while on the same plane.",
        },
      },
    ];
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: { spent: null, max: "", recovery: [] },
        },
      },
    };
  }

}
