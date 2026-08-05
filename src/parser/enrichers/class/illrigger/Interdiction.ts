import DDBEnricherData from "../../data/DDBEnricherData";

export default class Interdiction extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      // DDB carries a bogus long-rest usage limit; the actual limit is once
      // per turn, which is not a tracked resource
      data: {
        system: {
          uses: {
            spent: 0,
            max: "",
            recovery: [],
          },
        },
      },
    };
  }

}
