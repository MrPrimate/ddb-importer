/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class ArmsOfTheAstralSelfWisAttack extends DDBEnricherData {
  get activity() {
    return {
      noConsumeTargets: true,
      noeffect: true,
      data: {
        "attack.ability": "",
        "damage.parts": [DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die.die + @mod",
          types: ["force"],
        })],
      },
    };
  }
}
