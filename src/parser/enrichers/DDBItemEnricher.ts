import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as GenericEnrichers from "./generic/_module";
import * as ItemEnrichers from "./item/_module";
import { utils } from "../../lib/_module";
import type DDBEnricherData from "./data/DDBEnricherData";
import { SRD_ITEM_SUMMONS } from "../companions/types/SRDItemSummonTable";

export default class DDBItemEnricher extends DDBEnricherFactoryMixin {
  constructor({
    activityGenerator,
    notifier = null,
  }: {
    activityGenerator: TActivityGenerator;
    notifier?: NotifierV1 | null;
    fallbackEnricher?: string;
  }) {
    super({
      activityGenerator,
      effectType: "item",
      enricherType: "item",
      notifier,
      ddbActionType: "item",
    });
  }

  _defaultNameLoader(): DDBEnricherData | null {
    if (!this.name) return null;
    const itemName = utils.pascalCase(this.name);
    // via unknown: the namespace exports an abstract base (TomeOf) that is not newable
    const Enricher = (ItemEnrichers as unknown as Record<string, EnricherConstructor | undefined>)[itemName];
    if (!Enricher) {
      return null;
    }
    return new Enricher({
      ddbEnricher: this,
    });
  }

  override NAME_HINTS: Record<string, string> = {
    "Alchemist's Fire (flask)": "Alchemist's Fire",
    "Ball Bearings (bag of 1,000)": "Ball Bearings",
    "Caltrops (bag of 20)": "Caltrops",
    // raw delerium by crystal size; the Delerium-Forged weapons and the focus are other items
    "Delerium Chip": "Delerium",
    "Delerium Crystal": "Delerium",
    "Delerium Fragment": "Delerium",
    "Delerium Geode": "Delerium",
    "Delerium Massive Cluster": "Delerium",
    "Delerium Shard": "Delerium",
    "Oil (flask)": "Oil",
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
  };

  override NAME_HINT_INCLUDES: Record<string, string> = {
    // every summoning item in the table routes to the one table-driven enricher
    ...Object.fromEntries(SRD_ITEM_SUMMONS.map((entry) => [entry.match, "SRD Summon Item"])),
    "Absorbing Tattoo": "Absorbing Tattoo",
    "Banjo of Ol' Jericho Sticks": "Banjo of Ol' Jericho Sticks",
    "Banjo of Ol’ Jericho Sticks": "Banjo of Ol' Jericho Sticks",
    "Bell of the Dusk Mother": "Bell of the Dusk Mother",
    "Blade of the Guardian": "Evolved Item",
    "Breastplate of the Tyrant": "Evolved Item",
    "Broodslinger": "Broodslinger",
    "Cabal's Ruin": "Cabal's Ruin",
    "Clematis-tainted": "Clematis-tainted Weapon",
    "Dragon Wing": "Dragon Wing",
    "Flame Tongue": "Flame Tongue",
    "Frost Brand": "Frost Brand",
    "Ghaal'Shaarat": "Ghaal'Shaarat",
    "Goading ": "Goading Ammunition",
    "Haemscale": "Haemscale",
    "Hammer of Thunderbolts": "Hammer of Thunderbolts",
    "Jewel of Three Prayers": "Jewel of Three Prayers",
    "Keyholes Dagger": "Keyholes Dagger",
    "Moon Sickle": "Moon Sickle",
    " of Grass": "Weapon of Grass",
    "of the Vampire Lily Dragon": "Vampire Lily Dragon Armor",
    "Rhythm-Maker's Drum": "Rhythm-Maker's Drum",
    "Ring of Dedicated Focus": "Ring of Dedicated Focus",
    "Rod of the Honed Mind": "Evolved Item",
    "Rod of the Pact Keeper": "Rod of the Pact Keeper",
    "Shovel of Yorgrim": "Shovel of Yorgrim",
    "Staff of Skulls": "Staff of Skulls",
    "Tramontane ": "Tramontane Armor",
    "Visage of the Old Ways": "Visage of the Old Ways",
    "Wand of Celestial Prowess": "Evolved Item",
    "Wave-Swept": "Wave-Swept Weapon",
    "Workshop Wrecker": "Workshop Wrecker",
    "Wraps of Dyamak": "Wraps of Dyamak",
    "Wraps of Unarmed Power": "Wraps of Unarmed Power",
    "Wraps of Unarmed Prowess": "Wraps of Unarmed Power",
    "Wyrm's Breath Grenade": "Wyrm's Breath Grenade",
  };

  ENRICHERS: Record<string, EnricherConstructor> = {
    "Absorbing Tattoo": ItemEnrichers.AbsorbingTattoo,
    "Acid (vial)": ItemEnrichers.AcidVial,
    "Alchemist's Fire": ItemEnrichers.AlchemistsFire,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Bagpipes": ItemEnrichers.MusicalInstrumentChecks,
    "Ball Bearings": ItemEnrichers.BallBearings,
    "Banjo of Ol' Jericho Sticks": ItemEnrichers.BanjoOfOlJerichoSticks,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Bell of the Dusk Mother": ItemEnrichers.BellOfTheDuskMother,
    "Broodslinger": ItemEnrichers.Broodslinger,
    "Cabal's Ruin": ItemEnrichers.CabalsRuin,
    "Caltrops": ItemEnrichers.Caltrops,
    "Canaith Mandolin": ItemEnrichers.InstrumentOfTheBards,
    "Clematis Poison": ItemEnrichers.ClematisPoison,
    "Clematis-tainted Weapon": ItemEnrichers.ClematisTaintedWeapon,
    "Cli Lyre": ItemEnrichers.InstrumentOfTheBards,
    "Demon Breastplate": ItemEnrichers.DemonArmor,
    "Demon Chain Mail": ItemEnrichers.DemonArmor,
    "Demon Chain Shirt": ItemEnrichers.DemonArmor,
    "Demon Half Plate Armor": ItemEnrichers.DemonArmor,
    "Demon Hide Armor": ItemEnrichers.DemonArmor,
    "Demon Leather Armor": ItemEnrichers.DemonArmor,
    "Demon Padded Armor": ItemEnrichers.DemonArmor,
    "Demon Plate Armor": ItemEnrichers.DemonArmor,
    "Demon Ring Mail": ItemEnrichers.DemonArmor,
    "Demon Scale Mail": ItemEnrichers.DemonArmor,
    "Delerium": ItemEnrichers.Delerium,
    "Demon Splint Armor": ItemEnrichers.DemonArmor,
    "Dice": ItemEnrichers.GamingSetChecks,
    "Dice Set": ItemEnrichers.GamingSetChecks,
    "Donjon's Sundering Sphere": ItemEnrichers.DonjonsSunderingSphere,
    "Doss Lute": ItemEnrichers.InstrumentOfTheBards,
    "Dragon Wing": ItemEnrichers.DragonWing,
    "Dragonchess": ItemEnrichers.GamingSetChecks,
    "Dragonchess Set": ItemEnrichers.GamingSetChecks,
    "Drum": ItemEnrichers.MusicalInstrumentChecks,
    "Dulcimer": ItemEnrichers.MusicalInstrumentChecks,
    "Everlasting Sugarbomb": ItemEnrichers.EverlastingSugarbomb,
    "Evolved Item": ItemEnrichers.EvolvedItem,
    "SRD Summon Item": ItemEnrichers.SRDSummonItem,
    "Flame Tongue": ItemEnrichers.FlameTongue,
    "Flute": ItemEnrichers.MusicalInstrumentChecks,
    "Fochlucan Bandore": ItemEnrichers.InstrumentOfTheBards,
    "Frost Brand": ItemEnrichers.FrostBrand,
    "Ghaal'Shaarat": ItemEnrichers.GhaalShaaratWeapon,
    "Goading Ammunition": ItemEnrichers.GoadingAmmunition,
    "Haemscale": ItemEnrichers.Haemscale,
    "Hammer of Thunderbolts": ItemEnrichers.HammerOfThunderbolts,
    "Healer's Kit": ItemEnrichers.HealersKit,
    "Horn": ItemEnrichers.MusicalInstrumentChecks,
    "Hypnovulfen Figure": ItemEnrichers.HypnovulfenFigure,
    "Jewel of Three Prayers": ItemEnrichers.JewelOfThreePrayers,
    "Keyholes Dagger": ItemEnrichers.KeyholesDagger,
    "Lantern, Bullseye": ItemEnrichers.BullseyeLantern,
    "Lantern, Hooded": ItemEnrichers.HoodedLantern,
    "Last Rites Rum": ItemEnrichers.UnarmedElementalPotion,
    "Lute": ItemEnrichers.MusicalInstrumentChecks,
    "Lyre": ItemEnrichers.MusicalInstrumentChecks,
    "Mac-Fuirmidh Cittern": ItemEnrichers.InstrumentOfTheBards,
    "Moon Sickle": ItemEnrichers.MoonSickle,
    "Muscle Graft": ItemEnrichers.MuscleGraft,
    "Oil": ItemEnrichers.Oil,
    "Ollamh Harp": ItemEnrichers.InstrumentOfTheBards,
    "Pan Flute": ItemEnrichers.MusicalInstrumentChecks,
    "Phoenix Rocket Sword": ItemEnrichers.PhoenixRocketSword,
    "Pistol, Automatic": ItemEnrichers.SemiautomaticPistol,
    "Playing Card Set": ItemEnrichers.GamingSetChecks,
    "Playing Cards": ItemEnrichers.GamingSetChecks,
    "Potion of Healing (Greater)": ItemEnrichers.PotionOfHealingGreater,
    "Potion of Healing (Superior)": ItemEnrichers.PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": ItemEnrichers.PotionOfHealingSupreme,
    "Requiem Bliss": ItemEnrichers.Requiem,
    "Requiem Clay": ItemEnrichers.Requiem,
    "Rhythm-Maker's Drum": ItemEnrichers.RhythmMakersDrum,
    "Rifle, Automatic": ItemEnrichers.AutomaticRifle,
    "Rifle, Hunting": ItemEnrichers.HuntingRifle,
    "Ring of Dedicated Focus": ItemEnrichers.RingOfDedicatedFocus,
    "Ring of X-ray Vision": ItemEnrichers.RingOfXRayVision,
    "Rod of the Pact Keeper": ItemEnrichers.RodOfThePactKeeper,
    "Salamander Sauce": ItemEnrichers.UnarmedElementalPotion,
    "Shawm": ItemEnrichers.MusicalInstrumentChecks,
    "Shepherd's Bane": ItemEnrichers.ShepherdsBane,
    "Shepherd’s Bane": ItemEnrichers.ShepherdsBane,
    "Shovel of Yorgrim": ItemEnrichers.ShovelOfYorgrim,
    "Silent Hand Crossbow": ItemEnrichers.MistypedCrossbow,
    "Silent Heavy Crossbow": ItemEnrichers.MistypedCrossbow,
    "Silent Light Crossbow": ItemEnrichers.MistypedCrossbow,
    "Spell-Refueling Ring (Reaction)": ItemEnrichers.SpellRefuelingRingReaction,
    "Sphere of Annihilation": ItemEnrichers.SphereOfAnnihilation,
    "Staff of Skulls": ItemEnrichers.StaffOfSkulls,
    "Succulent Water of Life": ItemEnrichers.SucculentWaterOfLife,
    "Three-dragon ante": ItemEnrichers.GamingSetChecks,
    "Three-Dragon Ante": ItemEnrichers.GamingSetChecks,
    "Three-Dragon Ante Set": ItemEnrichers.GamingSetChecks,
    "Tramontane Armor": ItemEnrichers.TramontaneArmor,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Vampire Lily Dragon Armor": ItemEnrichers.VampireLilyDragonArmor,
    "Viol": ItemEnrichers.MusicalInstrumentChecks,
    "Visage of the Old Ways": ItemEnrichers.VisageOfTheOldWays,
    "Warrior's Passkey": ItemEnrichers.WarriorsPasskey,
    "Wave-Swept Weapon": ItemEnrichers.WaveSweptWeapon,
    "Weapon of Grass": ItemEnrichers.WeaponOfGrass,
    "Wisteria Dragon Perfume": ItemEnrichers.WisteriaDragonPerfume,
    "Workshop Wrecker": ItemEnrichers.WorkshopWrecker,
    "Wraps of Dyamak": ItemEnrichers.WrapsOfDyamak,
    "Wraps of Unarmed Power": ItemEnrichers.WrapsOfUnarmedPower,
    "Wyrm's Breath Grenade": ItemEnrichers.WyrmsBreathGrenade,
  };

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {};
}
