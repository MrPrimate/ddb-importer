import Generic from "../Generic";

/**
 * Spirit-Fused Backup Battery: DDB carries the extra Second Wind use as this feature's own
 * once-per-rest use, so the triggered Second Wind spends that rather than the Second Wind pool.
 */
export default class SecondWindBackupBattery extends Generic {

  override get activity(): IDDBActivityData {
    return {
      activationType: "special",
      activationCondition: "Your hit points drop below your fighter level",
      addItemConsume: true,
    };
  }

}
