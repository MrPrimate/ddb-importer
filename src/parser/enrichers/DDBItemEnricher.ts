import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import { GenericEnrichers, ItemEnrichers } from "./_module";
import { utils } from "../../lib/_module";

export default class DDBItemEnricher extends DDBEnricherFactoryMixin {
  constructor({ activityGenerator, notifier = null }: { activityGenerator: any; notifier?: any } = {} as any) {
    super({
      activityGenerator,
      effectType: "item",
      enricherType: "item",
      notifier,
      ddbActionType: "item",
    });
  }

  _defaultNameLoader(): any {
    const itemName = utils.pascalCase(this.name);
    if (!ItemEnrichers[itemName]) {
      return null;
    }
    return new ItemEnrichers[itemName]({
      ddbEnricher: this,
    });
  }

  NAME_HINTS: Record<string, any> = {
    "Alchemist's Fire (flask)": "Alchemist's Fire",
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
  };

  NAME_HINT_INCLUDES: Record<string, any> = {
    "Absorbing Tattoo": "Absorbing Tattoo",
    "Banjo of Ol' Jericho Sticks": "Banjo of Ol' Jericho Sticks",
    "Banjo of Ol’ Jericho Sticks": "Banjo of Ol' Jericho Sticks",
    "Bell of the Dusk Mother": "Bell of the Dusk Mother",
    "Cabal's Ruin": "Cabal's Ruin",
    "Clematis-tainted": "Clematis-tainted Weapon",
    "Flame Tongue": "Flame Tongue",
    "Ghaal'Shaarat": "Ghaal'Shaarat",
    "Moon Sickle": "Moon Sickle",
    "Dragon Wing": "Dragon Wing",
    "Hammer of Thunderbolts": "Hammer of Thunderbolts",
    "Wraps of Unarmed Power": "Wraps of Unarmed Power",
    "Wraps of Unarmed Prowess": "Wraps of Unarmed Power",
    "of the Vampire Lily Dragon": "Vampire Lily Dragon Armor",
    // Arcana Unleashed item families
    "Staff of Skulls": "Staff of Skulls",
    "Tramontane ": "Tramontane Armor",
    "Goading ": "Goading Ammunition",
  };

  ENRICHERS: Record<string, any> = {
    "Absorbing Tattoo": ItemEnrichers.AbsorbingTattoo,
    "Staff of Skulls": ItemEnrichers.StaffOfSkulls,
    "Tramontane Armor": ItemEnrichers.TramontaneArmor,
    "Goading Ammunition": ItemEnrichers.GoadingAmmunition,
    "Vampire Lily Dragon Armor": ItemEnrichers.VampireLilyDragonArmor,
    "Cabal's Ruin": ItemEnrichers.CabalsRuin,
    "Clematis-tainted Weapon": ItemEnrichers.ClematisTaintedWeapon,
    "Banjo of Ol' Jericho Sticks": ItemEnrichers.BanjoOfOlJerichoSticks,
    "Bell of the Dusk Mother": ItemEnrichers.BellOfTheDuskMother,
    "Phoenix Rocket Sword": ItemEnrichers.PhoenixRocketSword,
    "Requiem Bliss": ItemEnrichers.Requiem,
    "Requiem Clay": ItemEnrichers.Requiem,
    "Acid (vial)": ItemEnrichers.AcidVial,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Alchemist's Fire": ItemEnrichers.AlchemistsFire,
    "Succulent Water of Life": ItemEnrichers.SucculentWaterOfLife,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Clematis Poison": ItemEnrichers.ClematisPoison,
    "Everlasting Sugarbomb": ItemEnrichers.EverlastingSugarbomb,
    "Muscle Graft": ItemEnrichers.MuscleGraft,
    "Sphere of Annihilation": ItemEnrichers.SphereOfAnnihilation,
    "Canaith Mandolin": ItemEnrichers.InstrumentOfTheBards,
    "Cli Lyre": ItemEnrichers.InstrumentOfTheBards,
    "Donjon's Sundering Sphere": ItemEnrichers.DonjonsSunderingSphere,
    "Doss Lute": ItemEnrichers.InstrumentOfTheBards,
    "Dragon Wing": ItemEnrichers.DragonWing,
    "Flame Tongue": ItemEnrichers.FlameTongue,
    "Fochlucan Bandore": ItemEnrichers.InstrumentOfTheBards,
    "Ghaal'Shaarat": ItemEnrichers.GhaalShaaratWeapon,
    "Hammer of Thunderbolts": ItemEnrichers.HammerOfThunderbolts,
    "Healer's Kit": ItemEnrichers.HealersKit,
    "Lantern, Bullseye": ItemEnrichers.BullseyeLantern,
    "Lantern, Hooded": ItemEnrichers.HoodedLantern,
    "Mac-Fuirmidh Cittern": ItemEnrichers.InstrumentOfTheBards,
    "Moon Sickle": ItemEnrichers.MoonSickle,
    "Ollamh Harp": ItemEnrichers.InstrumentOfTheBards,
    "Potion of Healing (Greater)": ItemEnrichers.PotionOfHealingGreater,
    "Potion of Healing (Superior)": ItemEnrichers.PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": ItemEnrichers.PotionOfHealingSupreme,
    "Silent Hand Crossbow": ItemEnrichers.MistypedCrossbow,
    "Silent Heavy Crossbow": ItemEnrichers.MistypedCrossbow,
    "Silent Light Crossbow": ItemEnrichers.MistypedCrossbow,
    "Spell-Refueling Ring (Reaction)": ItemEnrichers.SpellRefuelingRingReaction,
    "Warrior's Passkey": ItemEnrichers.WarriorsPasskey,
    "Wraps of Unarmed Power": ItemEnrichers.WrapsOfUnarmedPower,
    "Shepherd’s Bane": ItemEnrichers.ShepherdsBane,
    "Shepherd's Bane": ItemEnrichers.ShepherdsBane,
    "Salamander Sauce": ItemEnrichers.UnarmedElementalPotion,
    "Last Rites Rum": ItemEnrichers.UnarmedElementalPotion,
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
    "Demon Breastplate": ItemEnrichers.DemonArmor,
    "Demon Chain Mail": ItemEnrichers.DemonArmor,
    "Demon Ring Mail": ItemEnrichers.DemonArmor,
    "Demon Chain Shirt": ItemEnrichers.DemonArmor,
    "Demon Half Plate Armor": ItemEnrichers.DemonArmor,
    "Demon Hide Armor": ItemEnrichers.DemonArmor,
    "Demon Leather Armor": ItemEnrichers.DemonArmor,
    "Demon Padded Armor": ItemEnrichers.DemonArmor,
    "Demon Plate Armor": ItemEnrichers.DemonArmor,
    "Demon Splint Armor": ItemEnrichers.DemonArmor,
    "Demon Scale Mail": ItemEnrichers.DemonArmor,
    "Hypnovulfen Figure": ItemEnrichers.HypnovulfenFigure,
  };
}
