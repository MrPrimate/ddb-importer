import Maneuver from "./Maneuver";

/**
 * Mortal Strike (World of Warcraft Battle Master maneuver): on a hit, add the Superiority Die to the
 * damage; the target can't regain Hit Points until the end of your next turn.
 */
export default class ManeuverMortalStrike extends Maneuver {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mortal Strike",
        options: {
          transfer: false,
          expiry: "sourceEnd",
          description: "You can't regain Hit Points.",
        },
      },
    ];
  }

}
