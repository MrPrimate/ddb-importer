/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class EmpoweredStrikes extends DDBEnricherData {
  get type() {
    return "attack";
  }

  get activity() {
    return {
      targetType: "creature",
      data: {
        range: {
          value: 5,
          units: "ft",
        },
        attack: {
          ability: "dex",
          type: {
            value: "melee",
            classification: "unarmed",
          },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.monk.martial-arts.die + @mod",
              types: ["bludgeoning", "force"],
            }),
          ],
        },
      },
    };
  }

  get clearAutoEffects() {
    return true;
  }
}
