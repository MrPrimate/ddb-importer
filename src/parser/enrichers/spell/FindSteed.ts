import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The 2014 spell calls one of five ordinary mounts as a celestial, fey or fiend, the shape the
 * dnd5e SRD pack ships. The 2024 spell carries its own Otherworldly Steed stat block and is built
 * by the companion parser, so under 2024 rules every getter stands down.
 */
export default class FindSteed extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return this.is2014 ? DDBEnricherData.ACTIVITY_TYPES.SUMMON : null;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return this.is2014 ? DDBImporter.lib.DDBSummonsInterface.getFindSteed2014 : null;
  }

  override get generateSummons(): boolean {
    return this.is2014;
  }

  override get activity(): IDDBActivityData | null {
    if (!this.is2014) return null;
    return {
      name: "Summon Steed",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: [
        { count: "1", name: "FindSteedWarhorse2014" },
        { count: "1", name: "FindSteedPony2014" },
        { count: "1", name: "FindSteedCamel2014" },
        { count: "1", name: "FindSteedElk2014" },
        { count: "1", name: "FindSteedMastiff2014" },
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
      data: {
        creatureTypes: ["celestial", "fey", "fiend"],
      },
    };
  }

}
