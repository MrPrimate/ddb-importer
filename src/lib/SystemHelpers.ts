import utils from "./Utils";

interface IDnd5eFeatureConfig {
  ActiveEffect?: { changeTypes?: Record<string, unknown> };
  DND5E?: {
    activityBehaviorTypes?: Record<string, unknown>;
    damageResistanceTypes?: Record<string, unknown>;
    featureTypes?: Record<string, { subtypes?: Record<string, unknown> } | undefined>;
  };
}

export default class SystemHelpers {

  /**
   * dnd5e capabilities newer than the 6.0 minimum, detected from the live CONFIG rather than the
   * version string so tests can stub either answer. All four arrive in dnd5e 6.1. Emitting one on
   * 6.0 is not harmless: an unregistered `dnd5e.damage.*` change has no handler there, so core
   * writes its value onto a stray `actor.damage` property.
   */
  static DND5E_FEATURES = {
    damageApplicationRules: (config: IDnd5eFeatureConfig) =>
      Boolean(config.ActiveEffect?.changeTypes?.["dnd5e.damage.ignore.resistance"]),
    antimagic: (config: IDnd5eFeatureConfig) => Boolean(config.DND5E?.activityBehaviorTypes?.antimagic),
    fallingResistance: (config: IDnd5eFeatureConfig) => Boolean(config.DND5E?.damageResistanceTypes?.falling),
    lineageSubtype: (config: IDnd5eFeatureConfig) => Boolean(config.DND5E?.featureTypes?.race?.subtypes?.lineage),
  };

  static dnd5eSupports(feature: keyof typeof SystemHelpers.DND5E_FEATURES): boolean {
    // tests and early module load can run before Foundry defines CONFIG
    if (typeof CONFIG === "undefined") return false;
    const config = CONFIG as unknown as IDnd5eFeatureConfig;
    return SystemHelpers.DND5E_FEATURES[feature](config);
  }

  static effectModules(): IEffectModules {
    if (CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules) {
      return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
    }
    const midiQolInstalled = game.modules?.get("midi-qol")?.active ?? false;
    const daeInstalled = game.modules?.get("dae")?.active ?? false;

    const auraeffectsInstalled = game.modules?.get("auraeffects")?.active ?? false;
    const tokenMagicInstalled = game.modules?.get("tokenmagic")?.active ?? false;
    const autoAnimationsInstalled = game.modules?.get("autoanimations")?.active ?? false;
    const chrisModule = game.modules?.get("chris-premades");
    const chrisInstalled = (chrisModule?.active
      && foundry.utils.isNewerVersion(chrisModule.version, "1.1.10")
    ) ?? false;
    const vision5eInstalled = game.modules?.get("vision-5e")?.active ?? false;
    const ac5eInstalled = game.modules?.get("automated-conditions-5e")?.active ?? false;

    CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
      hasCore: midiQolInstalled && daeInstalled,
      hasMonster: midiQolInstalled && daeInstalled,
      midiQolInstalled,
      daeInstalled,
      tokenMagicInstalled,
      auraeffectsInstalled,
      autoAnimationsInstalled,
      chrisInstalled,
      vision5eInstalled,
      ac5eInstalled,
    };
    return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
  }

  static parseBasicDamageFormula(data: I5eDamagePart, formula: string | number, { stripMod = false } = {}) {
    const basicMatchRegex = /^\s*(\d+)d(\d+)(?:\s*([+|-])\s*(@?[\w\d.-]+))?\s*$/i;
    const damageMatch = `${formula}`.match(basicMatchRegex);

    if (damageMatch && CONFIG.DND5E.dieSteps.includes(Number(damageMatch[2]))) {
      data.number = Number(damageMatch[1]);
      data.denomination = Number(damageMatch[2]);
      if (damageMatch[4]) data.bonus = damageMatch[3] === "-" ? `-${damageMatch[4]}` : damageMatch[4];
      if (stripMod && data.bonus !== undefined) data.bonus = data.bonus.replace(/@mod/, "").trim().replace(/^\+/, "").trim();
    } else if (Number.isInteger(Number.parseInt(`${formula}`))) {
      data.bonus = `${formula}`;
    } else {
      data.custom ??= { enabled: false, formula: "" };
      data.custom.enabled = true;
      data.custom.formula = `${formula}`;
    }

    if (utils.isString(data.bonus)) {
      data.bonus = data.bonus.replace(/\s*[-+]\s*$/, "");
    }

  }

  static buildDamagePart({ dice = null, damageString = "", type = null, types = null, stripMod = false }: {
    // DDB die shape; looser than IDDBDamageDice (multiplier vs diceMultiplier, extra value field)
    dice?: {
      multiplier?: number | null;
      diceCount?: number | null;
      diceValue?: number | null;
      fixedValue?: number | null;
      value?: number | null;
    } | null;
    damageString?: string | number;
    type?: string | null;
    types?: string[] | null;
    stripMod?: boolean;
  } = {}): I5eDamagePart {
    const damage: I5eDamagePart = {
      number: null,
      denomination: 0,
      bonus: "",
      types: types ?? (type ? [type.toLowerCase()] : []),
      custom: {
        enabled: false,
        formula: "",
      },
      scaling: {
        mode: "", // whole, half or ""
        number: null,
        formula: "",
      },
    };

    if (dice && !dice.multiplier) {
      damage.number = dice.diceCount ?? undefined;
      damage.denomination = dice.diceValue ?? undefined;
      if (dice.fixedValue) damage.bonus = `${dice.fixedValue}`;
      if (dice.value) damage.bonus = `${dice.value}`;
    } else {
      SystemHelpers.parseBasicDamageFormula(damage, damageString, { stripMod });
    }
    return damage;
  }


  static getTemplate(type: string) {
    switch (type.toLowerCase()) {
      case "character":
        return game.dnd5e?.dataModels.actor.CharacterData.schema.getInitialValue();
      case "npc":
        return game.dnd5e?.dataModels.actor.NPCData.schema.getInitialValue();
      case "vehicle":
        return game.dnd5e?.dataModels.actor.VehicleData.schema.getInitialValue();
      case "class":
        return game.dnd5e?.dataModels.item.ClassData.schema.getInitialValue();
      case "background":
        return game.dnd5e?.dataModels.item.BackgroundData.schema.getInitialValue();
      case "consumable":
        return game.dnd5e?.dataModels.item.ConsumableData.schema.getInitialValue();
      case "backpack":
      case "container":
        return game.dnd5e?.dataModels.item.ContainerData.schema.getInitialValue();
      case "equipment":
      case "armor":
        return game.dnd5e?.dataModels.item.EquipmentData.schema.getInitialValue();
      case "feat":
        return game.dnd5e?.dataModels.item.FeatData.schema.getInitialValue();
      case "loot":
        return game.dnd5e?.dataModels.item.LootData.schema.getInitialValue();
      case "race":
        return game.dnd5e?.dataModels.item.RaceData.schema.getInitialValue();
      case "spell":
        return game.dnd5e?.dataModels.item.SpellData.schema.getInitialValue();
      case "subclass":
        return game.dnd5e?.dataModels.item.SubclassData.schema.getInitialValue();
      case "tool":
        return game.dnd5e?.dataModels.item.ToolData.schema.getInitialValue();
      case "weapon":
        return game.dnd5e?.dataModels.item.WeaponData.schema.getInitialValue();
      case "journalpage":
      case "classjournalpage":
        return game.dnd5e?.dataModels.journal.ClassJournalPageData.schema.getInitialValue();
      case "spelllistjournalpage":
        return game.dnd5e?.dataModels.journal.SpellListJournalPageData.schema.getInitialValue();
      case "maplocationjournalpage":
        return game.dnd5e?.dataModels.journal.MapLocationJournalPageData.schema.getInitialValue();
      case "subclassjournalpage":
        return game.dnd5e?.dataModels.journal.SubclassJournalPageData.schema.getInitialValue();
      case "rulejournalpage":
        return game.dnd5e?.dataModels.journal.RuleJournalPageData.schema.getInitialValue();
      case "dnd-tashas-cauldron.tattoo":
      case "tattoo":
        // module subtype registered at runtime by Tasha's Cauldron, not part of the dnd5e-types item map
        return (CONFIG.Item.dataModels as Record<string, { schema: { getInitialValue: () => any } }>)["dnd-tashas-cauldron.tattoo"]?.schema.getInitialValue();
      default:
        return undefined;
    }
  }

}
