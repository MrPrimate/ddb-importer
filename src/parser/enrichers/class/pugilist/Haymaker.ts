import Generic from "../Generic";

/**
 * Spend a Moxie Point on an Unarmed Strike or Pugilist weapon attack; on a hit it deals maximum
 * damage. DDB's action keeps the Moxie cost; a macro activity works out the maximum from the recent
 * weapon attack.
 */
export default class Haymaker extends Generic {

  override get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      Generic.maximumDamageActivity({
        condition: "On a hit with a Haymaker attack",
        parameters: {
          title: "Haymaker",
          sources: [{ type: "weapon" }],
          activityTypes: ["attack"],
        },
      }),
    ];
  }

}
