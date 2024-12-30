import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin.mjs";
import { ItemEnrichers } from "./_module.mjs";

export default class DDBItemEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null } = {}) {
    super({
      activityGenerator,
      effectType: "item",
      enricherType: "item",
      notifier,
      ddbActionType: "item",
    });
  }

  NAME_HINTS = {
    "Alchemist's Fire (flask)": "Alchemist's Fire",
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
  };

  NAME_HINT_INCLUDES = {
    "Absorbing Tattoo": "Absorbing Tattoo",
    "Flame Tongue": "Flame Tongue",
    "Moon Sickle": "Moon Sickle",
  };

  ENRICHERS = {
    "Absorbing Tattoo": ItemEnrichers.AbsorbingTattoo,
    "Acid (vial)": ItemEnrichers.AcidVial,
    "Acid": ItemEnrichers.Acid,
    "Alchemist's Fire": ItemEnrichers.AlchemistsFire,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Arcane Oil": ItemEnrichers.ArcaneOil,
    "Armor of Invulnerability": ItemEnrichers.ArmorOfInvulnerability,
    "Bead of Force": ItemEnrichers.BeadOfForce,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Blood Fury Tattoo": ItemEnrichers.BloodFuryTattoo,
    "Boots of Speed": ItemEnrichers.BootsOfSpeed,
    "Bullseye Lantern": ItemEnrichers.BullseyeLantern,
    "Canaith Mandolin": ItemEnrichers.InstrumentOfTheBards,
    "Candle": ItemEnrichers.Candle,
    "Circlet of Blasting": ItemEnrichers.CircletOfBlasting,
    "Cli Lyre": ItemEnrichers.InstrumentOfTheBards,
    "Cloak of Displacement": ItemEnrichers.CloakOfDisplacement,
    "Concussion Grenade": ItemEnrichers.ConcussionGrenade,
    "Demon Armor": ItemEnrichers.DemonArmor,
    "Donjon's Sundering Sphere": ItemEnrichers.DonjonsSunderingSphere,
    "Doss Lute": ItemEnrichers.InstrumentOfTheBards,
    "Dust of Sneezing and Choking": ItemEnrichers.DustOfSneezingAndChoking,
    "Far Realm Shard": ItemEnrichers.FarRealmShard,
    "Flame Tongue": ItemEnrichers.FlameTongue,
    "Fochlucan Bandore": ItemEnrichers.InstrumentOfTheBards,
    "Gnomengarde Grenade": ItemEnrichers.GnomengardeGrenade,
    "Hammer of Thunderbolts": ItemEnrichers.HammerOfThunderbolts,
    "Healer's Kit": ItemEnrichers.HealersKit,
    "Hooded Lantern": ItemEnrichers.HoodedLantern,
    "Iron Bands of Binding": ItemEnrichers.IronBandsOfBinding,
    "Javelin of Lightning": ItemEnrichers.JavelinOfLightning,
    "Korolnor Scepter": ItemEnrichers.KorolnorScepter,
    "Lamp": ItemEnrichers.Lamp,
    "Lantern, Bullseye": ItemEnrichers.BullseyeLantern,
    "Lantern, Hooded": ItemEnrichers.HoodedLantern,
    "Mac-Fuirmidh Cittern": ItemEnrichers.InstrumentOfTheBards,
    "Moon Sickle": ItemEnrichers.MoonSickle,
    "Needler Pistol": ItemEnrichers.NeedlerPistol,
    "Oil of Sharpness": ItemEnrichers.OilOfSharpness,
    "Ollamh Harp": ItemEnrichers.InstrumentOfTheBards,
    "Paralysis Pistol": ItemEnrichers.ParalysisPistol,
    "Pearl of Power": ItemEnrichers.PearlOfPower,
    "Potion of Healing (Greater)": ItemEnrichers.PotionOfHealingGreater,
    "Potion of Healing (Superior)": ItemEnrichers.PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": ItemEnrichers.PotionOfHealingSupreme,
    "Potion of Healing": ItemEnrichers.PotionOfHealing,
    "Potion of Speed": ItemEnrichers.PotionOfSpeed,
    "Ring of the Ram": ItemEnrichers.RingOfTheRam,
    "Spellguard Shield": ItemEnrichers.SpellguardShield,
    "Staff of Charming": ItemEnrichers.StaffOfCharming,
    "Staff of Healing": ItemEnrichers.StaffOfHealing,
    "Stink Bomb": ItemEnrichers.StinkBomb,
    "Torch": ItemEnrichers.Torch,
    "Wand of Fireballs": ItemEnrichers.WandOfFireballs,
    "Wand of Magic Missiles": ItemEnrichers.WandOfMagicMissiles,
    "Warrior's Passkey": ItemEnrichers.WarriorsPasskey,
    "Waterskin": ItemEnrichers.Waterskin,
    "Wand of Orcus": ItemEnrichers.WandOfOrcus,
  };

}

