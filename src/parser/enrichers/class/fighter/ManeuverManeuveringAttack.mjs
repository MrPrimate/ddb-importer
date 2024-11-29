/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverManeuveringAttack extends DDBEnricherData {
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

  get effects() {
    return [];
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return null;
  }
}
