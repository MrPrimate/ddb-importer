import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The disk is an object on the map that follows its caster, so it is placed as a bare token the
 * way the dnd5e SRD pack does it. The spell reads the same under both rulesets.
 */
export default class FloatingDisk extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getFloatingDisk;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Create Disk",
      noTemplate: true,
      profileKeys: [{ count: 1, name: "SRDObjectFloatingDisk" }],
    };
  }

}
