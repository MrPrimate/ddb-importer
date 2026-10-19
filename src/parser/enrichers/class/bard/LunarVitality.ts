import DDBEnricherData from "../../data/DDBEnricherData";

export default class LunarVitality extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.HEAL;
  }

  get activity(): IDDBActivityData {
    return {
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      activationCondition: "Restore HP with a spell",
      itemConsumeTargetName: "Bardic Inspiration",
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.bard.inspiration",
          types: ["healing"],
        }),
      },
    };
  }

  // the creature's Speed also increases by 10 feet until the end of its next turn
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lunar Vitality: Speed +10 ft",
        options: {
          expiry: "targetEnd",
          description: "Speed increases by 10 feet until the end of the creature's next turn.",
        },
        changes: [DDBEnricherData.ChangeHelper.movementBonusChange("10")],
      },
    ];
  }

}
