import utils from "./Utils";

interface IDnd5eFeatureConfig {
  ActiveEffect?: { changeTypes?: Record<string, unknown> };
  DND5E?: {
    activityBehaviorTypes?: Record<string, unknown>;
    damageResistanceTypes?: Record<string, unknown>;
    featureTypes?: Record<string, { subtypes?: Record<string, unknown> } | undefined>;
    transformation?: { presets?: Record<string, { settings?: { spellLists?: Set<string> } } | undefined> };
  };
}

type TLanguageConfigNode = string | { selectable?: boolean; children?: Record<string, TLanguageConfigNode> };

export default class SystemHelpers {

  /**
   * Every key in dnd5e's CONFIG.DND5E.languages tree (leaves and categories), with the path of the
   * categories above it ("exotic:primordial" for aquan, "" for a top level key) and whether it can
   * be picked. Read live: modules such as Heroes of Faerun register languages at init, and legacy
   * rules move Druidic, Thieves' Cant and Draconic between groups. Empty before dnd5e loads its
   * config, as in tests.
   */
  static languageTree(): Map<string, { parents: string; selectable: boolean }> {
    const tree = new Map<string, { parents: string; selectable: boolean }>();
    const languages = typeof CONFIG === "undefined"
      ? undefined
      : foundry.utils.getProperty(CONFIG, "DND5E.languages") as Record<string, TLanguageConfigNode> | undefined;

    const walk = (key: string, data: TLanguageConfigNode, parents: string[]) => {
      const selectable = typeof data === "string" || data?.selectable !== false;
      // a key seen twice keeps its first place, unless only the later one can be picked
      const known = tree.get(key);
      if (!known || (!known.selectable && selectable)) tree.set(key, { parents: parents.join(":"), selectable });
      if (!data || typeof data === "string" || !data.children) return;
      Object.entries(data.children).forEach(([k, d]) => walk(k, d, [...parents, key]));
    };

    Object.entries(languages ?? {}).forEach(([key, data]) => walk(key, data, []));
    return tree;
  }

  /**
   * A language's trait key below `languages:` ("exotic:primordial:ignan", "standard:common", or the
   * bare key at the top level). The live dnd5e tree decides the group; the dictionary's `advancement`
   * group is the fallback for a language dnd5e does not list, and when its config is not loaded.
   */
  static languageTraitKey(language: { value: string; advancement?: string | null }): string {
    const parents = SystemHelpers.languageTree().get(language.value)?.parents ?? language.advancement;
    return parents ? `${parents}:${language.value}` : language.value;
  }

  /**
   * Cauldron of Plentiful Resources (chris-premades) has no Foundry 14 release, so its integration is
   * switched off here: the options show as unavailable and nothing is applied, even when the module
   * is active or the settings were left on. Flip to true to re-enable.
   */
  static CPR_SUPPORTED = false;

  /** Whether the Cauldron of Plentiful Resources integration can run in this world. */
  static cprAvailable(): boolean {
    if (!SystemHelpers.CPR_SUPPORTED) return false;
    const chrisModule = game.modules?.get("chris-premades");
    return (chrisModule?.active
      && foundry.utils.isNewerVersion(chrisModule.version, "1.1.10")
    ) ?? false;
  }

  /**
   * dnd5e capabilities newer than the 6.0 minimum, detected from the live CONFIG rather than the
   * version string so tests can stub either answer. All of them arrive in dnd5e 6.1. Emitting one on
   * 6.0 is not harmless: an unregistered `dnd5e.damage.*` change has no handler there, so core
   * writes its value onto a stray `actor.damage` property.
   */
  static DND5E_FEATURES = {
    damageApplicationRules: (config: IDnd5eFeatureConfig) =>
      Boolean(config.ActiveEffect?.changeTypes?.["dnd5e.damage.ignore.resistance"]),
    antimagic: (config: IDnd5eFeatureConfig) => Boolean(config.DND5E?.activityBehaviorTypes?.antimagic),
    fallingResistance: (config: IDnd5eFeatureConfig) => Boolean(config.DND5E?.damageResistanceTypes?.falling),
    lineageSubtype: (config: IDnd5eFeatureConfig) => Boolean(config.DND5E?.featureTypes?.race?.subtypes?.lineage),
    // 6.1 names subclasses the SRD way (`circle-land`, `college-lore`) and migrates Circle of the
    // Moon to `circle-moon`; its Wild Shape preset is the first place that id shows in CONFIG
    srdSubclassIdentifiers: (config: IDnd5eFeatureConfig) =>
      Boolean(config.DND5E?.transformation?.presets?.wildshape?.settings?.spellLists?.has?.("subclass:circle-moon")),
  };

  /**
   * Whether the running dnd5e is at least `version`. For content that newer releases ship and
   * nothing in CONFIG announces (compendium effects, icon files); capabilities use dnd5eSupports.
   * False before Foundry defines game, as in tests and early module load.
   */
  static dnd5eAtLeast(version: string): boolean {
    const running = (globalThis as { game?: { system?: { version?: string } } }).game?.system?.version;
    return !!running && !foundry.utils.isNewerVersion(version, running);
  }

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

    const activeAurasInstalled = game.modules?.get("ActiveAuras")?.active ?? false;
    const auraeffectsInstalled = game.modules?.get("auraeffects")?.active ?? false;
    const atlInstalled = game.modules?.get("ATL")?.active ?? false;
    const tokenMagicInstalled = game.modules?.get("tokenmagic")?.active ?? false;
    const autoAnimationsInstalled = game.modules?.get("autoanimations")?.active ?? false;
    const chrisInstalled = SystemHelpers.cprAvailable();
    const vision5eInstalled = game.modules?.get("vision-5e")?.active ?? false;
    const ac5eInstalled = game.modules?.get("automated-conditions-5e")?.active ?? false;

    CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
      hasCore: midiQolInstalled && daeInstalled,
      hasMonster: midiQolInstalled && daeInstalled,
      midiQolInstalled,
      daeInstalled,
      atlInstalled,
      tokenMagicInstalled,
      activeAurasInstalled,
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
