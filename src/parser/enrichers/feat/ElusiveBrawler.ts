import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Elusive Brawler (World of Warcraft): Reactive Dodge takes the Dodge action as a Reaction to taking
 * damage. The activity applies a Dodging marker until the start of the character's next turn.
 */
export default class ElusiveBrawler extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Reactive Dodge",
      activationType: "reaction",
      activationCondition: "You take damage",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Dodging",
        options: {
          expiry: "sourceStart",
          description: "Attack rolls against you have Disadvantage if you can see the attacker, and you make Dexterity saving throws with Advantage. You lose this benefit if you have the Incapacitated condition or if your Speed is 0.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.advantageAbilitySaveChange("dex"),
        ],
      },
    ];
  }

}
