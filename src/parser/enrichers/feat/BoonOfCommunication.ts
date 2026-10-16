import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Boon of Communication: 120-foot telepathy. DDB carries it as prose, not a language modifier, so
 * the transfer effect is the only way it reaches the sheet.
 */
export default class BoonOfCommunication extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Mental Communication",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("120", 20, "system.traits.languages.communication.telepathy.value"),
        ],
      },
    ];
  }

}
