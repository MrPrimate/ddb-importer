import TomeOf from "./TomeOf";

export default class TomeOfUnderstanding extends TomeOf {


  get effectData(): TomeOf["effectData"] {
    return {
      name: "Tome of Understanding",
      ability: "wis",
    };
  }


}
