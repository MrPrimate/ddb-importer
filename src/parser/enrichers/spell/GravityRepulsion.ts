import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer, emanation } from "./_SpellRegions";

const RADIUS = "20 + 5 * @scaling.increase";

/**
 * The 20-foot emanation is difficult terrain for creatures the caster picks, which a region
 * cannot ask, so it slows enemies; it grows 5 feet per slot level above 4th, as does the pulse's
 * reach. The pulse is one chosen creature's save, made as the spell is cast and as a Bonus Action
 * after, so it is its own activity rather than something the area fires. Ranged weapon attacks
 * against the caster having Disadvantage is a target-side fact only midi can carry.
 */
export default class GravityRepulsion extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return {
      ...castPlacer([DDBEnricherData.BehaviorHelper.difficultTerrain()], { target: emanation(RADIUS, "enemy") }),
      noeffect: false,
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: { name: "Gravity Pulse", type: DDBEnricherData.ACTIVITY_TYPES.SAVE },
        build: {
          generateActivation: true,
          generateConsumption: false,
          generateTarget: true,
          generateRange: true,
          generateSave: true,
          generateDamage: true,
          noSpellslot: true,
          activationOverride: { type: "bonus", value: 1, condition: "Also as the spell is cast; one Huge or smaller creature, pushed 10 feet on a failure" },
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

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Prone",
        activityMatch: "Gravity Pulse",
        statuses: ["Prone"],
        options: { transfer: false },
      },
      {
        name: "Gravity Repulsion",
        activityMatch: "Cast",
        midiOnly: true,
        midiChanges: [
          DDBEnricherData.ChangeHelper.unsignedAddChange("1", 20, "flags.midi-qol.grants.disadvantage.attack.rwak"),
        ],
        options: { transfer: false, description: "Ranged weapon attacks against you have Disadvantage." },
      },
    ];
  }

}
