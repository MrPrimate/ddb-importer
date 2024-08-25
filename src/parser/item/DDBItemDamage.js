import DDBHelper from "../../lib/DDBHelper";
import utils from "../../lib/utils";


export class DDBItemDamage {

  constructor(ddbItem) {
    this.ddbItem = ddbItem.ddbItem;
    this.ddbDefinition = ddbItem.ddbDefinition;
    this.ddbData = ddbItem.ddbData;

    this.damageParts = [];
    this.healingParts = [];
  }

  getAmmunitionDamage(magicalDamageBonus) {
    let parts = [];

    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && this.ddbDefinition.damageType) {
      // if there is a magical damage bonus, it probably should only be included into the first damage part.
      parts.push([
        utils.parseDiceString(this.ddbDefinition.damage.diceString + `+${magicalDamageBonus}`).diceString,
        this.ddbDefinition.damageType.toLowerCase(),
      ]);

      const damage = DDBBasicActivity.buildDamagePart({ damageString, type });

    }

    // additional damage parts
    // Note: For the time being, restricted additional bonus parts are not included in the damage
    //       The Saving Throw Freature within Foundry is not fully implemented yet, to this will/might change
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction.length === 0)
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        if (die) {
          parts.push([die.diceString, mod.subType]);
        } else if (mod.value) {
          parts.push([mod.value, mod.subType]);
        }
      });

    let result = {
      // label: utils.parseDiceString(parts.map(part => part[0]).join(' + ')).diceString,
      parts: parts,
      versatile: "",
    };

    return result;
  }

  getConsumableDamage(actionType) {
    let damage = { parts: [], versatile: "" };
    // is this a damage potion
    switch (actionType) {
      case "heal": {
        // healing potion
        // we only get the first matching modifier
        const healingModifier = this.ddbDefinition.grantedModifiers.find(
          (mod) => mod.type === "bonus" && mod.subType === "hit-points",
        );
        if (healingModifier) {
          const healingDie = healingModifier.dice
            ? healingModifier.dice
            : healingModifier.die
              ? healingModifier.die
              : undefined;
          if (healingDie?.diceString) {
            damage.parts = [[healingDie.diceString, "healing"]];
          } else if (healingModifier.fixedValue) {
            damage.parts = [[healingModifier.fixedValue, "healing"]];
          }
        }
        break;
      }
      case "rsak": {
        // damage potion
        const damageModifier = this.ddbDefinition.grantedModifiers.find((mod) =>
          mod.type === "damage" && (mod.dice || mod.die),
        );
        if (damageModifier) {
          const damageDie = damageModifier.dice
            ? damageModifier.dice
            : damageModifier.die
              ? damageModifier.die
              : undefined;
          if (damageDie?.diceString) {
            damage.parts = [[damageDie.diceString, damageModifier.subType]];
          } else if (damageModifier.fixedValue) {
            damage.parts = [[damageModifier.fixedValue, damageModifier.subType]];
          }
        }
        break;
      }
      // no default
    }
    return damage;
  }

  getStaffDamage(magicalDamageBonus) {
    let weaponBehavior = this.ddbDefinition.weaponBehaviors[0];
    let versatile = weaponBehavior.properties.find((property) => property.name === "Versatile");
    if (versatile && versatile.notes) {
      versatile = utils.parseDiceString(versatile.notes + `+${magicalDamageBonus}`).diceString;
    } else {
      versatile = "";
    }

    let parts = [];

    // first damage part
    // blowguns and other weapons rely on ammunition that provides the damage parts
    if (weaponBehavior.damage && weaponBehavior.damage.diceString && weaponBehavior.damageType) {
      const diceString = utils.parseDiceString(weaponBehavior.damage.diceString + `+${magicalDamageBonus}`).diceString;

      parts.push([
        `${diceString} +@mod`,
        weaponBehavior.damageType.toLowerCase(),
      ]);
    }

    // additional damage parts
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage")
      .forEach((mod) => {
        const die = mod.dice
          ? mod.dice
          : mod.die
            ? mod.die
            : undefined;
        if (die?.diceString) {
          parts.push([die.diceString, mod.subType]);
        } else if (mod.value) {
          parts.push([`${mod.value}`, mod.subType]);
        }
      });

    let result = {
      // label: utils.parseDiceString(parts.map(part => part[0]).join(' + ')).diceString,
      parts: parts,
      versatile: versatile,
    };

    return result;
  }


  getWeaponDamage(flags) {
    // const magicalDamageBonus = getWeaponMagicalBonus(data, flags, true);
    // we can safely make these assumptions about GWF and Dueling because the
    // flags are only added for melee attacks
    const greatWeaponFighting = flags.classFeatures.includes("greatWeaponFighting") ? "r<=2" : "";
    const offHand = flags.classFeatures.includes("OffHand");
    const twoWeapon = flags.classFeatures.includes("Two-Weapon Fighting");
    const twoHanded = this.ddbDefinition.properties.find((property) => property.name === "Two-Handed");
    const mod = (offHand && !twoWeapon) ? "" : " + @mod";

    const baseDamageTagData = DDBHelper.getDamageTagForItem(this.ddbItem);
    const damageTag = baseDamageTagData.damageTag;
    const damageType = baseDamageTagData.damageType;

    const versatile = this.ddbDefinition.properties
      .filter((property) => property.name === "Versatile")
      .map((versatile) => {
        if (versatile && versatile.notes) {
          return (
            utils.parseDiceString(versatile.notes, null, damageTag, greatWeaponFighting).diceString + mod
          );
        } else {
          return "";
        }
      })[0];

    let parts = [];

    // if we have greatweapon fighting style and this is two handed, add the roll tweak
    // else if we have duelling we add the bonus here (assumption- if you have dueling
    // you're going to use it! (DDB also makes this assumption))
    const fightingStyleDiceMod = twoHanded ? greatWeaponFighting : "";

    // if we are a martial artist and the weapon is eligable we may need to use a bigger dice type.
    // this martial arts die info is addedd to the weapon flags before parse weapon is called
    const martialArtsDie = flags.martialArtsDie;

    if (Number.isInteger(this.ddbDefinition.fixedDamage)) {
      parts.push([
        utils.parseDiceString(this.ddbDefinition.fixedDamage, `${mod}`, damageTag, fightingStyleDiceMod)
          .diceString,
        damageType,
      ]);
    } else if (this.ddbDefinition.damage && this.ddbDefinition.damage.diceString && damageType) {
      let diceString = this.ddbDefinition.damage.diceString;
      if (martialArtsDie.diceValue && this.ddbDefinition.damage.diceValue && martialArtsDie.diceValue > this.ddbDefinition.damage.diceValue) {
        diceString = martialArtsDie.diceString;
      }

      // if there is a magical damage bonus, it probably should only be included into the first damage part.
      parts.push([
        utils.parseDiceString(diceString, `${mod}`, damageTag, fightingStyleDiceMod)
          .diceString,
        damageType,
      ]);
    }

    // additional damage parts with no restrictions
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && (!mod.restriction || mod.restriction === ""))
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : mod.value;
        if (damagePart) {
          const subDamageTagData = DDBHelper.getDamageTagForMod(mod);
          const damageParsed = utils.parseDiceString(damagePart, "", subDamageTagData.damageTag).diceString;
          parts.push([`${damageParsed}`, subDamageTagData.damageType]);
        }
      });


    let chatFlavors = [];
    let otherFormulas = [];
    let restrictions = [];
    // loop over restricted damage types
    // we do this so we can either break this out for midi users
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && mod.restriction && mod.restriction !== "")
      .forEach((mod) => {
        const die = mod.dice ? mod.dice : mod.die ? mod.die : undefined;
        const damagePart = die ? die.diceString : `${mod.value}`;
        if (damagePart) {
          const subDamageTagData = DDBHelper.getDamageTagForMod(mod);
          const damageParsed = utils.parseDiceString(damagePart, "", subDamageTagData.damageTag).diceString;
          restrictions.push(mod.restriction);
          otherFormulas.push(damageParsed);
          chatFlavors.push(`[${damagePart}] ${mod.restriction}`);
        }
      });

    const otherFormula = otherFormulas.join(" + ");
    const chatFlavor = chatFlavors.length === 0 ? "" : `Roll Other damage: ${chatFlavors.join(", ")}`;

    // add damage modifiers from other sources like improved divine smite
    if (flags.damage.parts) {
      flags.damage.parts.forEach((part) => {
        parts.push(part);
      });
    }

    const result = {
      parts,
      versatile,
    };

    return [result, otherFormula, chatFlavor, restrictions];
  }

  getWonderousDamage() {
    const parts = [];

    // additional damage parts
    this.ddbDefinition.grantedModifiers
      .filter((mod) => mod.type === "damage" && CONFIG.DND5E.damageTypes[mod.subType])
      .forEach((mod) => {
        const die = mod.dice
          ? mod.dice
          : mod.die
            ? mod.die
            : undefined;
        if (die?.diceString) {
          parts.push([die.diceString, mod.subType]);
        } else if (mod.value) {
          parts.push([`${mod.value}`, mod.subType]);
        }
      });

    const result = {
      parts,
      versatile: "",
    };

    return result;
  }

}
