import Generic from "../Generic";

export default class MoonsInspiration extends Generic {

  override get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
