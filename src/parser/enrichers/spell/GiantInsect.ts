import DDBEnricherData from "../data/DDBEnricherData";

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
        { count: "10", name: "GiantInsectGiantCentipede2014" },
        { count: "3", name: "GiantInsectGiantSpider2014" },
        { count: "5", name: "GiantInsectGiantWasp2014" },
        { count: "1", name: "GiantInsectGiantScorpion2014" },
      ],
      summons: {
        match: {
          proficiency: false,
          attacks: false,
          saves: false,
          // dnd5e 6.0's own switch: the creature takes the caster's token disposition
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
