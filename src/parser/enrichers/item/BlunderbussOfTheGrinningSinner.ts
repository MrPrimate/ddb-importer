import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * Blunderbuss of the Grinning Sinner: +1 Rare, +2 Very Rare, +3 Legendary, both saves at DC 16 +
 * the bonus, baked per record.
 *
 * - Jinxshot (all): one attack of the Attack action becomes a 30 foot cone Dexterity save for 2d4
 *   necrotic (Rare) or 3d6 (Very Rare+), half on a success. DDB ships the dice as a restricted
 *   modifier, which the parser made an attack roll.
 * - Sinner's Jinx (Very Rare+): once per turn on damage, a Charisma save or cursed for a minute,
 *   subtracting 1d4 from D20 Tests.
 * - Luck Taker (Legendary): a reaction when a cursed creature rolls a 19 or 20.
 *
 * The "Varies" record is built at the Rare tier.
 */
export default class BlunderbussOfTheGrinningSinner extends DDBEnricherData {

  static JINX = "Sinner's Jinx";

  get bonuses(): number[] {
    const modifiers = (foundry.utils.getProperty(this.ddbParser.ddbDefinition, "grantedModifiers") as IDDBModifier[] | undefined) ?? [];
    const values = modifiers
      .filter((mod) => mod.type === "bonus" && mod.subType === "magic" && Number.isInteger(mod.value))
      .map((mod) => Number(mod.value));
    return [...new Set(values)].sort((a, b) => a - b);
  }

  get bonus(): number {
    return this.bonuses[0] ?? 1;
  }

  get dc(): string {
    return `${16 + this.bonus}`;
  }

  override get clearAutoEffects(): boolean {
    return true;
  }

  override get addAutoAdditionalActivities(): boolean {
    return false;
  }

  override get activity(): IDDBActivityData {
    return { noeffect: true };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [
      itemProperty("Jinxshot", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: this.dc },
        damageParts: [this.bonus >= 2
          ? DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["necrotic"] })
          : DDBEnricherData.basicDamagePart({ number: 2, denomination: 4, types: ["necrotic"] })],
        onSave: "half",
        condition: "Replace one attack of the Attack action on your turn",
        template: { type: "cone", size: "30" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
    if (this.bonus >= 2) {
      activities.push(itemProperty(BlunderbussOfTheGrinningSinner.JINX, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["cha"], formula: this.dc },
        condition: "Once during your turn when you damage a creature with the blunderbuss; ends if used on another creature",
        range: { value: "60", units: "ft" },
      }));
    }
    if (this.bonus >= 3) {
      activities.push(itemProperty("Luck Taker", DDBEnricherData.ACTIVITY_TYPES.UTILITY, {
        activationType: "reaction",
        condition: "A creature cursed by this weapon within 60 feet rolls a 19 or 20 on a D20 Test; your next D20 Test within 1 minute uses that number",
        range: { value: "60", units: "ft" },
        noeffect: true,
      }));
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    if (this.bonus < 2) return [];
    return [
      {
        name: "Sinner's Jinx",
        activityMatch: BlunderbussOfTheGrinningSinner.JINX,
        options: {
          transfer: false,
          durationSeconds: 60,
          description: "Cursed: subtract 1d4 from the total of every D20 Test.",
        },
        changes: [
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.attack.mwak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.attack.rwak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.attack.msak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.attack.rsak.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.ability.check.bonus"),
          DDBEnricherData.ChangeHelper.signedAddChange("-1d4", 20, "system.rolls.ability.save.bonus"),
        ],
      },
    ];
  }

  override get override(): IDDBOverrideData {
    if (this.bonuses.length < 2) return {};
    return {
      descriptionSuffix: `
<section class="secret ddbSecret" id="secret-ddbGrinningSinner">
<p><strong>Implementation Details</strong></p>
<p>This is the "Varies" record, so it is built at the Rare tier (+${this.bonus}, Jinxshot DC ${this.dc}, 2d4). Import the Very Rare or Legendary version for Sinner's Jinx and Luck Taker.</p>
</section>`,
    };
  }

}
