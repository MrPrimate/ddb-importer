import { generateMultiplyChange, generateOverrideChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import DDBItemActivity from "../item/DDBItemActivity.js";
import DDBEnricherAbstract from "./mixins/DDBEnricherAbstract.mjs";
// enrichers
import AbsorbingTattoo from "./item/AbsorbingTattoo.js";
import Acid from "./item/Acid.js";
import AcidVial from "./item/AcidVial.js";
import AlchemistsFire from "./item/AlchemistsFire.js";
import ArcaneOil from "./item/ArcaneOil.js";
import ArmorOfInvulnerability from "./item/ArmorOfInvulnerability.js";
import BloodFuryTattoo from "./item/BloodFuryTattoo.js";
import FlameTongue from "./item/FlameTongue.js";
import GnomengardeGrenade from "./item/GnomengardeGrenade.js";
import HammerOfThunderbolts from "./item/HammerOfThunderbolts.js";
import KorolnorScepter from "./item/KorolnorScepter.js";
import NeedlerPistol from "./item/NeedlerPistol.js";
import ParalysisPistol from "./item/ParalysisPistol.js";
import PotionOfHealing from "./item/PotionOfHealing.js";
import PotionOfHealingGreater from "./item/PotionOfHealingGreater.js";
import PotionOfHealingSuperior from "./item/PotionOfHealingSuperior.js";
import PotionOfHealingSupreme from "./item/PotionOfHealingSupreme.js";
import WandOfFireballs from "./item/WandOfFireballs.js";
import WandOfMagicMissiles from "./item/WandOfMagicMissiles.js";
import WarriorsPasskey from "./item/WarriorsPasskey.js";
import Waterskin from "./item/Waterskin.js";

export default class DDDItemEnricher extends DDBEnricherAbstract {
  constructor() {
    super();
    this.additionalActivityClass = DDBItemActivity;
    this.effectType = "item";
    this.enricherType = "item";
  }

  load({ ddbParser, document, name = null } = {}) {
    super.load({ ddbParser, document, name });
    this._prepare();
  }

  ENRICHERS = {
    "Absorbing Tattoo": () => AbsorbingTattoo,
    "Acid (vial)": () => AcidVial,
    "Acid": () => Acid,
    "Alchemist's Fire": () => AlchemistsFire,
    "Arcane Oil": () => ArcaneOil,
    "Armor of Invulnerability": () => ArmorOfInvulnerability,
    "Blood Fury Tattoo": () => BloodFuryTattoo,
    "Flame Tongue": () => FlameTongue,
    "Gnomengarde Grenade": () => GnomengardeGrenade,
    "Hammer of Thunderbolts": () => HammerOfThunderbolts,
    "Korolnor Scepter": () => KorolnorScepter,
    "Needler Pistol": () => NeedlerPistol,
    "Paralysis Pistol": () => ParalysisPistol,
    "Potion of Healing (Greater)": () => PotionOfHealingGreater,
    "Potion of Healing (Superior)": () => PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": () => PotionOfHealingSupreme,
    "Potion of Healing": () => PotionOfHealing,
    "Wand of Fireballs": () => WandOfFireballs,
    "Wand of Magic Missiles": () => WandOfMagicMissiles,
    "Warrior's Passkey": () => WarriorsPasskey,
    "Waterskin": () => Waterskin,
  };

  NAME_HINTS = {
    "Absorbing Tattoo, Acid": "Absorbing Tattoo",
    "Absorbing Tattoo, Cold": "Absorbing Tattoo",
    "Absorbing Tattoo, Fire": "Absorbing Tattoo",
    "Absorbing Tattoo, Force": "Absorbing Tattoo",
    "Absorbing Tattoo, Lightning": "Absorbing Tattoo",
    "Absorbing Tattoo, Necrotic": "Absorbing Tattoo",
    "Absorbing Tattoo, Poison": "Absorbing Tattoo",
    "Absorbing Tattoo, Psychic": "Absorbing Tattoo",
    "Absorbing Tattoo, Radiant": "Absorbing Tattoo",
    "Absorbing Tattoo, Thunder": "Absorbing Tattoo",
    "Alchemist's Fire (flask)": "Alchemist's Fire",
    "Moon Sickle, +1": "Moon Sickle",
    "Moon Sickle, +2": "Moon Sickle",
    "Moon Sickle, +3": "Moon Sickle",
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
    "Flame Tongue Greatsword": "Flame Tongue",
    "Flame Tongue Longsword": "Flame Tongue",
    "Flame Tongue Rapier": "Flame Tongue",
    "Flame Tongue Scimitar": "Flame Tongue",
    "Flame Tongue Shortsword": "Flame Tongue",
  };

  ACTIVITY_HINTS = {
    "Bead of Force": {
      type: "save",
      addItemConsume: true,
    },
    "Boots of Speed": {
      type: "utility",
      targetType: "self",
      activationType: "bonus",
    },
    "Concussion Grenade": {
      data: {
        range: {
          value: "60",
          unit: "ft",
        },
      },
    },
    "Demon Armor": {
      type: "enchant",
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
    },
    "Far Realm Shard": {
      type: "save",
      activationType: "special",
      data: {
        damage: {
          onSave: "none",
        },
      },
    },
    "Healer's Kit": {
      type: "utility",
      addItemConsume: true,
      activationType: "action",
      targetType: "creature",
      data: {
        "range.units": "touch",
      },
    },
    "Iron Bands of Binding": {
      type: "attack",
      data: {
        attack: {
          bonus: "@prof",
          ability: "dex",
          type: {
            value: "ranged",
            classification: "weapon",
          },
        },
      },
    },
    "Oil of Sharpness": {
      type: "enchant",
      allowMagical: true,
    },
    "Stink Bomb": {
      targetType: "creature",
    },
  };

  DOCUMENT_OVERRIDES = {
    "Canaith Mandolin": {
      data: {
        "flags.magicitems": {
          charges: "1",
          chargeType: "c2",
          recharge: "1",
          rechargeType: "t1",
        },
      },
    },
    "Healer's Kit": {
      data: {
        "flags.ddbimporter": {
          retainResourceConsumption: true,
          retainUseSpent: true,
        },
        "system.uses": {
          spent: 0,
          max: 10,
          recovery: [],
          autoDestroy: false,
          autoUse: true,
        },
      },
    },
    "Iron Bands of Binding": {
      data: {
        "system.uses": {
          spent: 0,
          max: 1,
          recovery: [{
            period: "day",
            type: "recoverAll",
          }],
          autoDestroy: false,
          autoUse: true,
        },
      },
    },
  };

  EFFECT_HINTS = {
    "Bead of Force": {
      options: {
        transfer: false,
        description: "Trapped in a sphere of force!",
        durationRounds: 10,
        durationSeconds: 60,
      },
    },
    "Belashyrra's Beholder Crown": {
      changes: [
        generateUpgradeChange(120, 10, "system.attributes.senses.darkvision"),
      ],
    },
    "Boots of Speed": {
      options: {
        transfer: false,
        durationSeconds: 600,
        durationRounds: 100,
      },
      data: {
        changes: [
          generateMultiplyChange(2, 20, "system.attributes.movement.walk"),
        ],
      },
    },
    "Bracers of Archery": {
      noCreate: true,
      changes: [
        {
          key: "system.bonuses.rwak.damage",
          value: "2",
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          priority: 20,
        },
      ],
    },
    // "Demon Armor": {
    // previous DAE/Midi effect
    //   noCreate: true,
    //   changes: [
    //     {
    //       key: "items.Unarmed Strike.system.attack.bonus",
    //       value: "1",
    //       mode: CONST.ACTIVE_EFFECT_MODES.ADD,
    //       priority: 20,
    //     },
    //     {
    //       key: "items.Unarmed Strike.system.damage.parts.0.0",
    //       value: "1d8+@mod+1",
    //       mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    //       priority: 20,
    //     },
    //     {
    //       key: "items.Unarmed Strike.system.properties.mgc",
    //       value: "true",
    //       mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
    //       priority: 20,
    //     },
    //   ],
    // },
    "Demon Armor": {
      type: "enchant",
      descriptionHint: true,
      magicalBonus: {
        makeMagical: true,
        bonus: "1",
      },
      changes: [
        generateOverrideChange("1", 20, "system.bonuses.base.number"),
        generateOverrideChange("8", 20, "system.damage.base.denomination"),
        generateOverrideChange("false", 20, "system.damage.base.custom.enabled"),
      ],
      data: {
        "restrictions.type": "weapon",
      },
    },
    "Donjon's Sundering Sphere": {
      type: "enchant",
      magicalBonus: {
        bonus: "1",
      },
    },
    "Dust of Sneezing and Choking": {
      name: "Sneezing and Choking",
      options: {
        transfer: false,
        description: "You are &Reference[incapacitated]{incapacitated} and &Reference[suffocating]{suffocating}.",
      },
      statuses: ["Incapacitated", "Suffocating"], // ?
    },
    "Moon Sickle": {
      noCreate: true,
      changes: [
        generateUnsignedAddChange("+ 4", 20, "system.bonuses.heal.damage"),
      ],
    },
    "Oil of Sharpness": {
      type: "enchant",
      magicalBonus: {
        bonus: "3",
      },
    },
  };

  ADDITIONAL_ACTIVITIES = {
    "Donjon's Sundering Sphere": [
      {
        constructor: {
          name: "Isolating Smite: Save vs Banishment",
          type: "save",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateSave: true,
          generateUses: true,
          usesOverride: {
            max: 1,
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
        overrides: {
          addActivityConsume: true,
        },
      },
    ],
    "Iron Bands of Binding": [
      {
        constructor: {
          name: "Escape Check",
          type: "check",
        },
        build: {
          generateTarget: false,
          generateRange: false,
          generateCheck: true,
          checkOverride: {
            associated: [],
            ability: "str",
            dc: {
              calculation: "",
              formula: "20",
            },
          },
        },
        overrides: {
          addItemConsume: true,
        },
      },
    ],
    "Staff of Charming": [
      {
        constructor: {
          name: "Auto Save vs Charmspell",
          type: "utility",
        },
        build: {
          generateSave: false,
          generateDamage: false,
          generateConsumption: true,
          consumeActivity: true,
          generateUses: true,
          usesOverride: {
            override: true,
            max: 1,
            spent: 0,
            prompt: true,
            recovery: [{ period: "lr", type: "recoverAll" }],
          },
        },
      },
      {
        constructor: {
          name: "Reflect Spell",
          type: "utility",
        },
        build: {
          generateSave: true,
          saveOverride: {
            ability: "",
            dc: {
              calculation: "spellcasting",
              formula: "",
            },
          },
        },
      },
    ],
  };
}
