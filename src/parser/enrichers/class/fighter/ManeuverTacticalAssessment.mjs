/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverTacticalAssessment extends DDBEnricherData {

  get type() {
    return "check";
  }

  get activity() {
    return {
      noeffect: true,
      data: {
        name: "Roll Check (Apply Effect First)",
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
        changes: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.his.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.inv.bonuses.check"),
          DDBEnricherData.ChangeHelper.unsignedAddChange("@scale.battle-master.combat-superiority-die", 20, "system.skills.ins.bonuses.check"),
        ],
      },
    ];
  }

  get additionalActivities() {
    return [
      {
        constructor: {
          name: "Bonus Dice Effect",
          type: "utility",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateActivation: true,
          activationOverride: {
            type: "special",
            value: 1,
            condition: "",
          },
        },
      },
    ];
  }

}
