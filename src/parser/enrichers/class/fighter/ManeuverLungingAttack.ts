import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverLungingAttack extends Maneuver {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get activity() {
    return {
      name: "Lunge",
      activationType: "special",
      addItemConsume: true,
    };
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lunging Attack Bonus Damage",
        daeSpecialDurations: ["1Attack" as const],
        data: {
          duration: {
            turns: 1,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.bonuses.mwak.damage"),
        ],
      },
    ];
  }

}
