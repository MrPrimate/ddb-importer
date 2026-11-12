import Generic from "../Generic";

/**
 * Tempest Domain: spend Channel Divinity to deal maximum lightning or thunder damage instead of
 * rolling. DDB's action keeps the Channel Divinity use; a macro activity works out the maximum of a
 * recent lightning or thunder roll from any source, since a feature activity cannot see that roll.
 */
export default class ChannelDivinityDestructiveWrath extends Generic {

  get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      Generic.maximumDamageActivity({
        condition: "When you roll Lightning or Thunder damage",
        parameters: {
          title: "Destructive Wrath",
          sources: [{ type: "any" }],
          damageTypes: ["lightning", "thunder"],
        },
      }),
    ];
  }

}
