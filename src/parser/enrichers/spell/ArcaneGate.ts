import DDBEnricherData from "../data/DDBEnricherData";

export default class ArcaneGate extends DDBEnricherData {
  // two 10-foot portal rings standing perpendicular to the ground, so a wall template on the map
  override get activity(): IDDBActivityData {
    return {
      data: {
        target: {
          override: true,
          template: {
            count: "2",
            contiguous: false,
            type: "wall",
            size: "10",
            width: "1",
            height: "10",
            units: "ft",
          },
          affects: { type: "space" },
        },
      },
    };
  }
}
