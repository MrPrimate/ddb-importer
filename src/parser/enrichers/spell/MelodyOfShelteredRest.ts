import DDBEnricherData from "../data/DDBEnricherData";
import { castPlacer } from "./_SpellRegions";

/**
 * The 30-foot emanation follows the singer and gives every creature inside, the singer included,
 * Advantage on Perception checks. Not being surprised has no active effect form and stays in the
 * effect's description.
 */
export default class MelodyOfShelteredRest extends DDBEnricherData {

  override get type(): IDDBActivityType | null {
    return DDBEnricherData.ACTIVITY_TYPES.UTILITY;
  }

  override get activity(): IDDBActivityData {
    return castPlacer([
      DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Melody of Sheltered Rest" }),
    ]);
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Melody of Sheltered Rest",
        standalone: true,
        changes: [DDBEnricherData.ChangeHelper.advantageSkillChange("prc")],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Advantage on Perception checks and can't be surprised while in the aura." },
      },
    ];
  }

}
