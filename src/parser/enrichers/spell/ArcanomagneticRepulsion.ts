import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, emanation } from "./_SpellAreas";

const RADIUS = "20 + 5 * @scaling.increase";

/**
 * The area within 20 feet is difficult terrain only for creatures made of or armoured in ferrous
 * metal, which the table judges. DDB records the area as a sphere, which would stay where it was
 * cast, so it is restated as an emanation, 5 feet wider per slot level above 2nd. The pulse is
 * one chosen creature's save, made as the spell is cast and as a Bonus Action after.
 */
export default class ArcanomagneticRepulsion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer({ target: emanation(RADIUS, "enemy") });
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Magnetic Pulse", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateDuration: true,
          durationOverride: { units: "inst", concentration: false },
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: { type: "bonus", value: 1, condition: "Also as the spell is cast; one Huge or smaller creature slowed by the terrain" },
          targetOverride: { override: true, affects: { count: "1", type: "enemy" }, template: {} },
          rangeOverride: { override: true, value: RADIUS, units: "ft" },
        },
        overrides: {
          noTemplate: true,
          data: { damage: { onSave: "none" } },
        },
      },
    ];
  }

}
