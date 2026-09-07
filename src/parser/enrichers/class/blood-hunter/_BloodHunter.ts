import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Shared behaviour for Blood Hunter features that key off the hemocraft
 * modifier or the hemocraft die.
 *
 * The leading underscore keeps this out of the name lookup - pascalCase of a
 * DDB feature name can never start with one - while still being exported by
 * the generated barrel.
 */
export default class _BloodHunter extends DDBEnricherData {

  /**
   * The Blood Curses feature carries its own copy of the hemocraft die scale
   * from level 1, so this always resolves on a document that owns a curse.
   */
  static DIE = "@scale.blood-hunter.blood-curses.die";

  /**
   * A blood hunter picks Intelligence or Wisdom as their hemocraft modifier on
   * Hunter's Bane. The DDB action data hardcodes Intelligence regardless, so
   * read the choice back off the character instead, defaulting to Intelligence.
   */
  get hemocraftAbility(): "int" | "wis" {
    const ddbData = this.ddbParser?.ddbData;
    if (!ddbData) return "int";

    // DDB spells this with a curly apostrophe ("Hunter’s Bane"); match either
    const featureId = ddbData.character.classes
      .find((klass) => klass.definition.name === "Blood Hunter")
      ?.classFeatures.find((f) => f.definition.name.replace(/[’]/g, "'") === "Hunter's Bane")
      ?.definition.id;
    if (!featureId) return "int";

    // match on the feature id: the data also carries an archived Blood Hunter
    // feature with its own, often contradictory, hemocraft choice
    const choice = (ddbData.character.choices?.class ?? []).find((entry) =>
      entry.componentId === featureId,
    );
    if (!choice) return "int";

    const definition = (ddbData.character.choices?.choiceDefinitions ?? []).find((d) =>
      d.id === `${choice.componentTypeId}-${choice.type}`,
    );
    const option = definition?.options.find((o) => o.id === choice.optionValue);

    return option?.label === "Hemocraft Modifier: Wisdom" ? "wis" : "int";
  }

  /** Roll data reference for the hemocraft modifier. */
  get hemocraftModifier(): string {
    return `@abilities.${this.hemocraftAbility}.mod`;
  }

  /** Save DC of 8 + proficiency + hemocraft modifier. */
  get hemocraftSaveDC(): { calculation: string; formula: string } {
    return {
      calculation: this.hemocraftAbility,
      formula: "",
    };
  }

  /** Formula string for a midi OverTime save against the hemocraft DC. */
  get hemocraftSaveDCFormula(): string {
    return `8 + @prof + ${this.hemocraftModifier}`;
  }

}
