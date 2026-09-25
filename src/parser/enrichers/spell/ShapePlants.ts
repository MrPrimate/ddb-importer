import DDBEnricherData from "../data/DDBEnricherData";
import { area, castPlacer, movementDamage } from "./_SpellAreas";

/**
 * Nothing is rolled as the spell is cast, and DDB calls it instantaneous though the shaping
 * lasts an hour. Only a bramble or thorny plant becomes difficult terrain that tears at whoever
 * moves through it, which is the caster's choice, so the placed area is that option. The cube
 * grows 5 feet per slot level above 4th.
 */
export default class ShapePlants extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer({
        target: area("cube", "5 * @scaling"),
        duration: { override: true, value: "1", units: "hour" },
      }),
      activationCondition: "The area is difficult terrain with thorns only if the plant is a bramble or can grow thorns",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      movementDamage("2d4 Piercing"),
    ];
  }

}
