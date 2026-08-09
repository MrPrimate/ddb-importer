import TomeOf from "./TomeOf";

export default class TomeOfClearThought extends TomeOf {


  get effectData(): TomeOf["effectData"] {
    return {
      name: "Tome of Clear Thought",
      ability: "int",
    };
  }


}
