import DDBEnricherData from "../data/DDBEnricherData";
import HoardItem from "./_HoardItem";
import { itemActivity } from "./_ItemActivities";

/**
 * Scaled Ornament (Fizban's). The stage modifiers come through the parser: +1 AC and the charmed
 * and frightened immunities from Stirring, and Ascendant's flight at walking speed (Slumbering's
 * advantage on saves against charm and fear has no native home and is left to the table). From
 * Wakened, once per dawn, a reaction turns damage of the hoard dragon's breath type into healing.
 */
export default class ScaledOrnament extends HoardItem {

  override get effects(): IDDBEffectHint[] {
    if (this.stage < 3) return [];
    return [
      {
        // the parser's flight modifier sets the fly speed but cannot say it hovers
        name: "Spectral Dragon Wings",
        changes: [
          DDBEnricherData.ChangeHelper.overrideChange("true", 20, "system.attributes.movement.hover"),
        ],
        options: { transfer: true },
      },
    ];
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.stage < 2) return [];
    return [
      HoardItem.oncePerDawn(itemActivity("Absorb Breath", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: {
          type: "reaction",
          value: 1,
          condition: "You would take damage of the type dealt by the breath of the dragon whose hoard woke the ornament: take none and regain that many hit points",
        },
      })),
    ];
  }

}
