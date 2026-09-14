import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Gate: the portal can be vertical or horizontal and 5 or 20 feet across; each is its own template.
 */
export default class Gate extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "Small Vertical Portal",
      data: {
        target: {
          template: { type: "wall", size: "5", width: "1", height: "", units: "ft", count: "" },
        },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      {
        duplicate: true,
        id: "gateLargeVert001",
        overrides: {
          name: "Large Vertical Portal",
          data: {
            target: {
              template: { type: "wall", size: "20", width: "1", height: "", units: "ft", count: "" },
            },
          },
        },
      },
      {
        duplicate: true,
        id: "gateSmallHoriz01",
        overrides: {
          name: "Small Horizontal Portal",
          data: {
            target: {
              template: { type: "circle", size: "5", width: "1", height: "", units: "ft", count: "" },
            },
          },
        },
      },
      {
        duplicate: true,
        id: "gateLargeHoriz01",
        overrides: {
          name: "Large Horizontal Portal",
          data: {
            target: {
              template: { type: "circle", size: "20", width: "1", height: "", units: "ft", count: "" },
            },
          },
        },
      },
    ];
  }

}
