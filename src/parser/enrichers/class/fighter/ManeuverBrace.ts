import Maneuver from "./Maneuver";

export default class ManeuverBrace extends Maneuver {

  override get type(): IDDBActivityType {
    return Maneuver.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Brace",
      activationType: "reaction",
      addItemConsume: true,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.extraDamageActivity(),
    ];
  }


  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
      ignoredConsumptionActivities: this.ignoredConsumptionActivities,
      data: {
        name: this.data.name.replace("Maneuver Options:", "Maneuver:").replace("Maneuvers:", "Maneuver: "),
      },
    };
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Brace: Extra Damage (Automation)",
        midiOnly: true,
        activityMatch: "Brace",
        daeSpecialDurations: ["1Attack:mwak" as const],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        midiChanges: [
          Maneuver.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.rolls.damage.mwak.bonus"),
        ],
      },
    ];
  }


}
