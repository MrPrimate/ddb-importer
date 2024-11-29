/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class PsionicStrike extends DDBEnricherData {
  get type() {
    return "damage";
  }

  get activity() {
    return {
      name: "Psionic Strike",
      activationType: "special",
      type: "damage",
      targetType: "creature",
      addItemConsume: true,
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "@scale.psi-warrior.energy-die.die + @abilities.mod.int",
              types: ["psychic"],
            }),
          ],
        },
        range: {
          units: "ft",
          value: "30",
        },
      },
    };
  }

}
