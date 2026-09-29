import GenericLightSource from "./GenericLightSource";

/** Torches and candles: lighting one spends its single use, and the item is destroyed when spent. */
export default class _HandheldFlame extends GenericLightSource {

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: 0,
        max: "1",
        recovery: [],
        autoDestroy: true,
      },
    };
  }

}
