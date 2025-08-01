/* eslint-disable class-methods-use-this */
import TomeOf from "./TomeOf.mjs";

export default class TomeOfClearThought extends TomeOf {


  get effectData() {
    return {
      name: "Tome of Clear Thought",
      ability: "int",
    };
  }


}
