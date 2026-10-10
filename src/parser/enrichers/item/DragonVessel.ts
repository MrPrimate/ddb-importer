import DDBEnricherData from "../data/DDBEnricherData";
import HoardItem from "./_HoardItem";
import { itemActivity } from "./_ItemActivities";

/**
 * Dragon Vessel (Fizban's): once per dawn, a bonus action fills the empty vessel with a drink or
 * potion. Each stage adds three choices to the ones before it.
 */
export default class DragonVessel extends HoardItem {

  static CONTENTS = [
    ["ale", "olive oil", "a potion of healing", "a potion of climbing"],
    ["mead", "a potion of fire breath", "a potion of healing (greater)"],
    ["wine", "a potion of flying", "a potion of healing (superior)"],
    ["whiskey", "a potion of healing (supreme)", "a potion of dragon's majesty"],
  ];

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const contents = DragonVessel.CONTENTS.slice(0, this.stage + 1).flat();
    return [
      HoardItem.oncePerDawn(itemActivity("Fill the Vessel", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {}, {
        activationOverride: {
          type: "bonus",
          value: 1,
          condition: `The vessel is empty: fill it with ${contents.join(", ")}. A potion loses its magic if not drunk within 24 hours.`,
        },
        // the text's "24 hours" is the potion's shelf life, not a duration
        generateDuration: true,
        durationOverride: { override: true, value: "", units: "inst" },
      })),
    ];
  }

}
