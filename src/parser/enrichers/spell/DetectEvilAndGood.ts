import DDBEnricherData from "../data/DDBEnricherData";

export default class DetectEvilAndGood extends DDBEnricherData {

  get override(): IDDBOverrideData | null {
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
