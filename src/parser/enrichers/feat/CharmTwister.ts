import Generic from "./Generic";

/**
 * Charm Twister: Twisted Hex has no use limit (only one charm exists at a time), but DDB sends its action with one use
 * and the "Other" reset, so the hex would spend a use that never returns. Old Blessing's Bless keeps its own Long Rest
 * cast. The hex action is named after the chosen ability ("Twisted Hex: Intelligence").
 */
export default class CharmTwister extends Generic {

  override get override(): IDDBOverrideData {
    const hexes = (this.ddbParser?.ddbData?.character.actions.feat ?? [])
      .filter((action) => action.name.startsWith("Twisted Hex"))
      .map((action) => action.name);
    return {
      uses: { spent: 0, max: "", recovery: [] },
      noConsumeTargetActivities: hexes,
    };
  }

}
