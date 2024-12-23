/* eslint-disable class-methods-use-this */
import Maneuver from "./Maneuver.mjs";

export default class ManeuverBrace extends Maneuver {

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
