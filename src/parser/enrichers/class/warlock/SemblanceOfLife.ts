import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Vestige Patron level 14. The spirit form's stat block is the chosen option's text
 * (companions.ts); DDB's per-form actions ride along, this only pins the once-per-long-rest use.
 */
export default class SemblanceOfLife extends DDBEnricherData {

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "1",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
