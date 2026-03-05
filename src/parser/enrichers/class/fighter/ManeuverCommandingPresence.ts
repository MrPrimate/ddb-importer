import DDBEnricherData from "../../data/DDBEnricherData";
import Maneuver from "./Maneuver";

export default class ManeuverCommandingPresence extends Maneuver {

  get type() {
    return this.useMidiAutomations ? DDBEnricherData.ACTIVITY_TYPES.UTILITY : DDBEnricherData.ACTIVITY_TYPES.CHECK;
  }

  get activity(): IDDBActivityData {
    return this.useMidiAutomations
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

  get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Commanding Presence Bonus",
        daeSpecialDurations: ["isSkill.itm" as const, "isSkill.per" as const, "isSkill.prf" as const],
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
