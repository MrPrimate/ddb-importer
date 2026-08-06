import DDBEnricherData from "../../data/DDBEnricherData";

export default class FrenziedSlaughter extends DDBEnricherData {

  get activity(): IDDBActivityData {
    return {
      name: "Frenzied Slaughter",
      type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
      addItemConsume: true,
      itemConsumeTargetName: "Channel Divinity",
      activationType: "bonus",
      targetType: "self",
    };
  }

  get effects(): IDDBEffectHint[] {
    return [{
      name: "Frenzied Slaughter",
      options: {
        durationSeconds: 60,
        description: "Reflexive Attack: when you miss with a melee weapon or Unarmed Strike attack, you can take a Reaction to attack again with the same weapon. Condition Resistance: Advantage on saving throws to avoid or end the Charmed, Frightened, and Stunned conditions. Lasts until the end of your next turn; extend each round (up to 1 minute) by attacking, forcing a save, or being Bloodied. Ends early if Incapacitated.",
      },
    }];
  }

}
