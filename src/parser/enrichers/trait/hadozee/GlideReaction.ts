import DDBEnricherData from "../../data/DDBEnricherData";

export default class GlideReaction extends DDBEnricherData {

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
