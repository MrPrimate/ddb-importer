import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Risk is the Gunslinger's resource pool (Risk Dice, a scaling dice pool
 * recovered on a short or long rest). The known maneuvers arrive as
 * "Maneuver: X" actions under actions.class (the Maneuvers container feature
 * is not in the definition feature list, so it never parses as its own
 * document). Each maneuver has its own enricher (ManeuverBiteTheBullet etc.);
 * their activities are pulled onto this feature, consuming one Risk Die each.
 */
export default class Risk extends DDBEnricherData {

  static MANEUVER_ACTIONS = [
    "Bite the Bullet",
    "Blindfire",
    "Dodge Roll",
    "Grazing Shot",
    "Maverick Spirit",
    "Skin of Your Teeth",
  ];

  get additionalActivities(): IDDBAdditionalActivity[] {
    return Risk.MANEUVER_ACTIONS
      .filter((name) => this.hasAction({ name: `Maneuver: ${name}`, type: "class" }))
      .map((name) => {
        return {
          action: {
            name: `Maneuver: ${name}`,
            type: "class" as const,
            rename: [name],
          },
          overrides: {
            addItemConsume: true,
          },
        };
      });
  }

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          uses: {
            spent: 0,
            max: "@scale.gunslinger.risk.number",
            recovery: [{ period: "sr", type: "recoverAll" }],
          },
        },
      },
    };
  }

}
