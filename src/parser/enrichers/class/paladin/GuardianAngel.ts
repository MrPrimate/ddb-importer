import DDBEnricherData from "../../data/DDBEnricherData";
import { regionPlacer } from "../../data/RegionBuilders";

/**
 * DDB's two actions (becoming the Guardian Angel, and restoring the use with a spell slot) are
 * kept. Walking Bastion is added: a 100-foot emanation for the minute the feature lasts, inside
 * which chosen creatures can use the paladin's AC. The effect adds the paladin's AC as one more
 * AC formula on the ally, resolved against the paladin when the region applies it, and dnd5e
 * takes the highest formula, so an ally with better AC keeps its own. "Creatures of your choice"
 * becomes allies.
 */
export default class GuardianAngel extends DDBEnricherData {

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      regionPlacer("Walking Bastion", {
        template: { type: "radius", size: "100" },
        affects: "ally",
        activationType: "special",
        activationCondition: "While you are the Guardian Angel",
        duration: { value: "1", units: "minute" },
        behaviors: [
          DDBEnricherData.BehaviorHelper.applyEffect({ effects: "Walking Bastion" }),
        ],
      }),
    ];
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Walking Bastion",
        standalone: true,
        originReplacement: true,
        changes: [DDBEnricherData.ChangeHelper.acFormulaAddChange("@attributes.ac.value")],
        // held only while inside: the region removes it on exit, so it carries no expiry of its own
        options: { expiry: null, durationSeconds: null, description: "Can use the paladin's Armor Class while in the emanation." },
      },
    ];
  }

}
