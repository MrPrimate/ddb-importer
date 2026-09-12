import DDBEnricherData from "../data/DDBEnricherData";

export default class InspiringLeader extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  static ABILITY_CHOICES: Record<string, "wis" | "cha"> = {
    Wisdom: "wis",
    Charisma: "cha",
  };

  /**
   * The temp HP keys off the ability the feat increased. A character import carries
   * that choice, so it gets the one matching activity; the mule/muncher import does
   * not, so it gets both and the user deletes the one that does not apply.
   */
  get _chosenAbility(): "wis" | "cha" | null {
    if (this.ddbParser.isMuncher) return null;
    const chosen = this.ddbParser._chosen?.find((choice) => choice.label in InspiringLeader.ABILITY_CHOICES)?.label;
    return chosen ? InspiringLeader.ABILITY_CHOICES[chosen] : null;
  }

  /**
   * DDB ships the 2024 "Bolstering Performance" action only once the feat's ability is
   * picked, so the activity is built here. The 2014 feat has no action and wants no activity.
   */
  _bolsteringPerformance(ability: "wis" | "cha", { suffix = true } = {}): IDDBAdditionalActivity {
    const label = ability === "wis" ? "Wisdom" : "Charisma";
    return {
      init: {
        name: `Bolstering Performance: Temp HP${suffix ? ` (${label})` : ""}`,
        type: DDBEnricherData.ACTIVITY_TYPES.HEAL,
      },
      build: {
        generateActivation: true,
        generateRange: true,
        generateTarget: true,
        generateHealing: true,
        generateConsumption: false,
        activationOverride: {
          type: "special",
          value: 1,
          condition: "After you finish a Short or Long Rest",
        },
        rangeOverride: {
          value: "30",
          units: "ft",
          special: "",
        },
        targetOverride: {
          affects: {
            count: "6",
            type: "ally",
            choice: true,
            special: "Up to six allies, which can include yourself",
          },
        },
        healingPart: DDBEnricherData.basicDamagePart({
          customFormula: `@details.level + @abilities.${ability}.mod`,
          type: "temphp",
        }),
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.is2014) return [];
    const chosen = this._chosenAbility;
    if (chosen) return [this._bolsteringPerformance(chosen, { suffix: false })];
    return [this._bolsteringPerformance("wis"), this._bolsteringPerformance("cha")];
  }

}
