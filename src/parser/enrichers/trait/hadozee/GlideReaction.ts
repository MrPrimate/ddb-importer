import DDBEnricherData from "../../data/DDBEnricherData";

export default class GlideReaction extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
