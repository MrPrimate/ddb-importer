import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacer } from "../../data/AreaBuilders";

/**
 * DDB sets the three results of this d6 table as bold-only paragraphs under it, so they are
 * options of one feature. The parser builds one damage activity from Retaliating Light's dice.
 * Growth rolls nothing, so it left no activity: until the start of the githzerai's next turn the
 * ground within 15 feet of it is difficult terrain for other creatures. Every result spends the
 * Recharge.
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
      areaPlacer("3-4: Growth", {
        template: { type: "radius", size: "15" },
        activationType: "bonus",
        activationCondition: "Difficult terrain for other creatures until the start of the githzerai's next turn",
        duration: { value: "1", units: "round" },
        consume: true,
      }),
    ];
  }

  // the placer sits beside the parsed damage, not instead of it
  override get keepParsedActivities(): boolean {
    return true;
  }

}
