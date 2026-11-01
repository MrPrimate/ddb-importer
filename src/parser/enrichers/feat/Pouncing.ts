import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Pouncing fighting style (OTFY, Neko Duelist): +2 to a Melee weapon or Unarmed Strike attack after
 * moving 15 feet or more toward the target. AC5e applies it from the movement; otherwise the Pounce
 * activity applies the bonus for the next attack. The +2 Grapple / Shove DC is description only.
 */
export default class Pouncing extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Pounce",
      activationType: "special",
      activationCondition: "You moved 15 feet or more toward a creature immediately before attacking it",
      targetType: "self",
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pouncing",
        ac5eOnly: true,
        options: {
          transfer: true,
        },
        ac5eChanges: [
          DDBEnricherData.ChangeHelper.ac5eChange(
            "bonus=2; actionType.mwak && movementLastSegment >= 15",
            20,
            "flags.automated-conditions-5e.attack.bonus",
          ),
        ],
      },
      {
        name: "Pouncing: Attack Bonus",
        ac5eNever: true,
        activityMatch: "Pounce",
        options: {
          expiry: "turnEnd",
        },
        daeSpecialDurations: ["1Attack"],
        changes: [
          DDBEnricherData.ChangeHelper.addChange("2", 20, "system.bonuses.mwak.attack"),
        ],
      },
    ];
  }

}
