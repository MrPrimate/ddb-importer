/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";
import Maneuver from "./Maneuver.mjs";

export default class ManeuverCommandingPresence extends Maneuver {

  get type() {
    return DDBEnricherData.AutoEffects.effectModules().midiQolInstalled ? "utility" : "check";
  }

  get activity() {
    return DDBEnricherData.AutoEffects.effectModules().midiQolInstalled
      ? {
        targetType: "self",
        activationType: "special",
        addItemConsume: true,
      }
      : {
        targetType: "self",
        activationType: "special",
        addItemConsume: true,
        data: {
          name: "Roll Check (Apply Effect First)",
          check: {
            associated: ["per", "itm", "prf"],
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
        name: "Commanding Presence Bonus",
        daeSpecialDurations: ["isSkill.itm", "isSkill.per", "isSkill.prf"],
        data: {
          duration: {
            turns: 2,
          },
        },
        changes: ["per", "itm", "prf"].map((skill) =>
          DDBEnricherData.ChangeHelper.unsignedAddChange(this.diceString, 20, `system.skills.${skill}.bonuses.check`),
        ),
      },
    ];
  }

}
