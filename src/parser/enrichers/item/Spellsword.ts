import DDBEnricherData from "../data/DDBEnricherData";
import type DDBItem from "../../item/DDBItem";
import utils from "../../../lib/Utils";
import WeaponProperties from "./_WeaponProperties";
import { itemProperty } from "./_ItemActivities";

/**
 * Spellsword: activating the blade with a 3rd or 4th level slot makes its damage die a d8 with +1
 * to attack and damage rolls, and a 5th level slot or higher a d10 with +2. Deactivating the blade
 * early with an action erupts its stored magic in a 10 foot cone - a Dexterity save for 3d6 force,
 * half on a success, rising to 4d8 when activated with a 3rd or 4th level slot and 5d10 with 5th
 * or higher.
 */
export default class Spellsword extends WeaponProperties {

  /**
   * An attack with the blade activated by a 3rd level slot or higher, whose damage die and bonus to
   * attack and damage rolls grow with the slot. The bonus is the whole of it: the weapon's magical
   * bonus, which DDB sets to +1 on every record, already applies to the attack roll but never to
   * a damage part outside the weapon's base damage.
   */
  activatedAttack(name: string, slots: string, denomination: number, bonus: number): IDDBAdditionalActivity {
    const parser = this.ddbParser as DDBItem | undefined;
    const magicalBonus = Number(foundry.utils.getProperty(parser?.data ?? {}, "system.magicalBonus")) || 0;
    const attackBonus = bonus - magicalBonus;
    return {
      init: { name, type: DDBEnricherData.ACTIVITY_TYPES.ATTACK, id: utils.namedIDStub(name, { prefix: "ddbItem" }) },
      build: {
        generateAttack: true,
        generateDamage: true,
        generateActivation: true,
        generateConsumption: false,
        includeBaseDamage: false,
        activationOverride: { type: "action", value: 1, condition: `The sword was activated using ${slots}` },
        noeffect: true,
      },
      overrides: {
        noConsumeTargets: true,
        noeffect: true,
        data: {
          attack: { bonus: attackBonus === 0 ? "" : `${attackBonus}` },
          damage: {
            includeBase: false,
            parts: [DDBEnricherData.basicDamagePart({ number: 1, denomination, bonus: `@mod + ${bonus}`, types: ["force"] })],
          },
        },
      },
    };
  }

  // DDB carries the activated tiers only as Restricted Attacks, which this base does not build
  override get additionalActivities(): IDDBAdditionalActivity[] {
    return [
      this.activatedAttack("Activated: 3rd-4th Level Slot", "a 3rd or 4th level spell slot", 8, 1),
      this.activatedAttack("Activated: 5th+ Level Slot", "a 5th level spell slot or higher", 10, 2),
      itemProperty("Deactivation Wave", DDBEnricherData.ACTIVITY_TYPES.SAVE, {
        save: { ability: ["dex"], formula: "15" },
        damageParts: [DDBEnricherData.basicDamagePart({ number: 3, denomination: 6, types: ["force"] })],
        onSave: "half",
        activationType: "action",
        condition: "Deactivate the sword early. 4d8 if activated with a 3rd or 4th level slot, 5d10 with 5th or higher",
        template: { type: "cone", size: "10" },
        range: { value: null, units: "self" },
        noeffect: true,
      }),
    ];
  }

}
