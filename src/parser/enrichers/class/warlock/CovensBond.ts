import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Coven Patron (OTFY) parent feature. Forging the bond and the coven's bond effect live on the
 * "Coven's Bond: <Coven>" option document (_CovensBond), so the parent carries neither.
 */
export default class CovensBond extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [];
  }

  override get override(): IDDBOverrideData {
    return {
      uses: { spent: 0, max: "", recovery: [] },
    };
  }

}
