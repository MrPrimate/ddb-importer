import DDBEnricherData from "../../data/DDBEnricherData";

export default class CombatSuperiority extends DDBEnricherData {

  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Superiority Dice",
      max: "@scale.battle-master.combat-superiority-uses",
      period: "sr",
    });
    return {
      uses,
    };
  }

}
