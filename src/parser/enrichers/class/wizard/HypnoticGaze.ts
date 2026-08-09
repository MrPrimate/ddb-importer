import DDBEnricherData from "../../data/DDBEnricherData";

export default class HypnoticGaze extends DDBEnricherData {

  override get override(): IDDBOverrideData {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
