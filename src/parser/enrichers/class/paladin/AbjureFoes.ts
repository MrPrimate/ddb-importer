import DDBEnricherData from "../../data/DDBEnricherData";

export default class AbjureFoes extends DDBEnricherData {

  get type() {
    return DDBEnricherData.ACTIVITY_TYPES.NONE;
  }

  // the DDB action's save builds its own Frightened effect; the copy read from the text stays unlinked
  get clearAutoStatusEffect(): boolean {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    // the World of Warcraft Death Knight's Channel Divinity is renamed Channel Runic Power, and so is its action
    const pool = this.hasClassFeature({ featureName: "Channel Runic Power" }) ? "Channel Runic Power" : "Channel Divinity";
    return [
      {
        action: { name: `${pool}: Abjure Foes`, type: "class", rename: ["Save vs Frightened"] },
        overrides: { addItemConsume: true, itemConsumeTargetName: pool },
      },
    ];
  }

}
