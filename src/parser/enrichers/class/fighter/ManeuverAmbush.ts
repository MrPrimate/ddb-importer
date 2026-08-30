import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverAmbush extends Maneuver {

  override get type(): IDDBActivityType {
    return DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Stealth Check",
      activationType: "special",
      targetType: "self",
      addItemConsume: true,
      data: {
        check: {
          associated: ["ste"],
          ability: "dex",
          bonus: this.diceString,
          dc: {
            calculation: "",
            formula: "",
          },
          visible: true,
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Initiative Bonus",
          type: DDBEnricherData.ACTIVITY_TYPES.UTILITY,
        },
        build: {
          generateRange: false,
        },
        overrides: {
          activationType: "special",
          targetType: "self",
          addItemConsume: true,
        },
      },
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Ambush Bonus",
        activityMatch: "Initiative Bonus",
        daeSpecialDurations: ["Initiative"],
        data: {
          duration: {
            value: 6,
            expiry: "turnStart",
            expired: null,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.attributes.init.roll.bonus"),
        ],
      },
    ];
  }

}
