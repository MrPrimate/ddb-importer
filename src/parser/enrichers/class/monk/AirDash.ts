import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Warrior of the Street level 11: 1 Focus Point on your turn, no action required, grants a Fly
 * Speed equal to your Speed until the end of your next turn and Advantage on your next melee
 * attack this turn.
 *
 * dnd5e 5.x has no attack roll mode on actors, so the advantage lives on the midi and AC5e
 * channels only and is a reminder without either. AC5e's `once` removes it after the attack; midi
 * relies on DAE's usage token.
 */
export default class AirDash extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Air Dash",
      targetType: "self",
      activationType: "special",
      activationCondition: "On your turn, no action required",
      addItemConsume: true,
      itemConsumeTargetName: "Monk's Focus",
      itemConsumeValue: "1",
      data: {
        range: { units: "self" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Air Dash: Flight",
        options: {
          // DAE's source-turn tokens fire at the end of the current turn when self-applied, so the
          // end of the next turn is a counted round and turn instead
          expiry: null,
          durationRounds: 1,
          durationTurns: 1,
          description: "You have a Fly Speed equal to your Speed until the end of your next turn.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.walk", 20, "system.attributes.movement.fly"),
        ],
      },
      {
        name: "Air Dash: Advantage",
        daeSpecialDurations: ["1Attack" as const],
        options: {
          expiry: "turnEnd",
          // null stops the description's "end of your next turn" stamping a round on top
          durationSeconds: null,
          durationTurns: 1,
          description: "Advantage on the next melee attack you make before the end of the current turn.",
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.mwak"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.advantage.attack.msak"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "once; actionType.mwak || actionType.msak",
            20,
            "flags.automated-conditions-5e.attack.advantage",
          ),
        ],
      },
    ];
  }

}
