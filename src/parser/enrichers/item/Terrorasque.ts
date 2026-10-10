import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";
import WeaponProperties from "./_WeaponProperties";
import { itemCheck, itemProperty, itemUses, textDC } from "./_ItemActivities";

/**
 * Terrorasque, one record per rarity and weapon (Rare: +1, 5 charges, 1d4 + 1 at dawn, DC 15, four
 * times the dice; Very Rare: +2, 7 charges, 1d6 + 1, DC 16, five times, plus Tar Strike), all read
 * from the record's text.
 * - Ferocious Blow: an action and a charge for one attack rolling the weapon's dice several times
 *   over; a miss leaves you prone with 0 speed until the start of your next turn.
 * - Terrorise: a bonus action (or part of the one that starts a Rage), each hostile creature within
 *   60 feet makes a Wisdom save or is frightened for 1 minute, repeating the save at the end of its
 *   turns; then not again for an hour. The parser built no save for it, so its Frightened status
 *   landed on the weapon attack.
 * - Tar Strike (Very Rare): an action and a charge for one attack that also restrains for 1 minute,
 *   ended by a Strength check.
 */
export default class Terrorasque extends WeaponProperties {

  static TERRORISE = "Terrorise";

  static TAR_STRIKE = "Tar Strike";

  get charges(): { max: string; formula: string } | null {
    const match = (/has (\d+) charges and regains (\d+d\d+ \+ \d+) charges daily at dawn/i).exec(this.text);
    return match ? { max: match[1], formula: match[2] } : null;
  }

  /** The Very Rare records; the "Varies" parent only mentions Tar Strike in its variant note. */
  get hasTarStrike(): boolean {
    return (/Tar Strike\. As an action/i).test(this.text) && !(/Very rare variant/i).test(this.text);
  }

  get diceMultiplier(): number {
    const match = (/roll (four|five) times as many damage dice/i).exec(this.text);
    return match ? (match[1].toLowerCase() === "five" ? 5 : 4) : 4;
  }

  /** The weapon's damage dice, multiplied for Ferocious Blow; null on the "Varies" parent. */
  get ferociousDamage(): I5eDamagePart | null {
    const parser = this.ddbParser as DDBItem | undefined;
    const damage = parser?.ddbDefinition?.damage;
    const type = parser?.ddbDefinition?.damageType?.toLowerCase();
    if (!damage?.diceCount || !damage.diceValue || !type) return null;
    const magicalBonus = Number(foundry.utils.getProperty(parser?.data ?? {}, "system.magicalBonus")) || 0;
    return DDBEnricherData.basicDamagePart({
      number: damage.diceCount * this.diceMultiplier,
      denomination: damage.diceValue,
      // the weapon's magical bonus rides only its base damage, so this part adds its own
      bonus: magicalBonus > 0 ? `@mod + ${magicalBonus}` : "@mod",
      types: [type],
    });
  }

  attack(name: string, condition: string, parts: I5eDamagePart[] | null, noeffect = true): IDDBAdditionalActivity {
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.ATTACK, id: utils.namedIDStub(name, { prefix: "ddbItem" }) },
      build: {
        generateAttack: true,
        generateDamage: true,
        generateActivation: true,
        generateConsumption: false,
        includeBaseDamage: parts === null,
        activationOverride: { type: "action", value: 1, condition },
        noeffect,
      },
      overrides: {
        addItemConsume: true,
        itemConsumeValue: "1",
        noeffect,
        data: { damage: parts === null ? { includeBase: true, parts: [] } : { includeBase: false, parts } },
      },
    };
  }

  override get additionalActivities(): IDDBAdditionalActivity[] {
    const activities: IDDBAdditionalActivity[] = [];
    const ferocious = this.ferociousDamage;
    if (ferocious) {
      activities.push(this.attack(
        "Ferocious Blow",
        `Expend 1 charge: ${this.diceMultiplier} times the weapon's damage dice on a hit; on a miss you fall prone and your speed is 0 until the start of your next turn`,
        [ferocious],
      ));
    }
    activities.push(itemProperty(Terrorasque.TERRORISE, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
      save: { ability: ["wis"], formula: textDC(this.text, /DC (\d+) Wisdom saving throw/i, "15") },
      activationType: "bonus",
      condition: "Or as part of the bonus action that starts a Rage: each hostile creature within 60 feet that can hear you. Not again for 1 hour",
      template: { type: "radius", size: "60" },
      range: { value: null, units: "self" },
      // the hour's wait has no recovery period, so it is in the condition only
      data: { target: { affects: { type: "enemy" } } },
    }));
    if (this.hasTarStrike) {
      const dc = textDC(this.text, /DC (\d+) Strength check/i, "16");
      activities.push(
        this.attack(Terrorasque.TAR_STRIKE, "Expend 1 charge: on a hit the target is also restrained for 1 minute", null, false),
        itemCheck("Escape the Tar", { ability: "str", dc, condition: "The restrained creature, as an action; a success ends the restraint" }),
      );
    }
    return activities;
  }

  override get effects(): IDDBEffectHint[] {
    const dc = textDC(this.text, /DC (\d+) Wisdom saving throw/i, "15");
    const effects: IDDBEffectHint[] = [
      {
        name: "Terrorised",
        activityMatch: Terrorasque.TERRORISE,
        statuses: ["Frightened"],
        options: {
          transfer: false,
          durationSeconds: 60,
          description: `Frightened of the wielder for 1 minute; repeats the DC ${dc} Wisdom save at the end of each of its turns, ending the effect on a success.`,
        },
        midiChanges: [
          DDBEnricherData.ChangeHelper.customChange(`turn=end, saveAbility=wis, saveDC=${dc}, label=Terrorised`, 20, "flags.midi-qol.OverTime"),
        ],
      },
    ];
    if (this.hasTarStrike) {
      effects.push({
        name: "Tar Strike: Restrained",
        activityMatch: Terrorasque.TAR_STRIKE,
        statuses: ["Restrained"],
        options: { transfer: false, durationSeconds: 60, description: "Restrained for 1 minute; a Strength check as an action ends it." },
      });
    }
    return effects;
  }

  override get override(): IDDBOverrideData {
    const charges = this.charges;
    if (!charges) return {};
    return itemUses(this, charges.max, [{ period: "dawn", type: "formula", formula: charges.formula }]);
  }

}
