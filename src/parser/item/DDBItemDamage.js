import DDBHelper from "../../lib/DDBHelper";
import utils from "../../lib/utils";
import DDBBasicActivity from "../enrichers/DDBBasicActivity";


export class DDBItemDamage {

  constructor(ddbItem) {
    this.ddbItem = ddbItem.ddbItem;
    this.ddbDefinition = ddbItem.ddbDefinition;
    this.ddbData = ddbItem.ddbData;
    this.flags = this.ddbItem.flags;

    this.damageParts = [];
    this.healingParts = [];
    this.additionalActivities = [];
  }

  static #getDamageParts(modifiers, typeOverride = null) {
    return modifiers
      .filter((mod) => Number.isInteger(mod.value)
        || (mod.dice ? mod.dice : mod.die ? mod.die : undefined) !== undefined,
      )
      .map((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        if (die) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: die.diceString,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.value) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: mod.value,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else if (mod.fixedValue) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: mod.fixedValue,
            type: typeOverride ?? mod.subType,
          });
          return damage;
        } else {
          return null;
        }
      }).filter((part) => part !== null);
  }

  generateAmmunitionDamage(magicalDamageBonus) {
    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && this.ddbDefinition.damageType) {
      const damageString = utils.parseDiceString(this.ddbDefinition.damage.diceString).diceString;
      const damage = DDBBasicActivity.buildDamagePart({
        damageString,
        type: this.ddbDefinition.damageType.toLowerCase(),
      });
      damage.bonus = damage.bonus === "" ? magicalDamageBonus : ` + ${magicalDamageBonus}`;
      this.damageParts.push(damage);
    }

    // additional damage parts
    const additionalDamageParts = DDBItemDamage.#getDamageParts(
      this.ddbDefinition.grantedModifiers
        .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === "")),
    );
    this.damageParts.push(...additionalDamageParts);

    // Add saving throw additional
    // e.g. arrow of slaying is "DC 17 Constitution for Half Damage",
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        const damageParts = DDBItemDamage.#getDamageParts([mod]);

        if (damageParts.length === 0) {
          const saveSearch = /DC (\d+) (\w+) /i;
          const saveMatch = mod.restriction.match(saveSearch);

          this.additionalActivities.push({
            type: this.saveMatch ? "save" : "damage",
            options: {
              generateDamage: true,
              damageParts,
              includeBaseDamage: false,
              saveOverride: saveMatch
                ? {
                  formula: parseInt(saveMatch[1]),
                  calculation: "custom",
                  ability: saveMatch[2].toLowerCase().substr(0, 3),
                }
                : null,
            },
          });
        }
      });
  }

  generateGrantedModifiersDamageParts() {
    const healingModifiers = this.ddbDefinition.grantedModifiers.filter(
      (mod) => mod.type === "bonus" && mod.subType === "hit-points",
    );
    if (healingModifiers) {
      const healingDamageParts = DDBItemDamage.#getDamageParts(healingModifiers, "healing");
      this.healingParts.push(...healingDamageParts);
    }

    const additionalDamageParts = DDBItemDamage.#getDamageParts(
      this.ddbDefinition.grantedModifiers
        .filter((mod) => mod.type === "damage" && CONFIG.DND5E.damageTypes[mod.subType]),
    );
    this.damageParts.push(...additionalDamageParts);

  }

  generateStaffDamageParts(magicalDamageBonus) {
    let weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    let versatile = weaponBehavior.properties.find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(versatile.notes).diceString,
        stripMod: true,
        type: weaponBehavior.damageType.toLowerCase(),
      });
      damage.bonus = damage.bonus === "" ? magicalDamageBonus : ` + ${magicalDamageBonus}`;
      this.additionalActivities.push({
        name: `Versatile`,
        options: {
          generateDamage: true,
          damageParts: [damage],
          includeBaseDamage: false,
        },
      });
    }

    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (weaponBehavior.damage && weaponBehavior.damage.diceString && weaponBehavior.damageType) {
      const damageString = utils.parseDiceString(weaponBehavior.damage.diceString).diceString;
      const damage = DDBBasicActivity.buildDamagePart({
        damageString,
        type: weaponBehavior.damageType.toLowerCase(),
        stripMod: true,
      });
      damage.bonus = damage.bonus === "" ? magicalDamageBonus : ` + ${magicalDamageBonus}`;
      this.damageParts.push(damage);
    }

    // additional damage parts
    this.generateGrantedModifiersDamageParts();

  }


  generateWeaponDamageParts() {
    // const magicalDamageBonus = getWeaponMagicalBonus(data, flags, true);
    // we can safely make these assumptions about GWF
    // flags are only added for melee attacks
    const greatWeaponFighting = this.flags.classFeatures.includes("greatWeaponFighting") ? "r<=2" : "";
    const twoHanded = this.ddbDefinition.properties.find((property) => property.name === "Two-Handed");

    const damageType = DDBHelper.getDamageType(this.ddbItem);

    const versatile = this.ddbDefinition.properties.find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(versatile.notes, null, "", greatWeaponFighting).diceString,
        stripMod: true,
        type: this.ddbDefinition.damageType.toLowerCase(),
      });
      this.additionalActivities.push({
        name: `Versatile`,
        options: {
          generateDamage: true,
          damageParts: [damage],
          includeBaseDamage: false,
        },
      });
    }

    // if we have greatweapon fighting style and this is two handed, add the roll tweak
    const fightingStyleDiceMod = twoHanded ? greatWeaponFighting : "";

    // if we are a martial artist and the weapon is eligable we may need to use a bigger dice type.
    // this martial arts die info is added to the weapon flags before parse weapon is called
    const martialArtsDie = this.flags.martialArtsDie;

    if (Number.isInteger(this.ddbDefinition.fixedDamage)) {
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(this.ddbDefinition.fixedDamage, "", "", fightingStyleDiceMod).diceString,
        stripMod: true,
        type: damageType,
      });
      this.damageParts.push(damage);
    } else if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && damageType) {
      let diceString = this.ddbDefinition.damage.diceString;
      if (martialArtsDie.diceValue && this.ddbDefinition.damage.diceValue && martialArtsDie.diceValue > this.ddbDefinition.damage.diceValue) {
        diceString = martialArtsDie.diceString;
      }
      const damage = DDBBasicActivity.buildDamagePart({
        damageString: utils.parseDiceString(diceString, "", "", fightingStyleDiceMod).diceString,
        stripMod: true,
        type: damageType,
      });
      this.damageParts.push(damage);
    }

    // additional damage parts with no restrictions
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === ""))
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : mod.value;
        if (damagePart) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: utils.parseDiceString(damagePart, "", "", fightingStyleDiceMod).diceString,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });
          this.damageParts.push(damage);
        }
      });

    // loop over restricted damage types
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : `${mod.value}`;
        if (damagePart) {
          const damage = DDBBasicActivity.buildDamagePart({
            damageString: damagePart,
            stripMod: true,
            type: mod.subType ? mod.subType : "",
          });

          this.additionalActivities.push({
            name: `Restricted Attack: ${mod.restriction}`,
            options: {
              generateDamage: true,
              damageParts: [damage],
              includeBaseDamage: false,
              chatFlavor: mod.restriction ?? "",
            },
          });
        }
      });

    // add damage modifiers from other sources like improved divine smite
    if (this.flags.damage.parts) {
      this.flags.damage.parts.forEach((part) => {
        const damage = DDBBasicActivity.buildDamagePart({
          damageString: part[0],
          stripMod: true,
          type: part[1],
        });
        this.damageParts.push(damage);
      });
    }
  }

}
