import DDBEnricherData from "../../data/DDBEnricherData";

export default class CombatSuperiority extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    const uses = this._getUsesWithSpent({
      type: "class",
      name: "Superiority Dice",
      max: `@scale.${this.subclassIdentifier("Battle Master")}.superiority.number`,
      period: "sr",
    });
    return {
      uses,
    };
  }

}
