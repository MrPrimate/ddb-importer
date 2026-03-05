import DDBEnricherData from "../../data/DDBEnricherData";

export default class ArmsOfTheAstralSelfWisAttack extends DDBEnricherData {
  get activity(): IDDBActivityData {
    return {
      noConsumeTargets: true,
      noeffect: true,
      data: {
        "attack.ability": "wis",
        "damage.parts": [DDBEnricherData.basicDamagePart({
          customFormula: "@scale.monk.die.die + @mod",
          types: ["force"],
        })],
      },
    };
  }
}
