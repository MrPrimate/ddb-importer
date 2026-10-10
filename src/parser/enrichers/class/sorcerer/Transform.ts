import Generic from "../Generic";

/**
 * Oni Bloodline Transformation's action: once per long rest. Spending 5 sorcery points to use it
 * again is the Transformation feature's restore activity.
 */
export default class Transform extends Generic {

  override get activity(): IDDBActivityData {
    return { addItemConsume: true };
  }

}
