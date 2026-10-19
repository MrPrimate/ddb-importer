import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "8 (1d8 + 4) piercing damage, or 13 (2d8 + 4) piercing damage while enlarged. If the minotaur
 * moved at least 10 feet straight toward the target immediately before it hit, the target takes an
 * extra 4 (1d8) piercing damage, or 9 (2d8) piercing damage if the minotaur is enlarged."
 *
 * The enlarged alternative of the moving rider replaces another clause's damage, which the
 * parser's damage modes do not combine, so the four hits are spelled out here. The push and Prone
 * save is left to the parser.
 */
export default class Gore extends DDBEnricherData {

  static MOVING = "moved at least 10 feet straight toward the target immediately before the hit";

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  #piercing(number: number, bonus = ""): I5eDamagePart {
    return DDBEnricherData.basicDamagePart({ number, denomination: 8, bonus, types: ["piercing"] });
  }

  #mode(name: string, activationCondition: string, includeBase: boolean, parts: I5eDamagePart[]): IDDBAdditionalActivity {
    return {
      duplicate: true,
      overrides: {
        activationCondition,
        data: {
          name,
          damage: { includeBase, parts },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.#mode("Enlarged Attack", "while enlarged", false, [this.#piercing(2, "@mod")]),
      this.#mode("Moving Attack", Gore.MOVING, true, [this.#piercing(1)]),
      this.#mode("Enlarged Moving Attack", `while enlarged and ${Gore.MOVING}`, false, [
        this.#piercing(2, "@mod"),
        this.#piercing(2),
      ]),
    ];
  }

  override get noVersatile(): boolean {
    return true;
  }

}
