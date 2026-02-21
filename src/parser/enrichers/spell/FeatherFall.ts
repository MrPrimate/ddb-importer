import DDBEnricherData from "../data/DDBEnricherData";

export default class FeatherFall extends DDBEnricherData {

  get type() {
    return "utility";
  }

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
