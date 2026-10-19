import DDBDataUtils from "../../lib/DDBDataUtils";
import DDBEnricherData from "../data/DDBEnricherData";
import Generic from "./Generic";

/**
 * The Greater Mark feats upgrade the parent mark's intuition die and carry DDB actions of their
 * own (Subdue Animal, Improved Warding, Mark of Inspiration), so the Generic action-to-activity
 * build has to stay on top of the die effect.
 */
export default class _GreaterMarkOf extends Generic {

  override get effects(): IDDBEffectHint[] {
    const parentName = this.name.replace("Greater ", "").trim();
    const id = DDBDataUtils.classIdentifierName(parentName);
    const effects: IDDBEffectHint[] = [
      {
        options: {
          transfer: true,
          durationSeconds: undefined,
          durationRounds: undefined,
        },
        data: {
          duration: {
            value: null,
            expiry: null,
            expired: undefined,
          },
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("6", 20, `system.scale.${id}.die.faces`),
        ],
      },
    ];
    if (parentName === "Mark of Handling") {
      // the text-built Frightened effect (until the start of your next turn) is Subdue Animal's
      // alone, not every benefit's: merge into it rather than adding a second one
      effects.push({
        name: "Subdue Animal: Frightened",
        noCreate: true,
        activityMatch: "Subdue Animal",
      });
    }
    return effects;
  }

}
