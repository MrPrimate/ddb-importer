import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Gate: the portal can be vertical or horizontal and 5 or 20 feet across; each is its own template.
 */
export default class Gate extends DDBEnricherData {

  /**
   * Speaking a creature's name pulls it through the portal. The dnd5e SRD pack offers that on the
   * 2014 spell as an open summon with one blank challenge-rating profile; the 2024 pack has none.
   */
  static SUMMON_CREATURE: IDDBAdditionalActivity = {
    init: {
      name: "Summon Creature",
      type: DDBEnricherData.ACTIVITY_TYPES.SUMMON,
    },
    build: {
      generateSummon: true,
      noSpellslot: true,
    },
    overrides: {
      noTemplate: true,
      data: {
        summon: {
          mode: "cr",
          prompt: true,
        },
        profiles: [
          { name: "", count: "1" },
        ],
      },
    },
  };

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
      Gate.SUMMON_CREATURE,
    ];
  }

}
