/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverTacticalAssessment extends Maneuver {

  get type() {
    return this.useMidiAutomations ? "utility" : "check";
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

  get effects() {
    return [
      {
        name: "Tactical Assessment Bonus",
        daeSpecialDurations: ["isSkill.his", "isSkill.inv", "isSkill.ins"],
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

  // get additionalActivities() {
  //   return [
  //     {
  //       constructor: {
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
