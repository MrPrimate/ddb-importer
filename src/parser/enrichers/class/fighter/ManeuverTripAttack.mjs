/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverTripAttack extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      data: {
        damage: {
          onSave: "full",
        },
        save: {
          ability: ["str"],
          dc: {
            calculation: "",
            formula: "8 + @prof + max(@abilities.dex.mod, @abilities.str.mod)",
          },
        },
      },
    };
  }

  get override() {
    return {
      data: {
        name: "Maneuver: Trip Attack",
      },
    };
  }

}
