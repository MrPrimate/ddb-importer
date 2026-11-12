import DDBEnricherData from "../../data/DDBEnricherData";

export default class CombatSuperiority extends DDBEnricherData {

  get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Superiority Dice",
      max: `@scale.${this.subclassIdentifier("Battle Master")}.combat-superiority-uses`,
      period: "sr",
    });
    return {
      uses,
    };
  }

}
