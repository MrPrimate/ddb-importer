import Generic from "../Generic";

export default class MoonsInspiration extends Generic {

  get override(): IDDBOverrideData {
    return {
      replaceActivityUses: true,
    };
  }

}
