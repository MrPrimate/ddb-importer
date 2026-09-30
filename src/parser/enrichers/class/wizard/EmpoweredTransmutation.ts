import Generic from "../Generic";

/**
 * Transmuter (AU 2024). DDB's use count is the bare Intelligence modifier; the feature grants a
 * minimum of one use. The DDB action utility is still built by the Generic fallback.
 */
export default class EmpoweredTransmutation extends Generic {

  override get override(): IDDBOverrideData {
    return {
      retainUseSpent: true,
      uses: {
        spent: null,
        max: "max(1, @abilities.int.mod)",
        recovery: [{ period: "lr", type: "recoverAll" }],
      },
    };
  }

}
