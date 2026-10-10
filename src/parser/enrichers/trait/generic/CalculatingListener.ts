import DDBEnricherData from "../../data/DDBEnricherData";

/** Daemonic Accursed: after a minute of conversation, a nonhostile creature saves (Wisdom, 8 + Charisma + proficiency) or is Charmed for an hour, unaware of the attempt. */
export default class CalculatingListener extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SAVE;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Manipulate the Weak-Willed",
      targetType: "creature",
      targetCount: 1,
      activationType: "minute",
      activationCondition: "Converse with a nonhostile creature for at least 1 minute",
      addItemConsume: true,
      data: {
        save: {
          ability: ["wis"],
          dc: { calculation: "", formula: "8 + @abilities.cha.mod + @prof" },
        },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Charmed (Calculating Listener)",
        statuses: ["Charmed"],
        options: { durationSeconds: 3600 },
      },
    ];
  }

}
