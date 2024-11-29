/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class DeflectAttackRedirectAttack extends DDBEnricherData {
  get type() {
    return "save";
  }

  get activity() {
    return {
      name: "Redirect Attack",
      targetType: "creature",
      addItemConsume: true,
      activationType: "special",
      type: "save",
      data: {
        save: {
          ability: ["dex"],
          dc: { calculation: "dex", formula: "" },
        },
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart({
              customFormula: "2@scale.monk.martial-arts.die + @abilities.dex.mod",
              types: ["bludgeoning", "piercing", "slashing"],
            }),
          ],
        },
      },
    };
  }
}
