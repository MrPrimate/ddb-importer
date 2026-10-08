import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Fighting Style feat: taking the Attack action grants +10 ft Speed until the end of the turn.
 * Used from the sheet when the Attack action is taken, rather than a passive toggle. The
 * Disadvantage on Opportunity Attacks against you is left to the player: an Opportunity Attack
 * rolls the attacker's normal attack activity, so no roll data marks it as one.
 */
export default class MobileCombatant extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  // DDB's restricted speed modifier would otherwise become an always-off passive toggle
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Slippery",
      targetType: "self",
      rangeSelf: true,
      activationType: "special",
      activationCondition: "When you take the Attack action",
      data: {
        duration: { value: "1", units: "turn" },
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Slippery",
        options: {
          expiry: "turnEnd",
          durationSeconds: null,
          description: "Your Speed increases by 10 feet until the end of your turn, and Opportunity Attacks have Disadvantage against you.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("10", 20, "system.attributes.movement.speeds.walk"),
        ],
      },
    ];
  }

}
