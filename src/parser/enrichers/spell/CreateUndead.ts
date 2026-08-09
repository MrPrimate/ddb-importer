import DDBEnricherData from "../data/DDBEnricherData";

export default class CreateUndead extends DDBEnricherData {
  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getCreateUndead;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
      noTemplate: true,
      profileKeys: this.is2014
        ? [
          { count: "@item.level - 3", name: "UndeadGhoul2014" },
          { count: "@item.level - 6", name: "UndeadGhast2014", level: { "min": 8 } },
          { count: "@item.level - 6", name: "UndeadWight2014", level: { "min": 8 } },
          { count: "2", name: "UndeadMummy2014", level: { "min": 9 } },
        ]
        : [
          { count: "@item.level - 3", name: "UndeadGhoul2024" },
          { count: "@item.level - 6", name: "UndeadGhast2024", level: { "min": 8 } },
          { count: "@item.level - 6", name: "UndeadWight2024", level: { "min": 8 } },
          { count: "2", name: "UndeadMummy2024", level: { "min": 9 } },
        ],
      summons: {
        match: {
          proficiency: false,
          attacks: false,
          saves: false,
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
        target: {
          affects: {
            choice: false,
            count: "@item.level - 3",
            type: "object",
            special: "",
          },
          override: true,
          prompt: true,
        },
      },
    };
  }

  override get override(): IDDBOverrideData {
    return {
      data: {
        flags: {
          ddbimporter: {
            disposition: {
              match: true,
            },
          },
        },
      },
    };
  }
}
