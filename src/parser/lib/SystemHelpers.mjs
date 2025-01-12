export default class SystemHelpers {

  static effectModules() {
    if (CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules) {
      return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
    }
    const midiQolInstalled = game.modules.get("midi-qol")?.active ?? false;
    const timesUp = game.modules.get("times-up")?.active ?? false;
    const daeInstalled = game.modules.get("dae")?.active ?? false;

    const activeAurasInstalled = game.modules.get("ActiveAuras")?.active ?? false;
    const atlInstalled = game.modules.get("ATL")?.active ?? false;
    const tokenMagicInstalled = game.modules.get("tokenmagic")?.active ?? false;
    const autoAnimationsInstalled = game.modules.get("autoanimations")?.active ?? false;
    const chrisInstalled = (game.modules.get("chris-premades")?.active
      && foundry.utils.isNewerVersion(game.modules.get("chris-premades").version, "1.1.10")
    ) ?? false;
    const vision5eInstalled = game.modules.get("vision-5e")?.active ?? false;

    CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules = {
      hasCore: midiQolInstalled && timesUp && daeInstalled,
      hasMonster: midiQolInstalled && timesUp && daeInstalled,
      midiQolInstalled,
      timesUp,
      daeInstalled,
      atlInstalled,
      tokenMagicInstalled,
      activeAurasInstalled,
      autoAnimationsInstalled,
      chrisInstalled,
      vision5eInstalled,
    };
    return CONFIG.DDBI.EFFECT_CONFIG.MODULES.installedModules;
  }

  static parseBasicDamageFormula(data, formula, { stripMod = false } = {}) {
    const basicMatchRegex = /^\s*(\d+)d(\d+)(?:\s*([+|-])\s*(@?[\w\d.-]+))?\s*$/i;
    const damageMatch = `${formula}`.match(basicMatchRegex);

    if (damageMatch && CONFIG.DND5E.dieSteps.includes(Number(damageMatch[2]))) {
      data.number = Number(damageMatch[1]);
      data.denomination = Number(damageMatch[2]);
      if (damageMatch[4]) data.bonus = damageMatch[3] === "-" ? `-${damageMatch[4]}` : damageMatch[4];
      if (stripMod) data.bonus = data.bonus.replace(/@mod/, "").trim().replace(/^\+/, "").trim();
    } else if (Number.isInteger(Number.parseInt(formula))) {
      data.bonus = formula;
    } else {
      data.custom.enabled = true;
      data.custom.formula = formula;
    }
  }

  static buildDamagePart({ dice = null, damageString = "", type, stripMod = false } = {}) {
    const damage = {
      number: null,
      denomination: 0,
      bonus: "",
      types: type ? [type.toLowerCase()] : [],
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
      damage.number = dice.diceCount;
      damage.denomination = dice.diceValue;
      if (dice.fixedValue) damage.bonus = dice.fixedValue;
      if (dice.value) damage.bonus = dice.value;
    } else {
      SystemHelpers.parseBasicDamageFormula(damage, damageString, { stripMod });
    }
    return damage;
  }

  // eslint-disable-next-line complexity
  static getTemplate(type) {
    switch (type.toLowerCase()) {
      case "character":
        return game.dnd5e.dataModels.actor.CharacterData.schema.initial();
      case "npc":
        return game.dnd5e.dataModels.actor.NPCData.schema.initial();
      case "vehicle":
        return game.dnd5e.dataModels.actor.VehicleData.schema.initial();
      case "class":
        return game.dnd5e.dataModels.item.ClassData.schema.initial();
      case "background":
        return game.dnd5e.dataModels.item.BackgroundData.schema.initial();
      case "consumable":
        return game.dnd5e.dataModels.item.ConsumableData.schema.initial();
      case "backpack":
      case "container":
        return game.dnd5e.dataModels.item.ContainerData.schema.initial();
      case "equipment":
      case "armor":
        return game.dnd5e.dataModels.item.EquipmentData.schema.initial();
      case "feat":
        return game.dnd5e.dataModels.item.FeatData.schema.initial();
      case "loot":
        return game.dnd5e.dataModels.item.LootData.schema.initial();
      case "race":
        return game.dnd5e.dataModels.item.RaceData.schema.initial();
      case "spell":
        return game.dnd5e.dataModels.item.SpellData.schema.initial();
      case "subclass":
        return game.dnd5e.dataModels.item.SubclassData.schema.initial();
      case "tool":
        return game.dnd5e.dataModels.item.ToolData.schema.initial();
      case "weapon":
        return game.dnd5e.dataModels.item.WeaponData.schema.initial();
      case "journalpage":
      case "classjournalpage":
        return game.dnd5e.dataModels.journal.ClassJournalPageData.schema.initial();
      case "spelllistjournalpage":
        return game.dnd5e.dataModels.journal.SpellListJournalPageData.schema.initial();
      case "maplocationjournalpage":
        return game.dnd5e.dataModels.journal.MapLocationJournalPageData.schema.initial();
      case "subclassjournalpage":
        return game.dnd5e.dataModels.journal.SubClassJournalPageData.schema.initial();
      case "rulejournalpage":
        return game.dnd5e.dataModels.journal.RuleJournalPageData.schema.initial();
      case "dnd-tashas-cauldron.tattoo":
      case "tattoo":
        return CONFIG.Item.dataModels["dnd-tashas-cauldron.tattoo"].schema.initial();
      default:
        return undefined;
    }
  }

}
