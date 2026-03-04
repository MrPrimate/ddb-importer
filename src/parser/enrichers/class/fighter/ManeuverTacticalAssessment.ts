import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverTacticalAssessment extends Maneuver {

  get type() {
    return this.useMidiAutomations ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  get activity() {
    return this.useMidiAutomations
      ? {
        targetType: "self",
        activationType: "special",
        addItemConsume: true,
      }
      : {
        data: {
          name: "Roll Check (Apply Effect First)",
          addItemConsume: true,
          check: {
            associated: ["his", "inv", "ins"],
            ability: "",
            dc: {
              calculation: "",
              formula: "",
            },
          },
        },
      };
  }

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Tactical Assessment Bonus",
        daeSpecialDurations: ["isSkill.his" as const, "isSkill.inv" as const, "isSkill.ins" as const],
        data: {
          duration: {
            turns: 2,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.his.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.inv.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, "system.skills.ins.bonuses.check"),
        ],
      },
    ];
  }

  // get additionalActivities(): IDDBAdditionalActivity[] {
  //   return [
  //     {
  //       init: {
  //         name: "Bonus Dice Effect",
  //         type: "utility",
  //       },
  //       build: {
  //         generateTarget: false,
  //         generateRange: false,
  //         generateActivation: true,
  //         activationOverride: {
  //           type: "special",
  //           value: 1,
  //           condition: "",
  //         },
  //       },
  //     },
  //   ];
  // }

}
