/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class MoonsInspiration extends Generic {

  get override() {
    return {
      replaceActivityUses: true,
    };
  }

}
