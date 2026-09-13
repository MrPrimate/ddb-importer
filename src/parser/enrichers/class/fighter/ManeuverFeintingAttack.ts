import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";


export default class ManeuverFeintingAttack extends Maneuver {
  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Feint",
      activationType: "bonus",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }


  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Feinting Attack: Extra Damage",
        activityMatch: "Feint",
        options: {
          description: "Advantage on the next attack roll against the target this turn, and the superiority die is added to its damage. Without DAE or AC5e the effect lasts for every attack until the start of your next turn.",
        },
        // DAE and AC5e each end the effect after the one attack; the duration is the ceiling
        daeSpecialDurations: ["1Attack"],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.ruleAdvantageChange("attack"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.rolls.damage.mwak.bonus"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.rolls.damage.rwak.bonus"),
        ],
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange("once; 1", 20, "flags.automated-conditions-5e.attack.advantage"),
        ],
      },
    ];
  }

}
