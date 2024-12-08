import DDBEnricherMixin from "./mixins/DDBEnricherMixin.mjs";
import { ItemEnrichers } from "./_module.mjs";

export default class DDBItemEnricher extends DDBEnricherMixin {
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
    "Arcane Oil": ItemEnrichers.ArcaneOil,
    "Armor of Invulnerability": ItemEnrichers.ArmorOfInvulnerability,
    "Bead of Force": ItemEnrichers.BeadOfForce,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Blood Fury Tattoo": ItemEnrichers.BloodFuryTattoo,
    "Boots of Speed": ItemEnrichers.BootsOfSpeed,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Cli Lyre": ItemEnrichers.InstrumentOfTheBards,
    "Cloak of Displacement": ItemEnrichers.CloakOfDisplacement,
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
    "Javelin of Lightning": ItemEnrichers.JavelinOfLightning,
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
    "Ring of the Ram": ItemEnrichers.RingOfTheRam,
  };

}

