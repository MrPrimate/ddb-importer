import DDBEnricherData from "../data/DDBEnricherData";

export default class FeatherFall extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  get override() {
    return {
      midiManualReaction: true,
    };
  }

}
