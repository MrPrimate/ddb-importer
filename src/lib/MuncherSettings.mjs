// import { logger } from "../_module.mjs";
import {
  logger,
  Secrets,
  FileHelper,
  PatreonHelper,
  DDBSources,
} from "./_module.mjs";
import { DICTIONARY, SETTINGS } from "../config/_module.mjs";
import { SystemHelpers } from "../parser/lib/_module.mjs";

const MuncherSettings = {

  disableCharacterActiveEffectSettings: (html) => {
    $(html).find("#character-import-policy-add-midi-effects").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects", false);
    $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy", false);
    $(html).find("#character-update-policy-use-chris-premades").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades", false);
  },

  setRecommendedCharacterActiveEffectSettings: (html) => {
    $(html).find("#character-import-policy-add-midi-effects").prop("checked", SystemHelpers.effectModules().hasCore);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects", SystemHelpers.effectModules().hasCore);
    $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy", false);
    $(html).find("#character-update-policy-use-chris-premades").prop("checked", !SystemHelpers.effectModules().chrisInstalled);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades", !SystemHelpers.effectModules().chrisInstalled);
  },

  getInstalledIcon: (name) => {
    return SystemHelpers.effectModules()[name] ? "<i class='fas fa-check-circle' style='color: green'></i>" : "<i class='fas fa-times-circle' style='color: red'></i> ";
  },

  getCharacterImportSettings: () => {
    const importPolicies = [
      {
        name: "character-update-policy-name",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-name"),
        label: "Name",
      },
      {
        name: "character-update-policy-hp",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-hp"),
        label: "HP",
      },
      {
        name: "character-update-policy-xp",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-xp"),
        label: "XP",
      },
      {
        name: "character-update-policy-hit-die",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-hit-die"),
        label: "Hit Die",
      },
      {
        name: "character-update-policy-image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-image"),
        label: "Image",
      },
      {
        name: "character-update-policy-bio",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-bio"),
        label: "Bio",
      },
      {
        name: "character-update-policy-languages",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-languages"),
        label: "Languages",
      },
      {
        name: "character-update-policy-spell-use",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-spell-use"),
        label: "Spell Slots",
      },
      {
        name: "character-update-policy-class",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-class"),
        label: "Classes",
      },
      {
        name: "character-update-policy-feat",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-feat"),
        label: "Features",
      },
      {
        name: "character-update-policy-weapon",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-weapon"),
        label: "Weapons",
      },
      {
        name: "character-update-policy-equipment",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-equipment"),
        label: "Other Equipment",
      },
      {
        name: "character-update-policy-currency",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-currency"),
        label: "Currency",
      },
      {
        name: "character-update-policy-spell",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-spell"),
        label: "Spells",
      },
    ];

    const effectModulesAvailable = SystemHelpers.effectModules();
    const chrisInstalled = effectModulesAvailable.chrisInstalled;
    const generateMidiEffects = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects");
    if (generateMidiEffects && !effectModulesAvailable.hasCore) {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects", false);
    }

    const installedModulesText = `
<p>Some Active Effects do not require any external modules, many of these will be created regardless of what settings are checked here, some will need these options checked.</p>
<p>Some Active Effects need DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, and although not required, it is <em>strongly recommended</em> if generating active effects with DDB Importer.</p>
<p>The following modules are entirely optional but offer pretty animations for your spells and attacks (Automated Animations${MuncherSettings.getInstalledIcon("autoAnimationsInstalled")}). DAE${MuncherSettings.getInstalledIcon("daeInstalled")} offers several effect options that are useful but not provided by the core system. Active Auras${MuncherSettings.getInstalledIcon("activeAurasInstalled")} or Aura Effects${MuncherSettings.getInstalledIcon("auraeffectsInstalled")} offers support for things like Paladin auras, as well as more automated effects for spells such as Spike Growth. Active Token Effects${MuncherSettings.getInstalledIcon("atlInstalled")} allows for effects to change tokens size and vision.</p>
<p>For games looking for high levels of automation, particularly around spells and more complex character features such as Battle Master Manoeuvres, then the "Midi-QOL" suite is required. This will allow varying degrees of automation from auto-calculating hit rolls, advantage damage, and even applying it for you (if desired).</p>
<p>For high automation games you will need some additional modules, but are otherwise not required: Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, and Times Up${MuncherSettings.getInstalledIcon("timesUpInstalled")}.</p>
`;
    // const importExtras = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-extras");

    const importConfig = [
      {
        name: "character-update-policy-use-inbuilt-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-inbuilt-icons"),
        label: "Use Inbuilt Icons",
        hint: "Use icons from the inbuilt dictionary? (High coverage of items, feats, and spells).",
        enabled: true,
      },
      {
        name: "character-update-policy-use-srd-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd-icons"),
        label: "Use SRD Icons",
        hint: "Use icons from the SRD compendium? (This can take a while).",
        enabled: true,
      },
      {
        name: "character-update-policy-use-ddb-spell-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-spell-icons"),
        label: "Use DDB Spell School Icons",
        hint: "Use spell school icons from D&DBeyond?",
        enabled: true,
      },
      {
        name: "character-update-policy-use-ddb-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-item-icons"),
        label: "Use D&DBeyond equipment icons?",
        hint: "Use equipment icons from D&DBeyond where they exist?",
        enabled: true,
      },
      {
        name: "character-update-policy-use-ddb-generic-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-generic-item-icons"),
        label: "Use D&DBeyond generic item icons?",
        hint: "Use D&D Beyond generic item type images, if available? (final fallback)",
        enabled: true,
      },
      {
        name: "character-update-policy-use-combined-description",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-combined-description"),
        label: "Use short snippets?",
        hint: "If selected will use the short snippet snippet, with the full description in a collapsed box.",
        enabled: true,
      },
      {
        name: "add-description-to-chat",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "add-description-to-chat"),
        label: "Use short description for chat?",
        hint: "Use the short description for the chat card? (otherwise will use normal description).",
        enabled: true,
      },
      // {
      //   name: "use-actions-as-features",
      //   isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-actions-as-features"),
      //   description:
      //     "Import D&D Beyond Actions as Features, not weapons.",
      //   enabled: true,
      // },
      // {
      //   name: "use-action-and-feature",
      //   isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-action-and-feature"),
      //   description:
      //     "[CAUTION] If a feature is marked as an action, import both the action and the feature. This might lead to some weird behaviour.",
      //   enabled: true,
      // },
      {
        name: "character-update-policy-ignore-non-ddb-items",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-ignore-non-ddb-items"),
        label: "Ignore non-DDB items?",
        hint:
          "Ignore items on character sheet that have not been imported from D&D Beyond? This will remove items that have been removed from the DDB character since the last import, but will keep items added to the character within Foundry.",
        enabled: true,
      },
      {
        name: "character-update-policy-create-companions",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions"),
        label: "Generate companion actors?",
        hint: "Generate summon monster actors? (Requires item/actor create permissions)",
        enabled: true,
      },
    ];

    const sourcesConfig = [
      {
        name: "character-update-policy-import-full-spell-list",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-full-spell-list"),
        label: "Import full spell list?",
        hint:
          "If a Cobalt Cookie is set, import all available spells for prepared casters classes such as Clerics, where spells can be changed out on a long rest.",
        enabled: true,
      },
      {
        name: "character-update-policy-import-all-cantrips",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-all-cantrips"),
        label: "Import all cantrips for 2024 Wizard?",
        hint:
          "2024 Wizards can change a cantrip per long rest, import all available cantrips (respects other source settings on this page).",
        enabled: true,
      },
      {
        name: "character-update-policy-use-active-sources",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-active-sources"),
        label: "Restrict imported spells to allowed sources?",
        hint:
          "Use allowed source on DDB when adding spells to character.",
        enabled: true,
      },
      {
        name: "character-update-policy-remove-2024",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-2024"),
        label: "Remove 2024 Spells?",
        hint:
          "Removes 2024 spells from character imports, and removes (Legacy) suffix on spell names.",
        enabled: true,
      },
      {
        name: "character-update-policy-remove-legacy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-legacy"),
        label: "Remove Legacy Spells?",
        hint:
          "Removes legacy spells from character imports.",
        enabled: true,
      },
    ];

    const compendiumSourcesConfig = [
      {
        name: "character-update-policy-use-override",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-override"),
        label: "Replace Items using those in your Override compendium",
        hint:
          "Use existing items from <i>ddb-import Override compendium</i>, rather than parsing from DDB. This is useful if you want to place customised items into the compendium for use by characters.",
        enabled: true,
      },
      {
        name: "character-update-policy-use-existing",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-existing"),
        label: "[Caution] Replace Items using ddb-importer compendiums",
        hint:
          "Use existing items from <i>ddb-import compendiums</i>, rather than parsing from DDB. This is useful if you have customised the items in the compendium, although you will lose any custom effects applied by this module e.g. Improved Divine Smite. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
      {
        name: "character-update-policy-use-srd",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd"),
        label: "[Caution] Replace Items using SRD compendiums",
        hint:
          "Use the <i>SRD compendiums</i>, rather than DDB. Importing using SRD will not include features like fighting style and divine smite in damage calculations. Please consider marking the item you wish to keep as ignored by import instead.",
        enabled: true,
      },
    ];

    const experimentalConfig = [
      {
        name: "character-update-policy-add-features-to-compendiums",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-features-to-compendiums"),
        label: "[EXPERIMENTAL] Import features to compendiums?",
        hint:
          "Adds classes (if level20), class features, backgrounds, species, species traits, and feats to your DDB Importer compendiums.",
        enabled: true,
      },
    ];

    const effectImportConfig = [
      {
        name: "character-update-policy-add-midi-effects",
        isChecked: effectModulesAvailable.hasCore && game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects"),
        label: "Generate MidiQOL Automation Effects?",
        hint: `Generates high degree of automation Effects for MidiQOL? <br> <i>This is not recommended for new users to Foundry.</i><br> Requires MidiQOL ${MuncherSettings.getInstalledIcon("midiQolInstalled")} module.<br>These will replace any effects created by DDB Importer.`,
        enabled: effectModulesAvailable.hasCore,
      },
      {
        name: "character-update-policy-use-chris-premades",
        isChecked: chrisInstalled && game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades"),
        label: "Use Automation Effects from the Cauldron of Plentiful Resources module?",
        hint: `Cauldron of Plentiful Resources ${MuncherSettings.getInstalledIcon("chrisInstalled")} offer even more automation for all aspects of D&D, but have even more pre-requisites. You should investigate and set up this module before importing with this option selected. Requires Cauldron of Plentiful Resources ${MuncherSettings.getInstalledIcon("chrisInstalled")} module.<br>These will replace any effects created by DDB Importer.`,
        enabled: chrisInstalled,
      },
      {
        name: "character-update-policy-active-effect-copy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy"),
        label: "Retain Active Effects?",
        hint:
          "Retain existing Active Effects, this will try and transfer any existing effects on the actor such as custom effects, effects from conditions or existing spells. Untick this option if you experience <i>odd</i> behaviour.",
        enabled: true,
      },
    ];

    const syncConfig = [
      {
        name: "sync-policy-action-use",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-action-use"),
        label: "Action Uses",
        enabled: false,
      },
      {
        name: "sync-policy-currency",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-currency"),
        label: "Currency",
        enabled: true,
      },
      {
        name: "sync-policy-deathsaves",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-deathsaves"),
        label: "Death Saves",
        enabled: true,
      },
      {
        name: "sync-policy-equipment",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-equipment"),
        label: "Equipment",
        enabled: true,
      },
      {
        name: "sync-policy-condition",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-condition"),
        label: "Conditions/Exhaustion",
        enabled: true,
      },
      {
        name: "sync-policy-hitdice",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-hitdice"),
        label: "Hit Dice/Short Rest",
        enabled: true,
      },
      {
        name: "sync-policy-hitpoints",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-hitpoints"),
        label: "Hit Points",
        enabled: true,
      },
      {
        name: "sync-policy-inspiration",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-inspiration"),
        label: "Inspiration",
        enabled: true,
      },
      {
        name: "sync-policy-spells-prepared",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-prepared"),
        label: "Spells Prepared",
        enabled: true,
      },
      {
        name: "sync-policy-spells-slots",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-slots"),
        label: "Spell Slots",
        enabled: true,
      },
      {
        name: "sync-policy-spells-sync",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-spells-sync"),
        label: "Spells Known",
        enabled: false,
      },
      {
        name: "sync-policy-xp",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-xp"),
        label: "XP",
        enabled: true,
      },
    ];

    const extrasConfig = [];

    const uploadDir = game.settings.get(SETTINGS.MODULE_ID, "image-upload-directory");
    const dataDirSet = !FileHelper.BAD_DIRS.includes(uploadDir);
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);

    const result = {
      installedModulesText,
      importPolicies,
      importConfig,
      extrasConfig,
      sourcesConfig,
      experimentalConfig,
      effectImportConfig,
      compendiumSourcesConfig,
      dataDirSet,
      syncConfig,
      tiers,
      version: CONFIG.DDBI.version,
    };

    return result;
  },


  updateActorSettings: async (html, event) => {
    const selection = event.currentTarget.dataset.section;
    const checked = event.currentTarget.checked;

    await game.settings.set(SETTINGS.MODULE_ID, selection, checked);

    logger.debug(`Updating munching-policy-${selection} to ${checked}`);

    switch (selection) {
      case "character-update-policy-add-description-to-chat": {
        await game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-description-to-chat", checked);
        await game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-combined-description", false);
        $("#character-import-policy-use-combined-description").prop("checked", false);
        break;
      }
      case "character-update-policy-use-combined-description": {
        await game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-description-to-chat", false);
        $("#character-import-policy-add-description-to-chat").prop("checked", false);
        break;
      }
      case "character-update-policy-remove-2024": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-remove-legacy", false);
          $("#character-import-policy-remove-legacy").prop("checked", false);
        }
        break;
      }
      case "character-update-policy-remove-legacy": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-remove-2024", false);
          $("#character-import-policy-remove-2024").prop("checked", false);
        }
        break;
      }
      // no default
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
    const cobalt = Secrets.getCobalt() != "";
    const betaKey = PatreonHelper.getPatreonKey() != "";
    const tier = PatreonHelper.getPatreonTier();
    const tiers = PatreonHelper.calculateAccessMatrix(tier);
    const effectModulesAvailable = SystemHelpers.effectModules();
    const campaignId = game.settings.get(SETTINGS.MODULE_ID, "campaign-id");
    const isCampaign = campaignId && campaignId !== "";
    const chrisInstalled = effectModulesAvailable.chrisInstalled;
    const compendiumFolderMonsterStyles = MuncherSettings.getCompendiumFolderLookups("monster");
    const compendiumFolderSpellStyles = MuncherSettings.getCompendiumFolderLookups("spell");
    const compendiumFolderItemStyles = MuncherSettings.getCompendiumFolderLookups("item");
    const automationText = `Create MidiQoL Automation Effects for spells?<br>
<i>This is not recommended for new Foundry users.</i><br>
This applies some automation to the items, but do require the use of a number of external modules, including "Midi-QOL", which potentially introduces a much higher level of automation and complexity above the base Foundry system.<br>
These require the following modules: DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, and Times Up${MuncherSettings.getInstalledIcon("timesUpInstalled")} as a minimum.<br>
Effects can also be created to use Active Auras${MuncherSettings.getInstalledIcon("activeAurasInstalled")} or Aura Effects${MuncherSettings.getInstalledIcon("auraeffectsInstalled")}, and Active Token Effects${MuncherSettings.getInstalledIcon("atlInstalled")}.
`;

    const generateMidiEffects = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects");
    if (generateMidiEffects && !effectModulesAvailable.hasCore) {
      game.settings.set(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects", false);
    }

    const enableSources = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-source-filter");
    const sourceArray = enableSources
      ? DDBSources.getSelectedSourceIds()
      : [];
    const sourcesSelected = enableSources && sourceArray.length > 0;
    const sourceNames = MuncherSettings.getSourcesLookups().filter((source) => source.selected).map((source) => source.label);
    const homebrewDescription = sourcesSelected
      ? "Include homebrew? SOURCES SELECTED! You can't import homebrew with a source filter selected"
      : "Include homebrew?";
    const sourceDescription = `Importing from the following sources only: ${sourceNames.join(", ")}`;

    const itemConfig = [
      {
        name: "munching-policy-use-ddb-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-item-icons"),
        label: "Use DDB Item Images?",
        hint: "Use D&D Beyond item images, if available",
        enabled: true,
      },
      {
        name: "munching-policy-use-ddb-generic-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-generic-item-icons"),
        label: "Use DDB Generic Item Images?",
        hint: "Use D&D Beyond generic item type images, if available (final fallback)",
        enabled: true,
      },
      {
        name: "munching-policy-add-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects"),
        label: "Use MidiQOL Automation Effects?",
        hint: automationText,
        enabled: effectModulesAvailable.hasCore,
      },
      {
        name: "munching-policy-item-homebrew",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew"),
        label: "Include homebrew?",
        hint: homebrewDescription,
        enabled: !sourcesSelected,
      },
      {
        name: "munching-policy-item-homebrew-only",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only"),
        label: "Only import homebrew items?",
        hint: "Excludes non-homebrew items",
        enabled: !sourcesSelected,
      },
    ];

    const spellConfig = [
      {
        name: "munching-policy-use-ddb-spell-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-ddb-spell-icons"),
        label: "Use DDB Spell School Images?",
        hint: "If no other icon, use the D&DBeyond spell school icon.",
        enabled: true,
      },
      {
        name: "munching-policy-add-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects"),
        label: "Use MidiQOL Automation Effects?",
        hint: automationText,
        enabled: effectModulesAvailable.hasCore,
      },
      {
        name: "munching-policy-spell-homebrew",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew"),
        label: "Include homebrew?",
        hint: homebrewDescription,
        enabled: !sourcesSelected,
      },
      {
        name: "munching-policy-spell-homebrew-only",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew-only"),
        label: "Only import homebrew spells?",
        hint: "Excludes non-homebrew spells",
        enabled: !sourcesSelected,
      },
    ];

    const tokenizerReady = game.modules.get("vtta-tokenizer")?.active;

    const basicMonsterConfig = [
      {
        name: "munching-policy-hide-description",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-hide-description"),
        label: "Hide monster actions?",
        hint: "Hides monster action description from players in chat.",
        enabled: true,
      },
      // temporarily disabled
      // {
      //   name: "monster-items",
      //   isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-items"),
      //   description: "[Experimental] Load attack/weapon items from DDB compendium instead of parsing action/attack? (Poor success rate).",
      //   enabled: true,
      // },
      {
        name: "munching-policy-monster-use-item-ac",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-use-item-ac"),
        label: "Use item AC?",
        hint: "Use AC items instead of setting a flat AC? (Recommended if using spell effects like shield on NPC's).",
        enabled: true,
      },
      {
        name: "munching-policy-monster-retain-biography",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-retain-biography"),
        label: "Retain existing biography?",
        hint: "Should monsters retain existing biography?",
        enabled: true,
      },
      {
        name: "munching-policy-monster-strip-name",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-strip-name"),
        label: "Clean name?",
        hint: "Strip uses and recharge information from action names?",
        enabled: true,
      },
      {
        name: "munching-policy-monster-set-legendary-resource-bar",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-set-legendary-resource-bar"),
        label: "Set legendary resource bar?",
        hint: "Monsters display legendary resources on bar2? (Like the SRD Monsters).",
        enabled: true,
      },
      {
        name: "munching-policy-add-monster-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-monster-midi-effects"),
        label: "Use MidiQOL Automation Effects?",
        hint: `Generate Automation Effects that use Midi-QOL on monster attacks/features? <br>These are for a highly automated game, and are things such as managing abilities with conditions that have saves every round, or attacks which apply conditions such as frightened or prone.<br>Requires DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")} and Times Up${MuncherSettings.getInstalledIcon("timesUpInstalled")}.`,
        enabled: effectModulesAvailable.hasMonster,
      },
    ];

    const artMonsterConfig = [
      {
        name: "munching-policy-use-full-token-image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-full-token-image"),
        label: "Portrait Image for Token",
        hint: "Use portrait image for token rather than token image (i.e. full art).",
        enabled: true,
      },
      {
        name: "munching-policy-use-token-avatar-image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-token-avatar-image"),
        label: "Token for Portrait Image",
        hint: "Use token image for portrait rather than the portrait image (i.e. close up).",
        enabled: true,
      },
      {
        name: "munching-policy-use-srd-monster-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-monster-images"),
        label: "Use SRD images?",
        hint: "Use images from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "munching-policy-update-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-images"),
        label: "[CAUTION] Update Monster images on existing npcs?",
        hint: "Update Monster images on existing npcs? (This will dramatically slow down re-munching).",
        enabled: true,
      },
      {
        name: "munching-policy-download-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images"),
        label: "Download D&D Beyond monster images?",
        hint: "Download D&D Beyond monster images (takes longer and needs space). Otherwise uses DDB CDN images. (Token images are always downloaded).",
        enabled: true,
      },
      {
        name: "munching-policy-remote-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images"),
        label: "Use D&D Beyond remote images?",
        hint: "Use D&D Beyond remote monster images (a lot quicker). (Token images are always downloaded).",
        enabled: true,
      },
      {
        name: "munching-policy-monster-tokenize",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize"),
        label: "Auto-Tokenize monsters?",
        hint: "Adds Tokenizer default token ring using the Tokenizer module to monster tokens.",
        enabled: tokenizerReady,
      },
    ];

    const homebrewMonsterConfig = includeHomebrew
      ? [
        {
          name: "munching-policy-monster-homebrew",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew") && !sourcesSelected,
          label: "Include Homebrew Monsters?",
          hint: homebrewDescription,
          enabled: tiers.homebrew && !sourcesSelected,
        },
        {
          name: "munching-policy-monster-homebrew-only",
          isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only") && !sourcesSelected,
          label: "Homebrew monsters only?",
          hint: "Only imports homebrew monsters.",
          enabled: tiers.homebrew && !sourcesSelected,
        },

      ]
      : [];

    const filterMonsterConfig = [
      {
        name: "munching-policy-monster-exact-match",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-exact-match"),
        label: "Exact name match?",
        hint: "Matches the monster name exactly, otherwise will match on similar names.",
        enabled: tiers.homebrew,
      },
    ];

    const filterSpellConfig = [
      {
        name: "munching-policy-spell-exact-match",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-spell-exact-match"),
        label: "Exact name match?",
        hint: "Matches the spell name exactly, otherwise will match on similar names.",
        enabled: tiers.homebrew,
      },
    ];

    const filterItemConfig = [
      {
        name: "munching-policy-item-exact-match",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-item-exact-match"),
        label: "Exact name match?",
        hint: "Matches the item name exactly, otherwise will match on similar names.",
        enabled: tiers.homebrew,
      },
    ];

    const genericConfig = [
      {
        name: "munching-policy-update-existing",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-existing"),
        label: "Update existing things?",
        hint: "If not checked will only add new things to the compendiums, if checked will also update existing things.",
        enabled: true,
      },
      {
        name: "munching-policy-delete-during-update",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-delete-during-update"),
        label: "Faster updates?",
        hint: "Will delete items during updates, so they can be re-imported.",
        enabled: true,
      },
      {
        name: "munching-policy-use-inbuilt-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-inbuilt-icons"),
        label: "Use inbuilt icons?",
        hint: "Use icons from the inbuilt dictionary. (High coverage, recommended, fast).",
        enabled: true,
      },
      {
        name: "munching-policy-use-srd-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd-icons"),
        label: "Use SRD icons?",
        hint: "Use icons from the SRD compendiums.",
        enabled: true,
      },
      {
        name: "munching-policy-use-chris-premades",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-chris-premades"),
        label: "Cauldron of Plentiful Resources Automation?",
        hint: `Use Automation Effects from the Cauldron of Plentiful Resources module? These provide high quality automations for spells, features, monsters, etc. (Requires Cauldron of Plentiful Resources ${MuncherSettings.getInstalledIcon("chrisInstalled")} module).<br>These will replace any effects created by DDB Importer.`,
        enabled: chrisInstalled,
      },
      // {
      //   name: "use-srd",
      //   isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-srd"),
      //   description:
      //     "[CAUTION] Use SRD compendium things instead of importing. This is not recommended, and may break adventure munching functionality.",
      //   enabled: true,
      // },
      {
        name: "munching-policy-legacy-postfix",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-legacy-postfix"),
        label: "Legacy postfix?",
        hint: "Append (Legacy) to Legacy names? These are replaced by newer versions e.g. in Monsters of the Multiverse, 2024 PHB.",
        enabled: true,
      },
    ];

    const sourceConfig = [
      {
        name: "munching-policy-use-source-filter",
        isChecked: enableSources,
        label: "Use source filter?",
        hint: "Restrict import to specific source book(s)? (DDB sets this as the <i>first</i> book a monster appears in).",
        enabled: true,
      },
    ];

    const worldUpdateConfig = [
      {
        name: "munching-policy-update-world-monster-update-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-world-monster-update-images"),
        label: "Update Monster images?",
        hint: "",
        enabled: true,
      },
      {
        name: "munching-policy-update-world-monster-retain-biography",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-update-world-monster-retain-biography"),
        label: "Retain existing biography?",
        hint: "",
        enabled: true,
      },
    ];

    const excludedCategories = MuncherSettings.getExcludedCategoriesLookup();
    const bookSources = MuncherSettings.getSourcesLookups();

    const selectedSources = MuncherSettings.getSourcesLookups().map((source) => {
      const data = foundry.utils.deepClone(source);
      if (source.selected) {
        data.selected = "selected";
      } else {
        data.selected = "";
      }
      return data;
    });

    const monsterTypes = MuncherSettings.getMonsterTypeLookups();

    const adventureOptions = [
      {
        name: "adventure-policy-all-scenes",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-all-scenes"),
        label: "Import all scenes?",
        hint: "If unchecked will allow scene selections",
        enabled: true,
      },
      {
        name: "adventure-policy-all-actors-into-world",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-all-actors-into-world"),
        label: "Import all monsters in adventure to world?",
        hint: "If unchecked, will only import monsters placed on scenes.",
        enabled: tiers.supporter,
      },
      {
        name: "adventure-policy-journal-world-actors",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-journal-world-actors"),
        label: "Link journals to world actors?",
        hint: "If unchecked, will link to compendium actors.",
        enabled: true,
      },
      {
        name: "adventure-policy-add-to-compendiums",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-add-to-compendiums"),
        label: "Add Journals and Tables to Compendiums?",
        hint: "If checked will add adventure journals into the DDB Journals/Tables compendium.",
        enabled: true,
      },
      {
        name: "adventure-policy-import-to-adventure-compendium",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-import-to-adventure-compendium"),
        label: "Add Adventure to DDB Adventures Compendium?",
        hint: "If checked will add the imported adventure to the Adventures Compendium. This will not leave the adventure playable in this world. If the system or Foundry is updated, this maybe left unusable. This my leave elements remaining in the world. <i>This is not recommended if you wish to play adventures in this world.</i>",
        enabled: true,
      },
      {
        name: "adventure-policy-use2024-monsters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "adventure-policy-use2024-monsters"),
        label: "Replace legacy monsters with latest versions? (Patreon only)",
        hint: "If checked will replace legacy monsters with the latest versions from the 2024 rules. If you don't have access to these monsters, this may leave you with unlinked or missing tokens.",
        enabled: tiers.supporter,
      },
    ];

    if (!tiers.supporter) {
      game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-all-actors-into-world", false);
      game.settings.set(SETTINGS.MODULE_ID, "adventure-policy-use2024-monsters", false);
    }

    const resultData = {
      adventureOptions,
      bookSources,
      cobalt,
      genericConfig,
      sourceConfig,
      selectedSources,
      monsterTypes,
      excludedCategories,
      basicMonsterConfig,
      filterMonsterConfig,
      filterSpellConfig,
      filterItemConfig,
      artMonsterConfig,
      homebrewMonsterConfig,
      spellConfig,
      itemConfig,
      worldUpdateConfig,
      beta: betaKey && cobalt,
      tiers,
      compendiumFolderMonsterStyles,
      compendiumFolderItemStyles,
      compendiumFolderSpellStyles,
      sourcesSelected,
      sourceDescription,
      enableSources,
      version: CONFIG.DDBI.version,
      campaignId,
      isCampaign,
    };

    return resultData;
  },

  getEncounterSettings: () => {
    const encounterConfig = [
      {
        name: "encounter-import-policy-missing-characters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-characters"),
        enabled: true,
        hint: "",
        label: "Import missing characters?",
      },
      {
        name: "encounter-import-policy-missing-monsters",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-missing-monsters"),
        enabled: true,
        hint: "",
        label: "Import missing monsters?",
      },
      {
        name: "encounter-import-policy-create-journal",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-journal"),
        enabled: true,
        hint: "",
        label: "Create encounter journal entry?",
      },
      {
        name: "encounter-import-policy-use-ddb-save",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-use-ddb-save"),
        enabled: false,
        hint: "HP for monsters and initiative for all",
        label: "Use save information from Encounter?",
      },
      {
        name: "encounter-import-policy-create-scene",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene"),
        enabled: true,
        hint: "Also adds available characters and NPC's",
        label: "Create/update a scene?",
      },
      {
        name: "encounter-import-policy-existing-scene",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene"),
        enabled: true,
        hint: "",
        label: "Use an existing scene?",
      },
    ];

    const scenes = game.scenes.filter((scene) => !scene.flags?.ddbimporter?.encounters)
      .map((scene) => {
        const folderName = scene.folder ? `[${scene.folder.name}] ` : "";
        const s = {
          name: `${folderName}${scene.name}`,
          id: scene.id,
        };
        return s;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const encounterSettings = {
      encounterConfig,
      scenes,
      sceneImg: DICTIONARY.encounters.SCENE_IMG,
      createSceneSelect: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene"),
      existingSceneSelect: game.settings.get(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene"),
    };

    return encounterSettings;
  },

  getSourcesLookups: (overrideSelected = null) => {
    const selected = (overrideSelected ?? DDBSources.getSelectedSourceIds()).map((id) => parseInt(id));
    const selections = DDBSources.getDisplaySources()
      .map((source) => {
        const details = {
          id: source.id,
          acronym: source.name,
          label: source.description,
          selected: selected.includes(source.id),
        };
        return details;
      });

    return selections.sort((a, b) => {
      return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
    });
  },

  getMonsterTypeLookups: () => {
    const chosenMonsterTypeIds = DDBSources.getSelectedMonsterTypeIds();
    const monsterTypes = CONFIG.DDB.monsterTypes;

    const monsterTypeSelections = monsterTypes.map((type) => {
      return {
        id: type.id,
        selected: chosenMonsterTypeIds.includes(type.id) ? "selected" : "",
        label: type.name,
      };
    });
    return monsterTypeSelections.sort((a, b) => {
      return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
    });
  },

  getExcludedCategoriesLookup: () => {
    const excludedCatIds = DDBSources.getExcludedCategoryIds();
    const availableCats = DDBSources.getDisplaySourceCategories();

    const excludedCategories = availableCats.map((cat) => {
      return {
        id: cat.id,
        selected: excludedCatIds.includes(cat.id) ? "selected" : "",
        label: cat.name,
      };
    });
    return excludedCategories.sort((a, b) => {
      return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
    });
  },

  // eslint-disable-next-line complexity
  updateMuncherSettings: async (_html, event) => {
    const selection = event.target.dataset.section;
    const checked = event.target.checked;
    logger.debug(`Updating ${selection} to ${checked}`);

    await game.settings.set(SETTINGS.MODULE_ID, selection, checked);

    switch (selection) {
      case "encounter-import-policy-create-scene": {
        await game.settings.set(SETTINGS.MODULE_ID, "encounter-import-policy-existing-scene", false);
        if (checked) $("#encounter-scene-select").prop("disabled", true);
        $("#encounter-import-policy-existing-scene").prop('checked', false);
        break;
      }
      case "encounter-import-policy-existing-scene": {
        await game.settings.set(SETTINGS.MODULE_ID, "encounter-import-policy-create-scene", false);
        if (checked) $("#encounter-scene-img-select").prop("disabled", true);
        $("#encounter-import-policy-create-scene").prop('checked', false);
        break;
      }
      case "munching-policy-monster-homebrew": {
        if (!checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew-only", false);
          $("#munching-policy-monster-homebrew-only").prop("checked", false);
        }
        break;
      }
      case "munching-policy-monster-homebrew-only": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-monster-homebrew", true);
          $("#munching-policy-monster-homebrew").prop("checked", true);
        }
        break;
      }
      case "munching-policy-spell-homebrew": {
        if (!checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew-only", false);
          $("#munching-policy-spell-homebrew-only").prop("checked", false);
        }
        break;
      }
      case "munching-policy-spell-homebrew-only": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-spell-homebrew", true);
          $("#munching-policy-spell-homebrew").prop("checked", true);
        }
        break;
      }
      case "munching-policy-item-homebrew": {
        if (!checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-item-homebrew-only", false);
          $("#munching-policy-item-homebrew-only").prop("checked", false);
        }
        break;
      }
      case "munching-policy-item-homebrew-only": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-item-homebrew", true);
          $("#munching-policy-item-homebrew").prop("checked", true);
        }
        break;
      }
      case "munching-policy-remote-images": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-download-images", false);
          $("#munching-generic-policy-download-images").prop("checked", false);
        }
        break;
      }
      case "munching-policy-download-images": {
        if (checked) {
          await game.settings.set(SETTINGS.MODULE_ID, "munching-policy-remote-images", false);
          $("#munching-generic-policy-remote-images").prop("checked", false);
        }
        break;
      }
      case "munching-policy-use-source-filter": {
        $("#munch-source-div").toggleClass("ddbimporter-hidden");
        break;
      }
      // no default
    }
  },
};

export default MuncherSettings;
