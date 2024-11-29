/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverRiposte extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
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
