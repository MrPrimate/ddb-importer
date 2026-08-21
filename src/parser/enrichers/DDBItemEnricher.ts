import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import * as GenericEnrichers from "./generic/_module";
import * as ItemEnrichers from "./item/_module";
import { utils } from "../../lib/_module";
import type DDBEnricherData from "./data/DDBEnricherData";

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
    "Potion of Greater Healing": "Potion of Healing (Greater)",
    "Potion of Superior Healing": "Potion of Healing (Superior)",
    "Potion of Supreme Healing": "Potion of Healing (Supreme)",
  };

  override NAME_HINT_INCLUDES: Record<string, string> = {
    "Absorbing Tattoo": "Absorbing Tattoo",
    "Cabal's Ruin": "Cabal's Ruin",
    "Flame Tongue": "Flame Tongue",
    "Ghaal'Shaarat": "Ghaal'Shaarat",
    "Moon Sickle": "Moon Sickle",
    "Dragon Wing": "Dragon Wing",
    "Hammer of Thunderbolts": "Hammer of Thunderbolts",
    "Jewel of Three Prayers": "Jewel of Three Prayers",
    "Wraps of Unarmed Power": "Wraps of Unarmed Power",
    "Wraps of Unarmed Prowess": "Wraps of Unarmed Power",
  };

  ENRICHERS: Record<string, EnricherConstructor> = {
    "Absorbing Tattoo": ItemEnrichers.AbsorbingTattoo,
    "Acid (vial)": ItemEnrichers.AcidVial,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Alchemist's Fire": ItemEnrichers.AlchemistsFire,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Cabal's Ruin": ItemEnrichers.CabalsRuin,
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
    "Jewel of Three Prayers": ItemEnrichers.JewelOfThreePrayers,
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
    "Unarmed Strike": GenericEnrichers.UnarmedStrike,
  };

  FALLBACK_ENRICHERS: Record<string, EnricherConstructor> = {};
}
