import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Neko Duelist (OTFY). DDB ships the two shove riders as bare utilities; each becomes the
 * Bludgeoning damage its option deals on a failed save, half the Fighter level rounded up (plus
 * the Strength modifier for a push).
 */
export default class OutsizedTrickery extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  #shoveDamage(name: string, bonus: string): IDDBAdditionalActivity {
    return {
      init: {
        name,
        type: DDBEnricherData.ACTIVITY_TYPES.DAMAGE,
      },
      build: {
        generateDamage: true,
        generateConsumption: false,
      },
      overrides: {
        name,
        activationType: "special",
        activationCondition: "A creature fails its save against your Shove",
        noConsumeTargets: true,
        targetType: "creature",
        data: {
          range: { units: "touch" },
          damage: {
            parts: [
              DDBEnricherData.basicDamagePart({
                customFormula: bonus,
                types: ["bludgeoning"],
              }),
            ],
          },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.#shoveDamage("Shove: Push Damage", "ceil(@classes.fighter.levels / 2) + @abilities.str.mod"),
      this.#shoveDamage("Shove: Prone Damage", "ceil(@classes.fighter.levels / 2)"),
    ];
  }

}
