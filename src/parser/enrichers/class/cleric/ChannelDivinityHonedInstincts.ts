import Generic from "../Generic";

/**
 * Hunt Domain: after this Channel Divinity, the next weapon hit on the target within a minute deals
 * the attack's maximum damage instead of rolling. A macro activity works out that maximum from a
 * recent weapon attack.
 */
export default class ChannelDivinityHonedInstincts extends Generic {

  get addToDefaultAdditionalActivities(): boolean {
    return true;
  }

  get additionalActivities(): IDDBAdditionalActivity[] {
    if (this.isAction) return [];
    return [
      Generic.maximumDamageActivity({
        condition: "The next time you hit the target with a weapon attack within the next minute",
        parameters: {
          title: "Honed Instincts",
          sources: [{ type: "weapon" }],
          activityTypes: ["attack"],
        },
      }),
    ];
  }

}
