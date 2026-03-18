import DDBEnricherData from "../data/DDBEnricherData";

export default class WordOfRadiance extends DDBEnricherData {

  get override(): IDDBOverrideData {
    return {
      data: {
        system: {
          target: {
            affects: {
              choice: true,
            },
            template: {
              type: "radius",
            },
          },
        },
      },
    };
  }
}
