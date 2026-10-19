import DDBEnricherData from "../data/DDBEnricherData";

/**
 * The extra necrotic damage is part of the hit, so it is never halved and can crit; the
 * Constitution save only decides the Exhaustion level. The cast stays the save activity so the
 * Exhaustion rides on the activity that holds the slot, its upcast dice and the concentration.
 */
export default class BoneChillingSmite extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      allowCritical: true,
      data: {
        damage: { onSave: "full" },
      },
    };
  }

}
