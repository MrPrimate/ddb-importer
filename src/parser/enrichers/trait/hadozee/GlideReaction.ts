import DDBEnricherData from "../../data/DDBEnricherData";

export default class GlideReaction extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      midiManualReaction: true,
    };
  }

}
