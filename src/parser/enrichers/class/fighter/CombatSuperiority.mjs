/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class CombatSuperiority extends DDBEnricherData {

  get override() {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Superiority Dice",
      max: "@scale.battle-master.combat-superiority-uses",
      period: "lr",
    });
    return {
      data: {
        "system.uses": uses,
      },
    };
  }

}
