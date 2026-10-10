import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Fighting Style feat: +2 to attack and damage rolls for attacks made as part of a Reaction.
 * An Opportunity Attack rolls the weapon's normal attack activity, so nothing in the roll says it
 * is a Reaction; both bonuses are opt-ins the player ticks in the roll dialog.
 */
export default class Opportunist extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // No optinId: AC5e 13 does not reserve that keyword, so it would join the condition and fail it.
  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Opportunist (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Optional +2 bonus to attack and damage rolls when attacking as part of a Reaction.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2; optin; description=When attacking as part of a Reaction",
            20,
            "flags.automated-conditions-5e.attack.bonus",
          ),
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2; optin; description=When attacking as part of a Reaction; hasAttack",
            20,
            "flags.automated-conditions-5e.damage.bonus",
          ),
        ],
      },
    ];
  }

}
