/* eslint-disable class-methods-use-this */
import TomeOf from "./TomeOf.mjs";

export default class TomeOfUnderstanding extends TomeOf {


  get effectData() {
    return {
      name: "Tome of Understanding",
      ability: "wis",
    };
  }


}
