import DDBEnricherData from "../../data/DDBEnricherData";

export default class HypnoticGaze extends DDBEnricherData {

  get override() {
    return {
      uses: {
        spent: null,
        max: "",
        recovery: [],
      },
    };
  }

}
