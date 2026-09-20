import DDBEnricherData from "../data/DDBEnricherData";
import { srdCreatureKey } from "../../companions/types/SRDItemSummonTable";

/**
 * The 2014 spell turns up to ten centipedes, three spiders, five wasps or one scorpion into their
 * giant forms, the shape the dnd5e SRD pack ships. The 2024 spell carries its own Giant Insect
 * stat block and is built by the companion parser, so under 2024 rules every getter stands down.
 */
export default class GiantInsect extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.SUMMON : null;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return this.is2014 ? DDBImporter.lib.DDBSummonsInterface.getGiantInsect2014 : null;
  }

  override get generateSummons(): boolean {
    return this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Transform Insects",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: "10", name: srdCreatureKey("Giant Centipede", true) },
        { count: "3", name: srdCreatureKey("Giant Spider", true) },
        { count: "5", name: srdCreatureKey("Giant Wasp", true) },
        { count: "1", name: srdCreatureKey("Giant Scorpion", true) },
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
