/* eslint-disable class-methods-use-this */
import TomeOf from "./TomeOf.mjs";

export default class TomeOfLeadershipAndInfluence extends TomeOf {

  get effectData() {
    return {
      name: "Tome of Leadership and Influence",
      ability: "cha",
    };
  }

}
