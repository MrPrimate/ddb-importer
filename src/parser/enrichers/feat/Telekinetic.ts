import DDBEnricherData from "../data/DDBEnricherData";

export default class Telekinetic extends DDBEnricherData {

  static ABILITY_CHOICES: Record<string, string> = {
    Intelligence: "int",
    Wisdom: "wis",
    Charisma: "cha",
  };

  override get activity(): IDDBActivityData {
    return {
      type: DDBEnricherData.ACTIVITY_TYPES.NONE,
    };
  }

  /**
   * The save DC keys off the ability picked for the feat. DDB only generates its
   * "Telekinetic Shove" action once that pick is made, so the activity is built here
   * instead and falls back to the spellcasting ability when no pick is recorded.
   */
  get _saveAbility(): string {
    const chosen = this.ddbParser.isMuncher
      ? undefined
      : this.ddbParser._chosen?.find((choice) => choice.label in Telekinetic.ABILITY_CHOICES)?.label;
    return chosen ? Telekinetic.ABILITY_CHOICES[chosen] : "spellcasting";
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        init: {
          name: "Shove",
          type: DDBEnricherData.ACTIVITY_TYPES.SAVE,
        },
        build: {
          generateActivation: true,
          generateSave: true,
          generateRange: true,
          generateTarget: true,
          saveOverride: {
            ability: ["str"],
            dc: { calculation: this._saveAbility, formula: "" },
          },
          rangeOverride: {
            units: "ft",
            value: "30",
          },
          targetOverride: {
            affects: {
              count: "1",
              type: "creature",
            },
          },
        },
        overrides: {
          activationType: "bonus",
          overrideActivation: true,
        },
      },
    ];
  }

}
