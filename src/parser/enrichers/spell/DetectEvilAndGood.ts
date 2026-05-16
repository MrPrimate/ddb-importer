import DDBEnricherData from "../data/DDBEnricherData";

export default class DetectEvilAndGood extends DDBEnricherData {

  get override(): IDDBOverrideData {
    if (this.is2014) return null;
    return {
      data: {
        system: {
          target: {
            template: {
              type: "radius",
            },
          },
        },
      },
    };
  }
}
