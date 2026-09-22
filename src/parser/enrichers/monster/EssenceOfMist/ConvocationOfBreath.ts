import DDBEnricherData from "../../data/DDBEnricherData";
import { areaPlacer } from "../../data/AreaBuilders";

const ACTIVATE = "Toxic Breath: Activate";

/**
 * DDB sets the two effects this feature grants as bold-only paragraphs under it, so they are
 * options of one feature rather than features of their own, and the parser builds a save for
 * each. Toxic Breath is an aura: 10 feet in every direction for a minute, poisoning a creature
 * that starts its turn inside. The placer draws the emanation and spends one of the two daily
 * uses, as Hide in Breath does; the parsed save becomes the free roll used by hand for each
 * creature that starts its turn inside, so repeating it never spends a second use. Poisoned
 * belongs to Toxic Breath alone and lasts to the end of the creature's next turn, not the minute
 * the parser reads off the aura.
 */
export default class ConvocationOfBreath extends DDBEnricherData {

  override get activity(): IDDBActivityData {
    const name = this.ddbEnricher.originalActivity?.name ?? "";
    if (name === "Hide in Breath") return { noeffect: true };
    if (name !== "Toxic Breath") return {};
    return {
      targetType: "creature",
      targetCount: 1,
      activationType: "special",
      activationCondition: "A creature that starts its turn in the breath; the use is spent by Toxic Breath: Activate",
      noConsumeTargets: true,
      noTemplate: true,
      data: {
        range: { override: true, value: null, units: "spec" },
        duration: { override: true, value: "", units: "inst" },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      areaPlacer(ACTIVATE, {
        template: { type: "radius", size: "10", count: "1" },
        activationCondition: "Lightly obscured; ends early in a moderate or stronger wind. Creatures inside save with Toxic Breath at the start of their turns",
        duration: { value: "1", units: "minute" },
        consume: true,
      }),
    ];
  }

  // the placer sits beside the parsed saves, not instead of them
  override get keepParsedActivities(): boolean {
    return true;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Poisoned",
        activityMatch: "Toxic Breath",
        statuses: ["Poisoned"],
        options: { transfer: false, expiry: "targetEnd", durationSeconds: 6, durationRounds: 1 },
      },
    ];
  }

}
