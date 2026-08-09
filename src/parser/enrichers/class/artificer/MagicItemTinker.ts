import Generic from "../Generic";

export default class MagicItemTinker extends Generic {

  override get override(): IDDBOverrideData | null {
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
