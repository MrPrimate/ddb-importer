import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Diamond Staff: Dazzling Light spends a charge and a command word to shed bright light in a 40
 * foot radius and dim light for another 40 feet, for 1 minute or until the staff is told to stop.
 * It is a self-targeted utility applying a light effect; the parsed attack and Stunning Hit save
 * stay beside it.
 */
export default class DiamondStaff extends DDBEnricherData {

  static LIGHT = "Dazzling Light";

  override get keepParsedActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      itemProperty(DiamondStaff.LIGHT, DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "action",
        condition: "While holding the staff, speak the command word; another command word ends it early",
        selfTarget: true,
        charges: "1",
        noeffect: false,
        data: { duration: { value: "1", units: "minute" } },
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Diamond Staff: Dazzling Light",
        activityMatch: DiamondStaff.LIGHT,
        options: {
          transfer: false,
          durationSeconds: 60,
          // lasts the minute; the text's turn wording belongs to Stunning Hit
          expiry: null,
          description: "The staff emits Bright Light in a 40-foot radius and Dim Light for an additional 40 feet for 1 minute, or until you use a command word to deactivate it.",
        },
        tokenChanges: [
          DDBEnricherData.ChangeHelper.upgradeChange(40, 20, "token.light.bright"),
          DDBEnricherData.ChangeHelper.upgradeChange(80, 20, "token.light.dim"),
        ],
      },
    ];
  }

}
