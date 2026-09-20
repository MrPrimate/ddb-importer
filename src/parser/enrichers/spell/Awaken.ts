import DDBEnricherData from "../data/DDBEnricherData";
import { srdCreatureKey } from "../../companions/types/SRDItemSummonTable";

/**
 * Awakening a plant creates an Awakened Shrub or Awakened Tree under both rulesets, so the spell
 * offers them as a summon using the stat blocks of the ruleset being imported. Awakening a beast
 * changes an existing creature and stays manual. The dnd5e SRD pack ships this on the 2014 spell
 * only; the 2024 spell reads the same, so it gets the 2024 creatures.
 */
export default class Awaken extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getAwaken;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Awaken Plant",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: "1", name: srdCreatureKey("Awakened Shrub", this.is2014) },
        { count: "1", name: srdCreatureKey("Awakened Tree", this.is2014) },
      ],
      summons: {
        match: {
          proficiency: false,
          attacks: false,
          saves: false,
          // the creature takes the caster's token disposition
          disposition: true,
        },
        bonuses: {
          ac: "",
          hp: "",
          attackDamage: "",
          saveDamage: "",
          healing: "",
        },
      },
    };
  }

}
