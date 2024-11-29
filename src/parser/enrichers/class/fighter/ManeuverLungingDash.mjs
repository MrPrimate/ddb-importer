/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverLungingDash extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      type: "damage",
      data: {
        damage: {
          onSave: "none",
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.battle-master.combat-superiority-die",
            }),
          ],
        },
      },
    };
  }

}
