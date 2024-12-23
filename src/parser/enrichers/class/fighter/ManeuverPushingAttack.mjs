/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";

export default class ManeuverPushingAttack extends Maneuver {

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
        name: "Maneuver: Pushing Attack",
      },
    };
  }

}
