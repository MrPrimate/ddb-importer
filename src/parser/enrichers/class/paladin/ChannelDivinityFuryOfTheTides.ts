import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Oath of the Open Sea Fury of the Tides: for a minute, once per turn a weapon hit can push the target
 * 10 feet; pushed into an obstacle or creature, it takes Bludgeoning damage equal to your Charisma
 * modifier. A separate push-damage activity picked up the Channel Divinity cost on the documents that
 * carry the action, so the push and its damage stay in the effect's text.
 */
export default class ChannelDivinityFuryOfTheTides extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Fury of the Tides",
        activityMatch: "Channel Divinity: Fury of the Tides",
        options: {
          durationSeconds: 60,
          description: "Once per turn, when you hit a creature with a weapon attack, you can push it 10 feet away from you. If it is pushed into an obstacle or another creature, it takes Bludgeoning damage equal to your Charisma modifier.",
        },
      },
    ];
  }

}
