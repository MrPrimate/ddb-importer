import DDBEnricherData from "../data/DDBEnricherData";

export default class ProgrammedIllusion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getIllusions;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      noTemplate: true,
      profileKeys: [
        { count: 1, name: "IllusionObject" },
        { count: 1, name: "IllusionSound" },
        { count: 1, name: "IllusionCreature" },
      ],
      data: {
        creatureSizes: [
          "tiny",
          "sm",
          "med",
          "lg",
          "huge",
          "grg",
        ],
      },
    };
  }

}
