import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Recalling the chest from the Ethereal Plane puts it on the map, which the dnd5e SRD pack offers
 * as a summon of a bare chest token. The spell reads the same under both rulesets.
 */
export default class SecretChest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.SUMMON;
  }

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getSecretChest;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get activity(): IDDBActivityData {
    return {
      name: "Recall Chest",
      noTemplate: true,
      profileKeys: [{ count: 1, name: "SRDObjectSecretChest" }],
    };
  }

}
