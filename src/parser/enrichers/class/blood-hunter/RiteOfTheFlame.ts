import DDBEnricherData from "../../data/DDBEnricherData";
import _CrimsonRite from "./_CrimsonRite";

/** Crimson Rite choice: the extra damage dealt by the rite is fire damage. */
export default class RiteOfTheFlame extends _CrimsonRite {

  override get riteName(): string {
    return "Rite of the Flame";
  }

  override get type() {
    return DDBEnricherData.ACTIVITY_TYPES.DAMAGE;
  }

  override get activity(): IDDBActivityData {
    return this.invokeRiteActivity;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [this.applyRiteActivity(this.riteName)];
  }

  override get effects(): IDDBEffectHint[] {
    return [this.riteEnchantEffect(this.riteName)];
  }

}
