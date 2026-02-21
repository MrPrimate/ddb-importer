import DDBEnricherFactoryMixin from "./mixins/DDBEnricherFactoryMixin";
import { ItemEnrichers } from "./_module";
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
    "Flame Tongue": "Flame Tongue",
    "Moon Sickle": "Moon Sickle",
    "Dragon Wing": "Dragon Wing",
  };

  ENRICHERS: Record<string, any> = {
    "Absorbing Tattoo": ItemEnrichers.AbsorbingTattoo,
    "Acid (vial)": ItemEnrichers.AcidVial,
    "Anstruth Harp": ItemEnrichers.InstrumentOfTheBards,
    "Alchemist's Fire": ItemEnrichers.AlchemistsFire,
    "Belashyrra's Beholder Crown": ItemEnrichers.BelashyrrasBeholderCrown,
    "Canaith Mandolin": ItemEnrichers.InstrumentOfTheBards,
    "Cli Lyre": ItemEnrichers.InstrumentOfTheBards,
    "Donjon's Sundering Sphere": ItemEnrichers.DonjonsSunderingSphere,
    "Doss Lute": ItemEnrichers.InstrumentOfTheBards,
    "Dragon Wing": ItemEnrichers.DragonWing,
    "Flame Tongue": ItemEnrichers.FlameTongue,
    "Fochlucan Bandore": ItemEnrichers.InstrumentOfTheBards,
    "Healer's Kit": ItemEnrichers.HealersKit,
    "Lantern, Bullseye": ItemEnrichers.BullseyeLantern,
    "Lantern, Hooded": ItemEnrichers.HoodedLantern,
    "Mac-Fuirmidh Cittern": ItemEnrichers.InstrumentOfTheBards,
    "Moon Sickle": ItemEnrichers.MoonSickle,
    "Ollamh Harp": ItemEnrichers.InstrumentOfTheBards,
    "Potion of Healing (Greater)": ItemEnrichers.PotionOfHealingGreater,
    "Potion of Healing (Superior)": ItemEnrichers.PotionOfHealingSuperior,
    "Potion of Healing (Supreme)": ItemEnrichers.PotionOfHealingSupreme,
    "Spell-Refueling Ring (Reaction)": ItemEnrichers.SpellRefuelingRingReaction,
    "Warrior's Passkey": ItemEnrichers.WarriorsPasskey,
  };
}
