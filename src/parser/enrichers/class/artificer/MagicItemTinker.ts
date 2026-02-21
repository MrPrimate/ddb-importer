import Generic from "../Generic";

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
