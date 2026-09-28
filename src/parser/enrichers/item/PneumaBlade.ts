import DDBEnricherData from "../data/DDBEnricherData";
import { itemProperty } from "./_ItemActivities";

/**
 * The Pneuma blades (Rare and Very Rare greatsword and longsword, and the "Varies" record, built as
 * Rare). Pneumatic Strike is a bonus action trigger pull after the attack roll: +4 to hit and an
 * extra 1d8 poison (Rare), or +5 and 2d8 fire (Very Rare). Rolling 8s on those dice misfires in a
 * 10 foot emanation that includes the wielder: Backfire, a DC 15 Constitution save for 4d6 poison
 * and Poisoned; Burnout, a DC 16 Dexterity save for 4d6 fire. DDB labels Burnout a CON save in
 * its modifier; the text says Dexterity.
 */
export default class PneumaBlade extends DDBEnricherData {

  static STRIKE = "Pneumatic Strike";

  get isVeryRare(): boolean {
    return (/\(Very Rare\)/i).test(this.ddbParser?.originalName ?? this.name);
  }

  get misfireName(): string {
    return this.isVeryRare ? "Burnout" : "Backfire";
  }

  /** The "Varies" record, which DDB types as ammunition and so parses no weapon attack. */
  get isParent(): boolean {
    return !(/\((?:Very )?Rare\)/i).test(this.ddbParser?.originalName ?? this.name);
  }

  override get stopDefaultActivity(): boolean {
    return this.isParent;
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
    const veryRare = this.isVeryRare;
    return [
      {
        init: {
          name: PneumaBlade.STRIKE,
          type: DDBEnricherData.ACTIVITY_TYPES.ATTACK,
        },
        build: {
          generateAttack: true,
          generateDamage: true,
          generateRange: true,
          generateTarget: true,
          generateConsumption: false,
          includeBaseDamage: true,
          damageParts: [veryRare
            ? DDBEnricherData.basicDamagePart({ number: 2, denomination: 8, types: ["fire"] })
            : DDBEnricherData.basicDamagePart({ number: 1, denomination: 8, types: ["poison"] })],
        },
        overrides: {
          noeffect: true,
          activationCondition: "Bonus action: pull the trigger after the attack roll, before the result is known",
          data: {
            attack: { bonus: veryRare ? "5" : "4" },
          } as Partial<I5eActivity>,
        },
      },
      itemProperty(this.misfireName, DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: veryRare ? { ability: ["dex"], formula: "16" } : { ability: ["con"], formula: "15" },
        damageParts: [veryRare
          ? DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["fire"] })
          : DDBEnricherData.basicDamagePart({ number: 4, denomination: 6, types: ["poison"] })],
        condition: veryRare
          ? "Both Heated Weapon fire dice roll an 8; each creature within 10 feet, including you"
          : "The Tetanus Blade poison die rolls an 8; each creature within 10 feet, including you",
        template: { type: "radius", size: "10" },
        range: { value: null, units: "self" },
        noeffect: veryRare,
      }),
    ];
  }

  override get effects(): IDDBEffectHint[] {
    if (this.isVeryRare) return [];
    return [
      {
        name: "Backfire: Poisoned",
        activityMatch: "Backfire",
        statuses: ["Poisoned"],
        options: { transfer: false, expiry: "targetEnd" },
      },
    ];
  }

}
