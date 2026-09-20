import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The target's Wisdom save stays the primary activity. On a failure the spell makes an invisible
 * sensor near the target, which the dnd5e SRD pack offers as a second, slot-free summon; it is
 * the same invisible sensor Clairvoyance places, so that actor is reused.
 */
export default class Scrying extends DDBEnricherData {

  override get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return DDBImporter.lib.DDBSummonsInterface.getClairvoyance;
  }

  override get generateSummons(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Create Sensor",
          type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
        },
        build: {
          generateSummon: true,
          noSpellslot: true,
        },
        overrides: {
          noTemplate: true,
          profileKeys: [{ count: 1, name: "Clairvoyance" }],
        },
      },
    ];
  }

}
