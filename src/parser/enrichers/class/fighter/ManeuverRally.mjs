/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ManeuverRally extends DDBEnricherData {
  get type() {
    return "heal";
  }

  get activity() {
    return {
      data: {
        healing: DDBEnricherData.basicDamagePart({
          customFormula: "@scale.battle-master.combat-superiority-die",
          types: ["temphp"],
        }),
      },
    };
  }
}
