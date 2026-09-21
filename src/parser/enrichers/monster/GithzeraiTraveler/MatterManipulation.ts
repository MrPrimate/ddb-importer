import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

/**
 * DDB sets the three results of this d6 table as bold-only paragraphs under it, so they are
 * options of one feature. The parser builds one damage activity from Retaliating Light's dice.
 * Growth rolls nothing, so it left no activity: until the start of the githzerai's next turn the
 * ground within 15 feet of it is difficult terrain for other creatures. Difficult terrain is
 * ignored by disposition and never by one token, so the githzerai is hindered by its own
 * flowers unless the behavior is set to spare its side. Every result spends the Recharge.
 */
export default class MatterManipulation extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    return {
      name: "5-6: Retaliating Light",
      activationCondition: "A creature within 5 feet hits the githzerai with a melee attack before the start of its next turn",
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("3-4: Growth", {
        template: { type: "radius", size: "15" },
        activationType: "bonus",
        duration: { value: "1", units: "round" },
        consume: true,
        behaviors: [
          DDBEnricherData.BehaviorHelper.difficultTerrain({ types: ["plants"] }),
        ],
      }),
    ];
  }

  // the placer sits beside the parsed damage, not instead of it
  override get keepParsedActivities(): boolean {
    return true;
  }

}
