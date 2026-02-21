import DDBEnricherData from "../data/DDBEnricherData";

export default class ConcussionGrenade extends DDBEnricherData {

  get activity() {
    return {
      data: {
        range: {
          value: "60",
          unit: "ft",
        },
      },
    };
  }

}
