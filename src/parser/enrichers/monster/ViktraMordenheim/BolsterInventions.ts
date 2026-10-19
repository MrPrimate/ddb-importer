import _MonsterTemporaryHP from "../Generic/_MonsterTemporaryHP";

/**
 * Temporary Hit Points for the construct allies around Viktra at the end of each of her turns.
 * The construct-only restriction is left to whoever applies the healing.
 */
export default class BolsterInventions extends _MonsterTemporaryHP {

  override get activity(): IDDBActivityData | null {
    const base = super.activity;
    if (!base) return null;
    const size = this.text.match(/in a (\d+)-foot Emanation/i)?.[1] ?? "5";
    return {
      ...base,
      activationType: "turnEnd",
      activationCondition: "End of Viktra's turn, unless she has the Incapacitated condition. Constructs only.",
      noConsumeTargets: true,
      rangeSelf: true,
      data: {
        ...base.data,
        target: _MonsterTemporaryHP.targetWith({ type: "ally" }, { type: "radius", size }),
      },
    };
  }

}
