/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../../data/DDBEnricherData.mjs";

export default class Slam extends DDBEnricherData {

  get damage() {
    const name = this.ddbParser.ddbMonster?.npc?.name;
    if (name.includes("Large")) {
      return {
        customFormula: "(@flags.dnd5e.summon.level - 3)d6 + @mod + @flags.dnd5e.summon.mod",
      };
    } else if (name.includes("Huge")) {
      return {
        customFormula: "(@flags.dnd5e.summon.level - 3)d12 + @mod + @flags.dnd5e.summon.mod",
      };
    } else {
      return {
        customFormula: "(@flags.dnd5e.summon.level - 4)d4 + @mod",
      };
    }
  }

  get activity() {
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart(foundry.utils.mergeObject(this.damage, {
              types: ["force"],
            })),
          ],
        },
      },
    };
  }

}
