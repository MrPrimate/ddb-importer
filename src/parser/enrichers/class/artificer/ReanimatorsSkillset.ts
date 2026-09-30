import Generic from "../Generic";

/** Reanimator: Jolt to Life (DDB's actions) can be used a number of times equal to the Intelligence modifier per long rest. */
export default class ReanimatorsSkillset extends Generic {

  override get override(): IDDBOverrideData {
    return {
      uses: this._getUsesWithSpent({
        type: "class",
        name: "Jolt to Life: Healing",
        max: "@abilities.int.mod",
        period: "lr",
      }),
    };
  }

}
