import DDBEnricherData, { IDDBBasicDamage } from "../../data/DDBEnricherData";

export default class Slam extends DDBEnricherData {

  get damage(): IDDBBasicDamage {
    const name = this.ddbParser.ddbMonster?.npc?.name ?? "";
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

  /**
   * The scaling force damage belongs to the 2024 Animated Object stat block. The 2014 spell's
   * objects share the "Animated Object (" name that routes here, but their Slam is a fixed row of
   * the spell's statistics table and must keep the damage parsed from it.
   */
  override get activity(): IDDBActivityData | null {
    if (this.is2014) return null;
    return {
      data: {
        damage: {
          parts: [
            DDBEnricherData.basicDamagePart(foundry.utils.mergeObject(this.damage, {
              types: ["force"],
            }) as IDDBBasicDamage),
          ],
        },
      },
    };
  }

}
