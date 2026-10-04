import DDBEnricherData from "../data/DDBEnricherData";
import HoardItem from "./_HoardItem";
import { itemActivity } from "./_ItemActivities";

/**
 * Scaled Ornament (Fizban's). The stage modifiers (charm and fear save advantage, +1 AC and the
 * immunities from Stirring) come through the parser. From Wakened, once per dawn, a reaction turns
 * damage of the hoard dragon's breath type into healing; Ascendant flies at walking speed and hovers.
 */
export default class ScaledOrnament extends HoardItem {

  // the parser's Ascendant flight effect is its only effect and leaves out the hover
  override get clearAutoEffects(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.stage < 3) return [];
    return [
      {
        name: "Spectral Dragon Wings",
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("@attributes.movement.speeds.walk", 20, "system.attributes.movement.speeds.fly"),
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
