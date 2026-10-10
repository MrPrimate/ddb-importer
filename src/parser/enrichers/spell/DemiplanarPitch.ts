import DDBEnricherData from "../data/DDBEnricherData";

/** The Magus Class cantrip: DDB sends one 1d8 part per damage type, but the caster picks one type. */
export default class DemiplanarPitch extends DDBEnricherData {

  override get combineDamageTypes(): boolean {
    return true;
  }

}
