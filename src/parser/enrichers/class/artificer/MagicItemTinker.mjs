/* eslint-disable class-methods-use-this */
import Generic from "../Generic.mjs";

export default class MagicItemTinker extends Generic {

  get override() {
    if (this.is2014) return null;
    return {
      data: {
        "system.uses": {
          max: "",
          spent: null,
          recovery: [],
        },
      },
    };
  }

}
