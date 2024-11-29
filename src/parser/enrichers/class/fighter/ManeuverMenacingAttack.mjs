/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverMenacingAttack extends DDBEnricherData {

  get type() {
    return "save";
  }

  get activity() {
    return {
      data: {
        damage: {
          onSave: "none",
        },
        save: {
          ability: ["wis"],
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
        name: "Maneuver: Menacing Attack",
      },
    };
  }

}
