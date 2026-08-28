import DDBEnricherData from "../../data/DDBEnricherData";

/**
 * Circle of Flowers 3rd level. DDB ships one feature per flower
 * ("Floral Form: Aconite") and carries some of the benefits as modifiers:
 * Poison resistance and the innate swim speed generate effects, while the
 * restriction-gated healing bonus and the "Advantage to resist Poisoned"
 * modifiers generate nothing.
 *
 * The always-prepared spell of each group and the Bonus Action Dash (which DDB
 * parses as its own activity) are left to the parser.
 */
export default class FloralForm extends DDBEnricherData {

  static HEALING_FLOWERS = ["Amaranth", "Apple Tree", "Jade Vine", "Magnolia"];

  static POISON_SAVE_FLOWERS = ["Azalea", "Hydrangea", "Peony", "Succulent"];

  static SLEEPLESS_FLOWERS = ["Cherry Blossom", "Dandelion", "Heliconia", "Wisteria"];

  static SWIM_FLOWERS = ["Lamium", "Water Lily"];

  /**
   * The effects are generated during the parent build, before the document is
   * renamed for the chosen option, so the flower comes from the chosen option
   * label with the document name as a fallback.
   */
  _flower(flowers: string[]): string | null {
    const labels = (this.ddbParser._chosen ?? []).map((choice) => choice.label ?? "");
    return flowers.find((flower) =>
      labels.some((label) => label.endsWith(flower))
      || `${this.data.name}`.endsWith(flower)) ?? null;
  }

  override get useDefaultAdditionalActivities(): boolean {
    return true;
  }

  override get effects(): IDDBEffectHint[] {
    const healingFlower = this._flower(FloralForm.HEALING_FLOWERS);
    if (healingFlower) {
      return [
        {
          name: `Floral Form: ${healingFlower}`,
          options: {
            transfer: true,
            description: "Whenever you use a spell of 1st level or higher to restore Hit Points to a creature, it regains 1d4 additional Hit Points. The bonus applies to all of your healing, so remove it by hand when you heal with a cantrip or with a feature that is not a spell.",
          },
          changes: [
            DDBEnricherData.ChangeHelper.healingBonusChange("1d4"),
          ],
        },
      ];
    }
    const poisonSaveFlower = this._flower(FloralForm.POISON_SAVE_FLOWERS);
    if (poisonSaveFlower) {
      return [
        {
          name: `Floral Form: ${poisonSaveFlower}`,
          options: {
            transfer: true,
            description: "You have Advantage on saving throws to resist being Poisoned.",
          },
          ac5eChanges: [
            DDBEnricherData.ChangeHelper.ac5eChange(
              "riderStatuses.poisoned",
              20,
              "flags.automated-conditions-5e.save.advantage",
            ),
          ],
        },
      ];
    }
    const sleeplessFlower = this._flower(FloralForm.SLEEPLESS_FLOWERS);
    if (sleeplessFlower) {
      return [
        {
          name: `Floral Form: ${sleeplessFlower}`,
          options: {
            transfer: true,
            // dnd5e has no magical sleep condition to be immune to, so this is a reminder
            description: "Magic can't put you to sleep.",
          },
        },
      ];
    }
    const swimFlower = this._flower(FloralForm.SWIM_FLOWERS);
    if (swimFlower) {
      return [
        {
          noCreate: true,
          name: `Floral Form: ${swimFlower}`,
          options: {
            description: "You have a swim speed equal to your base walking speed.",
          },
          changes: [
            DDBEnricherData.ChangeHelper.upgradeChange(
              "@attributes.movement.speeds.walk",
              20,
              "system.attributes.movement.speeds.swim",
            ),
          ],
        },
      ];
    }
    return [];
  }

}
