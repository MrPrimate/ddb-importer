// import logger from "../logger.js";
import logger from "../logger.js";
import FileHelper from "./FileHelper.js";
import PatreonHelper from "./PatreonHelper.js";
import { getCobalt } from "./Secrets.js";
import DDBSources from "../apps/DDBSources.js";
import SETTINGS from "../settings.js";
import { effectModules } from "../effects/effects.js";

const MuncherSettings = {

  disableCharacterActiveEffectSettings: (html) => {
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", false);
    $(html).find("#character-import-policy-add-spell-effects").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-spell-effects", false);
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", false);
    $(html).find("#character-import-policy-add-item-effects").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-item-effects", false);
    $(html).find("#character-import-policy-add-character-effects").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-character-effects", false);
    $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy", false);
    $(html).find("#character-update-policy-use-chris-premades").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades", false);

    ["class", "race", "background", "feat"].forEach((type) => {
      $(html).find(`#character-import-policy-effect-${type}-speed`).prop("checked", false);
      game.settings.set(SETTINGS.MODULE_ID, `character-update-policy-effect-${type}-speed`, false);
      $(html).find(`#character-import-policy-effect-${type}-senses`).prop("checked", false);
      game.settings.set(SETTINGS.MODULE_ID, `character-update-policy-effect-${type}-senses`, false);
      $(html).find(`#character-import-policy-effect-${type}-damages`).prop("checked", false);
      game.settings.set(SETTINGS.MODULE_ID, `character-update-policy-effect-${type}-damages`, false);
    });
  },

  setRecommendedCharacterActiveEffectSettings: (html) => {
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", !effectModules().hasCore);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", !effectModules().hasCore);
    $(html).find("#character-import-policy-add-spell-effects").prop("checked", effectModules().hasCore);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-spell-effects", effectModules().hasCore);
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", false);
    $(html).find("#character-import-policy-add-item-effects").prop("checked", true);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-item-effects", true);
    $(html).find("#character-import-policy-add-character-effects").prop("checked", true);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-character-effects", true);
    $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy", false);
    $(html).find("#character-update-policy-use-chris-premades").prop("checked", !effectModules().chrisInstalled);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades", !effectModules().chrisInstalled);

    ["class", "race", "background", "feat"].forEach((type) => {
      $(html).find(`#character-import-policy-effect-${type}-speed`).prop("checked", false);
      game.settings.set(SETTINGS.MODULE_ID, `character-update-policy-effect-${type}-speed`, false);
      $(html).find(`#character-import-policy-effect-${type}-senses`).prop("checked", false);
      game.settings.set(SETTINGS.MODULE_ID, `character-update-policy-effect-${type}-senses`, false);
      $(html).find(`#character-import-policy-effect-${type}-damages`).prop("checked", false);
      game.settings.set(SETTINGS.MODULE_ID, `character-update-policy-effect-${type}-damages`, false);
    });
  },

  getInstalledIcon: (name) => {
    return effectModules()[name] ? "<i class='fas fa-check-circle' style='color: green'></i>" : "<i class='fas fa-times-circle' style='color: red'></i> ";
  },

  getCharacterImportSettings: () => {
    const importPolicies1 = [
      {
        name: "name",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-name"),
        description: "Name",
      },
      {
        name: "hp",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-hp"),
        description: "HP",
      },
      {
        name: "hit-die",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-hit-die"),
        description: "Hit Die",
      },
      {
        name: "image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-image"),
        description: "Image",
      },
      {
        name: "bio",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-bio"),
        description: "Bio",
      },
      {
        name: "languages",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-languages"),
        description: "Languages",
      },
      {
        name: "spell-use",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-spell-use"),
        description: "Spell Slots",
      }
    ];
    const importPolicies2 = [
      {
        name: "class",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-class"),
        description: "Classes",
      },
      {
        name: "feat",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-feat"),
        description: "Features",
      },
      {
        name: "weapon",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-weapon"),
        description: "Weapons",
      },
      {
        name: "equipment",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-equipment"),
        description: "Other Equipment",
      },
      {
        name: "currency",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-currency"),
        description: "Currency",
      },
      {
        name: "spell",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-spell"),
        description: "Spells",
      },
    ];

    const effectModulesAvailable = effectModules();
    const chrisInstalled = effectModulesAvailable.chrisInstalled;
    const generateSpellEffects = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-spell-effects");
    if (generateSpellEffects && !effectModulesAvailable.hasCore) {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-spell-effects", false);
    }
    const daeInstalled = effectModulesAvailable.daeInstalled;
    const advancedMacrosText = isNewerVersion(11, game.version) ? ` Advanced Macros${MuncherSettings.getInstalledIcon("advancedMacrosInstalled")},` : "";
    const itemMacroText = isNewerVersion(11, game.version) ? ` Item Macro${MuncherSettings.getInstalledIcon("itemMacroInstalled")}` : "";
    const basicEffectsText = `Requires DAE${MuncherSettings.getInstalledIcon("daeInstalled")} due to legacy reasons. The following additional modules are recommended for higher degree automation but are otherwise not required: Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, ${advancedMacrosText}${itemMacroText}, Times Up${MuncherSettings.getInstalledIcon("timesUp")}, and Convenient Effects${MuncherSettings.getInstalledIcon("convenientEffectsInstalled")}.`;
    const featureEffectText = `Generate effects for a character. Some effects are always generated, some are optional (see below). ${basicEffectsText}`;
    const spellEffectText = `Generate effects for spells. These require DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")},${advancedMacrosText}${itemMacroText} Times Up${MuncherSettings.getInstalledIcon("timesUp")}, and Convenient Effects${MuncherSettings.getInstalledIcon("convenientEffectsInstalled")} as a minimum. Also recommened: Active Auras${MuncherSettings.getInstalledIcon("activeAurasInstalled")}, Active Token Effects${MuncherSettings.getInstalledIcon("atlInstalled")}, Token Magic FX${MuncherSettings.getInstalledIcon("tokenMagicInstalled")}, Automated Animations${MuncherSettings.getInstalledIcon("autoAnimationsInstalled")} and  Warpgate${MuncherSettings.getInstalledIcon("warpgateInstalled")}.`;
    const itemEffectText = `Generate ActiveEffects for a character's equipment. This setting will not include AC effects on armor, but will for things like the Ring of Protection. ${basicEffectsText}`;

    // const importExtras = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-extras");

    const importConfig = [
      {
        name: "use-inbuilt-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-inbuilt-icons"),
        description: "Use icons from the inbuilt dictionary. (High coverage of items, feats, and spells).",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd-icons"),
        description: "Use icons from the SRD compendium. (This can take a while).",
        enabled: true,
      },
      {
        name: "use-ddb-spell-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-spell-icons"),
        description: "Use spell school icons from D&DBeyond.",
        enabled: true,
      },
      {
        name: "use-ddb-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-item-icons"),
        description: "Use equipment icons from D&DBeyond (where they exist).",
        enabled: true,
      },
      {
        name: "use-ddb-generic-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-generic-item-icons"),
        description: "Use D&D Beyond generic item type images, if available (final fallback)",
        enabled: true,
      },
      {
        name: "use-full-description",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-full-description"),
        description: "For actions use full description and snippets, else use snippets only.",
        enabled: true,
      },
      {
        name: "add-description-to-chat",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "add-description-to-chat"),
        description: "If using D&D System 2.4 or greater, add the snippet to the chat card (otherwise will use description).",
        enabled: !foundry.utils.isNewerVersion("2.4.0", game.system.version),
      },
      {
        name: "use-actions-as-features",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features"),
        description:
          "Import D&D Beyond Actions as Features, not weapons.",
        enabled: true,
      },
      {
        name: "use-action-and-feature",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-action-and-feature"),
        description:
          "[CAUTION] If a feature is marked as an action, import both the action and the feature. This might lead to some weird behaviour.",
        enabled: true,
      },
      {
        name: "ignore-non-ddb-items",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-ignore-non-ddb-items"),
        description:
          "Ignore items on character sheet that have not been imported from D&D Beyond. This will remove items that have been removed from the DDB character since the last import, but will keep items added to the character within Foundry.",
        enabled: true,
      },
      {
        name: "use-item-containers",
        isChecked: game.modules.get("itemcollection")?.active && game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-item-containers"),
        description: "If Item Collection/Containers module is installed, put items in containers to match DDB layout",
        enabled: game.modules.get("itemcollection")?.active,
      },
      {
        name: "create-companions",
        isChecked: game.modules.get("arbron-summoner")?.active && game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions"),
        description: "[Experimental] Generate summon monster actors? (Requires item create permissions and Arbron Summoner module)",
        enabled: game.modules.get("arbron-summoner")?.active,
      },
    ];

    const advancedImportConfig = [
      {
        name: "use-override",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-override"),
        title: "Replace Items using those in your Override compendium",
        description:
          "Use existing items from <i>ddb-import Override compendium</i>, rather than parsing from DDB. This is useful if you want to place customised items into the compendium for use by characters.",
        enabled: true,
      },
      {
        name: "use-existing",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-existing"),
        title: "[Caution] Replace Items using ddb-importer compendiums",
        description:
          "Use existing items from <i>ddb-import compendiums</i>, rather than parsing from DDB. This is useful if you have customised the items in the compendium, although you will lose any custom effects applied by this module e.g. Improved Divine Smite. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd"),
        title: "[Caution] Replace Items using SRD compendiums",
        description:
          "Use the <i>SRD compendiums</i>, rather than DDB. Importing using SRD will not include features like fighting style and divine smite in damage calculations. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
    ];

    const effectImportConfig = [
      {
        name: "add-item-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-item-effects") && daeInstalled,
        title: "Generate Effects for Equipment",
        description: itemEffectText,
        enabled: daeInstalled,
      },
      {
        name: "add-spell-effects",
        isChecked: generateSpellEffects && effectModulesAvailable.hasCore,
        title: "Generate Active Effects for Spells",
        description: spellEffectText,
        enabled: effectModulesAvailable.hasCore,
      },
      {
        name: "add-character-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-character-effects") && daeInstalled,
        title: "Generate Effects for Character Features/Racial Traits/Feats/Backgrounds",
        description: featureEffectText,
        enabled: daeInstalled,
      },
      {
        name: "use-chris-premades",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades"),
        title: "Use ActiveEffects from Chris's Premades module for high automation?",
        description: `Requires Chris's Premades ${MuncherSettings.getInstalledIcon("chrisInstalled")} module. These will replace any ActiveEffects created by DDB Importer and are recommended for games aiming for high automation.`,
        enabled: chrisInstalled,
      },
      {
        name: "active-effect-copy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy"),
        title: "Retain Active Effects",
        description:
          "Retain existing Effects, this will try and transfer any existing effects on the actor such as custom effects, effects from conditions or existing spells. Untick this option if you experience <i>odd</i> behaviour.",
        enabled: true,
      },
    ];

    const effectSelectionConfig = {
      class: [
        {
          name: "effect-class-speed",
          title: "Movement",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-class-speed"),
          enabled: true,
        },
        {
          name: "effect-class-senses",
          title: "Senses",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-class-senses"),
          enabled: true,
        },
        {
          name: "effect-class-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-class-damages"),
          enabled: true,
        },
      ],
      race: [
        {
          name: "effect-race-speed",
          title: "Movement",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-race-speed"),
          enabled: true,
        },
        {
          name: "effect-race-senses",
          title: "Senses",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-race-senses"),
          enabled: true,
        },
        {
          name: "effect-race-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-race-damages"),
          enabled: true,
        },
      ],
      background: [
        {
          name: "effect-background-speed",
          title: "Movement",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-background-speed"),
          enabled: true,
        },
        {
          name: "effect-background-senses",
          title: "Senses",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-background-senses"),
          enabled: true,
        },
        {
          name: "effect-background-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-background-damages"),
          enabled: true,
        },
      ],
      feat: [
        {
          name: "effect-feat-speed",
          title: "Movement",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-feat-speed"),
          enabled: true,
        },
        {
          name: "effect-feat-senses",
          title: "Senses",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-feat-senses"),
          enabled: true,
        },
        {
          name: "effect-feat-damages",
          title: "Imm/Res/Vuln",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-effect-feat-damages"),
          enabled: true,
        },
      ],
    };

    const syncConfig = [
      {
        name: "action-use",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-action-use"),
        description: "Action Uses",
        enabled: true,
      },
      {
        name: "currency",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-currency"),
        description: "Currency",
        enabled: true,
      },
      {
        name: "deathsaves",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-deathsaves"),
        description: "Death Saves",
        enabled: true,
      },
      {
        name: "equipment",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-equipment"),
        description: "Equipment",
        enabled: true,
      },
      {
        name: "condition",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-condition"),
        description: "Exhaustion",
        enabled: true,
      },
      {
        name: "hitdice",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-hitdice"),
        description: "Hit Dice/Short Rest",
        enabled: true,
      },
      {
        name: "hitpoints",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-hitpoints"),
        description: "Hit Points",
        enabled: true,
      },
      {
        name: "inspiration",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-inspiration"),
        description: "Inspiration",
        enabled: true,
      },
      {
        name: "spells-prepared",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-prepared"),
        description: "Spells Prepared",
        enabled: true,
      },
      {
        name: "spells-slots",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-slots"),
        description: "Spell Slots",
        enabled: true,
      },
      {
        name: "spells-sync",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-sync"),
        description: "Spells Known",
        enabled: false,
      },
      {
        name: "xp",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-xp"),
        description: "XP",
        enabled: true,
      },
    ];

    const extrasConfig = [];

    const uploadDir = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
    const dataDirSet = !FileHelper.BAD_DIRS.includes(uploadDir);
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);

    const result = {
      importPolicies1,
      importPolicies2,
      importConfig,
      extrasConfig,
      advancedImportConfig,
      effectImportConfig,
      effectSelectionConfig,
      dataDirSet,
      syncConfig,
      tiers,
    };

    return result;
  },

  toggleByName(name, value = null) {
    const checkbox = document.querySelector(`input[type="checkbox"][name="${name}"]`);
    if (value === null) checkbox.checked = !checkbox.checked;
    else checkbox.checked = value;
  },

  updateActorSettings: (html, event) => {
    const selection = event.currentTarget.dataset.section;
    const checked = event.currentTarget.checked;

    logger.debug(`Updating munching-policy-${selection} to ${checked}`);
    if (selection === "add-description-to-chat") {
      game.settings.set(SETTINGS.MODULE_ID, "add-description-to-chat", checked);
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-full-description", false);
      MuncherSettings.toggleByName("character-import-policy-use-full-description", false);
      // $(html).find("#character-import-policy-use-full-description").prop("checked", false);
    } else {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-" + selection, checked);
    }

    // if (selection === "dae-copy" && checked) {
    //   $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    //   game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", false);
    // } else if (selection === "dae-effect-copy" && checked) {
    //   $(html).find("#character-import-policy-add-item-effects").prop("checked", true);
    //   game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-item-effects", true);
    //   $(html).find("#character-import-policy-add-character-effects").prop("checked", true);
    //   game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-character-effects", true);
    // }

    if (selection === "use-full-description") {
      game.settings.set(SETTINGS.MODULE_ID, "add-description-to-chat", false);
      // $(html).find("#character-import-policy-add-description-to-chat").prop("checked", false);
      MuncherSettings.toggleByName("character-import-policy-add-description-to-chat", false);
    }
  },

  getCompendiumFolderLookups: (type) => {
    const compendiumFolderSetting = game.settings.settings.get(`ddb-importer.munching-selection-compendium-folders-${type}`);
    const settingValue = game.settings.get(SETTINGS.MODULE_ID, `munching-selection-compendium-folders-${type}`);

    let selections = [];
    for (const [key, value] of Object.entries(compendiumFolderSetting.choices)) {
      selections.push({
        key: key,
        label: value,
        selected: key === settingValue,
      });
    }

    return selections;
  },

  getMuncherSettings: (includeHomebrew = true) => {
    const cobalt = getCobalt() != "";
    const betaKey = PatreonHelper.getPatreonKey() != "";
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    const effectModulesAvailable = effectModules();
    const daeInstalled = effectModulesAvailable.daeInstalled;
    const chrisInstalled = effectModulesAvailable.chrisInstalled;
    const compendiumFolderAdd = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-compendium-folders");
    const compendiumFoldersInstalled = game.modules.get("compendium-folders")?.active;
    const version11OrHigher = isNewerVersion(game.version, 11);
    const compendiumFoldersEnabled = compendiumFoldersInstalled || version11OrHigher;
    const compendiumFolderMonsterStyles = MuncherSettings.getCompendiumFolderLookups("monster");
    const compendiumFolderSpellStyles = MuncherSettings.getCompendiumFolderLookups("spell");
    const compendiumFolderItemStyles = MuncherSettings.getCompendiumFolderLookups("item");
    const advancedMacrosText = version11OrHigher ? "" : ` Advanced Macros${MuncherSettings.getInstalledIcon("advancedMacrosInstalled")},`;
    const itemMacroText = version11OrHigher ? "" : ` Item Macro${MuncherSettings.getInstalledIcon("itemMacroInstalled")}`;
    const spellEffectText = `Create ActiveEffects on spells? These ActiveEffects require the following modules and are recommended for most complete results when or if you are aiming for a highly automated game. If you are not aware of what these modules do, this setting is not recommended; please familiarize yourself with the modules beforehand: DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, ${advancedMacrosText}${itemMacroText} Times Up${MuncherSettings.getInstalledIcon("timesUp")}, and Convenient Effects${MuncherSettings.getInstalledIcon("convenientEffectsInstalled")} as a minimum. Also recommended is Active Auras${MuncherSettings.getInstalledIcon("activeAurasInstalled")}, Active Token Effects${MuncherSettings.getInstalledIcon("atlInstalled")}, Token Magic FX${MuncherSettings.getInstalledIcon("tokenMagicInstalled")}, and Automated Animations${MuncherSettings.getInstalledIcon("autoAnimationsInstalled")}.`;

    const generateSpellEffects = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-spell-effects");
    if (generateSpellEffects && !effectModulesAvailable.hasCore) {
      game.settings.set(SETTINGS.MODULE_ID, "munching-policy-add-spell-effects", false);
    }

    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const sourceArray = enableSources
      ? game.settings.get(SETTINGS.MODULE_ID, "munching-policy-muncher-sources").flat()
      : [];
    const sourcesSelected = enableSources && sourceArray.length > 0;
    const sourceNames = DDBSources.getSourcesLookups(sourceArray).filter((source) => source.selected).map((source) => source.label);
    const homebrewDescription = sourcesSelected
      ? "Include homebrew? SOURCES SELECTED! You can't import homebrew with a source filter selected"
      : "Include homebrew?";
    const sourceDescription = `Importing from the following sources only: ${sourceNames.join(", ")}`;

    const itemConfig = [
      {
        name: "use-ddb-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-item-icons"),
        description: "Use D&D Beyond item images, if available",
        enabled: true,
      },
      {
        name: "use-ddb-generic-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-generic-item-icons"),
        description: "Use D&D Beyond generic item type images, if available (final fallback)",
        enabled: true,
      },
      {
        name: "add-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-effects"),
        description: "Dynamically generate ActiveEffects (equipment only) for any equipment that modify properties of actors? (Requires DAE and is not recommended unless you are aiming for a highly automated game.)",
        enabled: daeInstalled,
      },
      {
        name: "item-homebrew",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew"),
        description: homebrewDescription,
        enabled: !sourcesSelected,
      },
      {
        name: "item-homebrew-only",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only"),
        description: "Only homebrew items?",
        enabled: !sourcesSelected,
      },
    ];

    const spellConfig = [
      {
        name: "use-ddb-spell-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-spell-icons"),
        description: "If no other icon, use the D&DBeyond spell school icon.",
        enabled: true,
      },
      {
        name: "add-spell-effects",
        isChecked: generateSpellEffects && effectModulesAvailable.hasCore,
        description: spellEffectText,
        enabled: effectModulesAvailable.hasCore,
      },
      {
        name: "spell-homebrew",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew"),
        description: homebrewDescription,
        enabled: !sourcesSelected,
      },
      {
        name: "spell-homebrew-only",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew-only"),
        description: "Only homebrew spells?",
        enabled: !sourcesSelected,
      },
    ];

    const tokenizerReady = game.modules.get("vtta-tokenizer")?.active;

    const basicMonsterConfig = [
      {
        name: "hide-description",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description"),
        description: "Hide monster action description from players?",
        enabled: true,
      },
      {
        name: "monster-items",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-items"),
        description: "[Experimental] Load attack/weapon items from DDB compendium instead of parsing action/attack? (Poor success rate)",
        enabled: true,
      },
      {
        name: "monster-use-item-ac",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-use-item-ac"),
        description: "Use AC items instead of setting a flat AC? (Recommended if using spell effects like shield on NPC's).",
        enabled: true,
      },
      {
        name: "use-full-token-image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-full-token-image"),
        description: "Use avatar image for token rather than token image (full art)",
        enabled: true,
      },
      {
        name: "use-token-avatar-image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-token-avatar-image"),
        description: "Use token image for avatar rather than avatar image (close up)",
        enabled: true,
      },
      {
        name: "use-srd-monster-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-monster-images"),
        description: "Use images from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "update-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images"),
        description: "[CAUTION] Update Monster images on existing npcs? (This will dramatically slow down re-munching).",
        enabled: true,
      },
      {
        name: "monster-tokenize",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize"),
        description: "Auto-Tokenize monsters token image? (Adds Tokenizer default token ring using the Tokenizer module.)",
        enabled: tokenizerReady,
      },
      {
        name: "monster-retain-biography",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-retain-biography"),
        description: "Should monsters retain existing biography?",
        enabled: true,
      },
      {
        name: "monster-strip-name",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-strip-name"),
        description: "Strip uses and recharge information from action names?",
        enabled: true,
      },
      {
        name: "monster-set-legendary-resource-bar",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-set-legendary-resource-bar"),
        description: "Monsters display legendary resources on bar2? (Like the SRD Monsters)",
        enabled: true,
      },
      {
        name: "add-monster-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-monster-effects"),
        description: `Generate ActiveEffects that rely on the 'Midi-QOL' module for monster attacks and features? This is only recommended if you use these modules and are aiming to set up a highly automated game: DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, Times Up${MuncherSettings.getInstalledIcon("timesUp")}, and Convenient Effects${MuncherSettings.getInstalledIcon("convenientEffectsInstalled")}.`,
        enabled: effectModulesAvailable.hasMonster,
      },
      // {
      //   name: "monster-bulk-import",
      //   isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-bulk-import"),
      //   description: "Use bulk import mode? Experimental, potentially faster. Does not preserve excluded items.",
      //   enabled: true,
      // },
    ];

    const homebrewMonsterConfig = includeHomebrew
      ? [
        {
          name: "monster-homebrew",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew") && !sourcesSelected,
          description: homebrewDescription,
          enabled: tiers.homebrew && !sourcesSelected,
        },
        {
          name: "monster-homebrew-only",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only") && !sourcesSelected,
          description: "Homebrew monsters only? (Otherwise both)",
          enabled: tiers.homebrew && !sourcesSelected,
        },
        {
          name: "monster-exact-match",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-exact-match"),
          description: "Exact name match?",
          enabled: tiers.homebrew,
        }
      ]
      : [];

    const monsterConfig = basicMonsterConfig.concat(homebrewMonsterConfig);

    const genericConfig = [
      {
        name: "update-existing",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing"),
        description: "Update existing things.",
        enabled: true,
      },
      {
        name: "use-inbuilt-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-inbuilt-icons"),
        description: "Use icons from the inbuilt dictionary. (High coverage, recommended, fast).",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-icons"),
        description: "Use icons from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "download-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images"),
        description: "Download D&D Beyond images (takes longer and needs space).",
        enabled: true,
      },
      {
        name: "remote-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images"),
        description: "Use D&D Beyond remote images (a lot quicker)",
        enabled: true,
      },
      {
        name: "use-chris-premades",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-chris-premades"),
        description: `Use ActiveEffects from the module "Chris's Premades"? (Requires "Chris's Premades" ${MuncherSettings.getInstalledIcon("chrisInstalled")} and all its dependencies). These will replace any ActiveEffects created by DDB Importer and are recommended for games aiming for high automation.`,
        enabled: chrisInstalled,
      },
      {
        name: "use-compendium-folders",
        isChecked: compendiumFoldersEnabled ? compendiumFolderAdd : false,
        description: "Generate compendium folders. You can migrate an existing DDB Compendium in the Tools tab.",
        enabled: compendiumFoldersEnabled,
      },
      {
        name: "use-srd",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd"),
        description:
          "[CAUTION] Use SRD compendium things instead of importing. This is not recommended, and may break adventure munching functionality.",
        enabled: true,
      },
      {
        name: "exclude-legacy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy"),
        description: "Exclude legacy monsters/races from import? These are replaced by newer versions e.g. in Monsters of the Multiverse.",
        enabled: true,
      },
      {
        name: "legacy-postfix",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-legacy-postfix"),
        description: "Append (Legacy) to Legacy monster/race names? These are replaced by newer versions e.g. in Monsters of the Multiverse.",
        enabled: true,
      },
      {
        name: "use-source-filter",
        isChecked: enableSources,
        description: "Restrict import to specific source book(s)? (DDB sets this as the <i>first</i> book a monster appears in).",
        enabled: true,
      }
    ];

    const worldUpdateConfig = [
      {
        name: "update-world-monster-update-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-world-monster-update-images"),
        description: "Update Monster images?",
        enabled: true,
      },
      {
        name: "update-world-monster-retain-biography",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-world-monster-retain-biography"),
        description: "Retain existing biography?",
        enabled: true,
      },
    ];

    const resultData = {
      cobalt,
      genericConfig,
      monsterConfig,
      spellConfig,
      itemConfig,
      worldUpdateConfig,
      beta: betaKey && cobalt,
      tiers,
      compendiumFoldersEnabled,
      compendiumFolderMonsterStyles,
      compendiumFolderItemStyles,
      compendiumFolderSpellStyles,
      sourcesSelected,
      sourceDescription,
      enableSources,
      version: CONFIG.DDBI.version,
      version11OrHigher,
    };

    // console.warn(resultData);

    return resultData;
  },

  // eslint-disable-next-line complexity
  updateMuncherSettings: (html, event, dialog) => {
    const selection = event.currentTarget.dataset.section;
    const checked = event.currentTarget.checked;

    logger.debug(`Updating munching-policy-${selection} to ${checked}`);

    game.settings.set(SETTINGS.MODULE_ID, "munching-policy-" + selection, checked);

    switch (selection) {
      case "monster-homebrew": {
        if (!checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only", false);
          $("#munching-policy-monster-homebrew-only").prop("checked", false);
        }
        break;
      }
      case "monster-homebrew-only": {
        if (checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew", true);
          $("#munching-policy-monster-homebrew").prop("checked", true);
        }
        break;
      }
      case "spell-homebrew": {
        if (!checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew-only", false);
          $("#munching-policy-spell-homebrew-only").prop("checked", false);
        }
        break;
      }
      case "spell-homebrew-only": {
        if (checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew", true);
          $("#munching-policy-spell-homebrew").prop("checked", true);
        }
        break;
      }
      case "item-homebrew": {
        if (!checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only", false);
          $("#munching-policy-item-homebrew-only").prop("checked", false);
        }
        break;
      }
      case "item-homebrew-only": {
        if (checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-item-homebrew", true);
          $("#munching-policy-item-homebrew").prop("checked", true);
        }
        break;
      }
      case "remote-images": {
        if (checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-download-images", false);
          $("#munching-generic-policy-download-images").prop("checked", false);
        }
        break;
      }
      case "download-images": {
        if (checked) {
          game.settings.set(SETTINGS.MODULE_ID, "munching-policy-remote-images", false);
          $("#munching-generic-policy-remote-images").prop("checked", false);
        }
        break;
      }
      case "use-source-filter": {
        $("#munch-source-select").prop("disabled", !checked);
        $("#munch-source-div").toggleClass("ddbimporter-hidden");
        dialog.render(true);
        break;
      }
      // no default
    }
  },
};

export default MuncherSettings;
