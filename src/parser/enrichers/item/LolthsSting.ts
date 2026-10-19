import DDBEnricherData from "../data/DDBEnricherData";

/**
 * A save failed by 5 or more also leaves the creature Unconscious while Poisoned this way. The
 * auto status effect is replaced so both effects link to the save: linking only fills activities
 * that carry no effect yet, and the auto status is linked first.
 */
export default class LolthsSting extends DDBEnricherData {

  override get clearAutoStatusEffect(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    return [
      {
        name: "Lolth's Sting: Poisoned",
        statuses: ["Poisoned"],
        options: { transfer: false, durationSeconds: 3600 },
      },
      {
        name: "Lolth's Sting: Unconscious (Failed by 5 or More)",
        statuses: ["Unconscious"],
        daeSpecialDurations: ["isDamaged"],
        options: {
          transfer: false,
          durationSeconds: 3600,
          description: "Ends when the Poisoned condition ends, when the creature takes damage, or when another creature takes an action to shake it awake.",
        },
      },
    ];
  }

}
