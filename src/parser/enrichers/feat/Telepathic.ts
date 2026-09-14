import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Telepathic: 60-foot telepathy. DDB carries it as prose, not a language modifier, so the
 * official transfer effect is the only way it reaches the sheet. The 2014 Detect Thoughts cast
 * is a spell grant handled by the spell parser.
 */
export default class Telepathic extends DDBEnricherData {

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Telepathic Utterance",
        options: {
          transfer: true,
        },
        changes: [
          DDBEnricherData.ChangeHelper.upgradeChange("60", 20, "system.traits.languages.communication.telepathy.value"),
        ],
      },
    ];
  }

}
