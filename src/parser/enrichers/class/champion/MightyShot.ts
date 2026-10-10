import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Free League Champion: before a ranged weapon attack you can roll the weapon's damage die and take
 * it as an attack penalty; a hit then adds two weapon damage dice, once per turn. The penalty is
 * rolled by hand; AC5e adds the dice as an opt-in on ranged weapon damage.
 */
export default class MightyShot extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      targetType: "self",
      activationType: "special",
      activationCondition: "Before a ranged weapon attack: roll the weapon's damage die and subtract it from the attack roll",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mighty Shot (Automation)",
        ac5eOnly: true,
        options: {
          transfer: true,
          description: "Once per turn, a ranged weapon hit after taking the Mighty Shot penalty deals two additional weapon damage dice.",
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2; oncePerTurn; optin; actionType.rwak",
            20,
            "flags.automated-conditions-5e.damage.extraDice",
          ),
        ],
      },
    ];
  }

}
