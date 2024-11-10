import { generateMultiplyChange, generateOverrideChange, generateUnsignedAddChange, generateUpgradeChange } from "../../effects/effects.js";
import DDBItemActivity from "../item/DDBItemActivity.js";
import DDBEnricherAbstract from "./mixins/DDBEnricherAbstract.mjs";
import { ItemEnrichers } from "./_module.mjs";

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

  ENRICHERS = {
    "Absorbing Tattoo": () => ItemEnrichers.AbsorbingTattoo,
    "Acid (vial)": () => ItemEnrichers.AcidVial,
    "Acid": () => ItemEnrichers.Acid,
    "Alchemist's Fire": () => ItemEnrichers.AlchemistsFire,
    "Arcane Oil": () => ItemEnrichers.ArcaneOil,
    "Armor of Invulnerability": () => ItemEnrichers.ArmorOfInvulnerability,
    "Blood Fury Tattoo": () => ItemEnrichers.BloodFuryTattoo,
    "Flame Tongue": () => ItemEnrichers.FlameTongue,
    "Gnomengarde Grenade": () => ItemEnrichers.GnomengardeGrenade,
    "Hammer of Thunderbolts": () => ItemEnrichers.HammerOfThunderbolts,
    "Korolnor Scepter": () => ItemEnrichers.KorolnorScepter,
    "Needler Pistol": () => ItemEnrichers.NeedlerPistol,
    "Paralysis Pistol": () => ItemEnrichers.ParalysisPistol,
    "Potion of Healing (Greater)": () => ItemEnrichers.PotionOfHealingGreater,
    "Potion of Healing (Superior)": () => ItemEnrichers.PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": () => ItemEnrichers.PotionOfHealingSupreme,
    "Potion of Healing": () => ItemEnrichers.PotionOfHealing,
    "Wand of Fireballs": () => ItemEnrichers.WandOfFireballs,
    "Wand of Magic Missiles": () => ItemEnrichers.WandOfMagicMissiles,
    "Warrior's Passkey": () => ItemEnrichers.WarriorsPasskey,
    "Waterskin": () => ItemEnrichers.Waterskin,
    "Bead of Force": () => ItemEnrichers.BeadOfForce,
    "Boots of Speed": () => ItemEnrichers.BootsOfSpeed,
    "Concussion Grenade": () => ItemEnrichers.ConcussionGrenade,
    "Demon Armor": () => ItemEnrichers.DemonArmor,
    "Donjon's Sundering Sphere": () => ItemEnrichers.DonjonsSunderingSphere,
    "Iron Bands of Binding": () => ItemEnrichers.IronBandsOfBinding,
    "Far Realm Shard": () => ItemEnrichers.FarRealmShard,
    "Canaith Mandolin": () => ItemEnrichers.CanaithMandolin,
    "Healer's Kit": () => ItemEnrichers.HealersKit,
    "Staff of Charming": () => ItemEnrichers.StaffOfCharming,
    "Oil of Sharpness": () => ItemEnrichers.OilOfSharpness,
    "Stink Bomb": () => ItemEnrichers.StinkBomb,
    "Belashyrra's Beholder Crown": () => ItemEnrichers.BelashyrrasBeholderCrown,
    "Dust of Sneezing and Choking": () => ItemEnrichers.DustOfSneezingAndChoking,
    "Moon Sickle": () => ItemEnrichers.MoonSickle,
  };

}
