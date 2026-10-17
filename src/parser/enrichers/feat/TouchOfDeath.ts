import DDBEnricherData from "../data/DDBEnricherData";

/**
 * Dark Gift. DDB sends Pull of the Grave as a death-saving-throws disadvantage modifier; the named
 * effect here replaces the one EffectGenerator builds from it. The Chill Touch grant comes from the
 * description's spell grant.
 */
export default class TouchOfDeath extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Pull of the Grave",
        options: {
          transfer: true,
          durationSeconds: null,
          expiry: null,
          description: "You have Disadvantage on Death Saving Throws.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.disadvantageDeathSaveChange(),
        ],
      },
    ];
  }

}
