import DDBEnricherData from "../data/DDBEnricherData";

export default class Passwall extends DDBEnricherData {

  // the opening is up to 5 feet wide and 20 feet deep
  override get activity(): IDDBActivityData {
    return {
      data: {
        target: {
          override: true,
          template: { count: "1", contiguous: false, type: "line", size: "20", width: "5", units: "ft" },
          affects: { type: "space" },
        },
      },
    };
  }

}
