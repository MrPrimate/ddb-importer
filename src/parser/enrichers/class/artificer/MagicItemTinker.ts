import Generic from "../Generic";

export default class MagicItemTinker extends Generic {

  get override(): IDDBOverrideData | null {
    if (this.is2014) return null;
    return {
      uses: {
        max: "",
        spent: null,
        recovery: [],
      },
    };
  }

}
