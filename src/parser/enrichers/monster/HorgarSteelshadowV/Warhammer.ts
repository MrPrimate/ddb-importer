import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * "+2 Warhammer ... Hit: 10 (1d8 + 6) bludgeoning damage, or 11 (1d10+6) bludgeoning damage if
 * used with two hands. While Horgar is enlarged, the damage increases to 15 (2d8 + 6) or 17 (2d10
 * + 6) bludgeoning damage, respectively."
 *
 * The enlarged sentence restates both rolls, which the parser's damage modes do not read, so the
 * versatile and enlarged attacks are built here. The weapon's +2 is part of the damage bonus, as
 * the monster parser sets no magical bonus.
 */
export default class Warhammer extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.ATTACK;
  }

  #mode(name: string, number: number, denomination: number, activationCondition?: string): IDDBAdditionalActivity {
    return {
      duplicate: true,
      overrides: {
        ...(activationCondition ? { activationCondition } : {}),
        data: {
          name,
          damage: {
            includeBase: false,
            parts: [
              DDBEnricherData.basicDamagePart({ number, denomination, bonus: "@mod + 2", types: ["bludgeoning"] }),
            ],
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.#mode("Versatile", 1, 10),
      this.#mode("Enlarged Attack", 2, 8, "while enlarged"),
      this.#mode("Enlarged Versatile Attack", 2, 10, "while enlarged, used with two hands"),
    ];
  }

  override get noVersatile(): boolean {
    return true;
  }

}
