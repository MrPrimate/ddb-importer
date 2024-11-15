import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { ItemEnrichers } from "./_module.mjs";

export default class DDBItemEnricher extends DDBEnricherMixin {
  constructor({ activityGenerator } = {}) {
    super({
      activityGenerator,
      effectType: "item",
      enricherType: "item",
    });
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
    "Absorbing Tattoo": ItemEnrichers.AbsorbingTattoo,
    "Acid (vial)": ItemEnrichers.AcidVial,
    "Acid": ItemEnrichers.Acid,
    "Alchemist's Fire": ItemEnrichers.AlchemistsFire,
    "Arcane Oil": ItemEnrichers.ArcaneOil,
    "Armor of Invulnerability": ItemEnrichers.ArmorOfInvulnerability,
    "Bead of Force": ItemEnrichers.BeadOfForce,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Blood Fury Tattoo": ItemEnrichers.BloodFuryTattoo,
    "Boots of Speed": ItemEnrichers.BootsOfSpeed,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Cli Lyre": ItemEnrichers.InstrumentOfTheBards,
    "Doss Lute": ItemEnrichers.InstrumentOfTheBards,
    "Fochlucan Bandore": ItemEnrichers.InstrumentOfTheBards,
    "Mac-Fuirmidh Cittern": ItemEnrichers.InstrumentOfTheBards,
    "Ollamh Harp": ItemEnrichers.InstrumentOfTheBards,
    "Canaith Mandolin": ItemEnrichers.InstrumentOfTheBards,
    "Circlet of Blasting": ItemEnrichers.CircletOfBlasting,
    "Concussion Grenade": ItemEnrichers.ConcussionGrenade,
    "Demon Armor": ItemEnrichers.DemonArmor,
    "Donjon's Sundering Sphere": ItemEnrichers.DonjonsSunderingSphere,
    "Dust of Sneezing and Choking": ItemEnrichers.DustOfSneezingAndChoking,
    "Far Realm Shard": ItemEnrichers.FarRealmShard,
    "Flame Tongue": ItemEnrichers.FlameTongue,
    "Gnomengarde Grenade": ItemEnrichers.GnomengardeGrenade,
    "Hammer of Thunderbolts": ItemEnrichers.HammerOfThunderbolts,
    "Healer's Kit": ItemEnrichers.HealersKit,
    "Iron Bands of Binding": ItemEnrichers.IronBandsOfBinding,
    "Korolnor Scepter": ItemEnrichers.KorolnorScepter,
    "Moon Sickle": ItemEnrichers.MoonSickle,
    "Needler Pistol": ItemEnrichers.NeedlerPistol,
    "Oil of Sharpness": ItemEnrichers.OilOfSharpness,
    "Paralysis Pistol": ItemEnrichers.ParalysisPistol,
    "Potion of Healing (Greater)": ItemEnrichers.PotionOfHealingGreater,
    "Potion of Healing (Superior)": ItemEnrichers.PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": ItemEnrichers.PotionOfHealingSupreme,
    "Potion of Healing": ItemEnrichers.PotionOfHealing,
    "Staff of Charming": ItemEnrichers.StaffOfCharming,
    "Stink Bomb": ItemEnrichers.StinkBomb,
    "Wand of Fireballs": ItemEnrichers.WandOfFireballs,
    "Wand of Magic Missiles": ItemEnrichers.WandOfMagicMissiles,
    "Warrior's Passkey": ItemEnrichers.WarriorsPasskey,
    "Waterskin": ItemEnrichers.Waterskin,
  };

}

