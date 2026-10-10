import Generic from "../Generic";

/**
 * Crimson Sorcery: the feast is once per long rest. The action's parsed 5 sorcery point cost
 * belongs to Restore Sanguine Feast, which buys the use back.
 */
export default class SanguineFeast extends Generic {

  override get activity(): IDDBActivityData | null {
    if (!this.isAction) return null;
    return { addItemConsume: true };
  }

}
