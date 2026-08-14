import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Maneuvers is the Gunslinger's container feature for the maneuvers known. DDB leaves it out
 * of klass.definition.classFeatures, so it only parses because of FORCE_DERIVED_FEATURES in
 * config/dictionary/parsing/features.ts. The known maneuvers are choice options on it, which
 * supply the rules text, and also arrive as "Maneuver: X" actions under actions.class; each
 * has its own enricher (ManeuverBiteTheBullet etc.) and is pulled on here as an activity that
 * consumes a Risk Die from the Risk feature.
 */
export default class Maneuvers extends DDBEnricherData {

  static MANEUVER_ACTIONS = [
    "Bite the Bullet",
    "Blindfire",
    "Dodge Roll",
    "Grazing Shot",
    "Maverick Spirit",
    "Skin of Your Teeth",
  ];

  // the options carry the maneuver rules text, they should not become their own features
  override get noChoiceBuild(): boolean {
    return true;
  }

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // each pulled-on maneuver action spends a Risk Die via the description parse
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return Maneuvers.MANEUVER_ACTIONS
      .filter((name) => this.hasAction({ name: `Maneuver: ${name}`, type: "class" }))
      .map((name) => {
        return {
          action: {
            name: `Maneuver: ${name}`,
            type: "class" as const,
            rename: [name],
          },
        };
      });
  }

}
