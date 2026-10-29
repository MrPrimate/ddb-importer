import DDBEnricherData from "../data/DDBEnricherData";

/** Potion of Plumage: Immunity to falling damage for 10 minutes once drunk (dnd5e 6.1 `falling` trait). */
export default class PotionOfPlumage extends DDBEnricherData {

  override get effects(): IDDBEffectHint[] {
    const changes = DDBEnricherData.ChangeHelper.fallingDamageChanges("You have Immunity to falling damage.");
    if (changes.length === 0) return [];
    return [
      {
        name: "Plumage",
        options: {
          transfer: false,
          durationSeconds: 600,
          description: "Immunity to falling damage, and you glide 1 foot horizontally for every 1 foot you descend while falling.",
        },
        changes,
      },
    ];
  }

}
