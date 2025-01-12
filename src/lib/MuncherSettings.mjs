// import { logger } from "../_module.mjs";
import {
  logger,
  Secrets,
  FileHelper,
  PatreonHelper,
} from "./_module.mjs";
import DDBSources from "../apps/DDBSources.js";
import { SETTINGS } from "../config/_module.mjs";
import { SystemHelpers } from "../parser/lib/_module.mjs";

const MuncherSettings = {

  disableCharacterActiveEffectSettings: (html) => {
    $(html).find("#character-import-policy-add-midi-effects").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects", false);
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", false);
    $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy", false);
    $(html).find("#character-update-policy-use-chris-premades").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades", false);
  },

  setRecommendedCharacterActiveEffectSettings: (html) => {
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", !SystemHelpers.effectModules().hasCore);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", !SystemHelpers.effectModules().hasCore);
    $(html).find("#character-import-policy-add-midi-effects").prop("checked", SystemHelpers.effectModules().hasCore);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects", SystemHelpers.effectModules().hasCore);
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-dae-effect-copy", false);
    $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy", false);
    $(html).find("#character-update-policy-use-chris-premades").prop("checked", !SystemHelpers.effectModules().chrisInstalled);
    game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades", !SystemHelpers.effectModules().chrisInstalled);

  },

  getInstalledIcon: (name) => {
    return SystemHelpers.effectModules()[name] ? "<i class='fas fa-check-circle' style='color: green'></i>" : "<i class='fas fa-times-circle' style='color: red'></i> ";
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
        name: "xp",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-xp"),
        description: "XP",
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
      },
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

    const effectModulesAvailable = SystemHelpers.effectModules();
    const chrisInstalled = effectModulesAvailable.chrisInstalled;
    const generateMidiEffects = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects");
    if (generateMidiEffects && !effectModulesAvailable.hasCore) {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects", false);
    }

    const installedModulesText = `
<p>Some Active Effects do not require any external modules, many of these will be created regardless of what settings are checked here, some will need these options checked.</p>
<p>Some Active Effects need DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, and although not required, it is <em>strongly recommended</em> if generating active effects with DDB Importer.</p>
<p>The following modules are entirely optional but offer pretty animations for your spells and attacks (Automated Animations${MuncherSettings.getInstalledIcon("autoAnimationsInstalled")}). DAE${MuncherSettings.getInstalledIcon("daeInstalled")} offers several effect options that are useful but not provided by the core system. Active Auras${MuncherSettings.getInstalledIcon("activeAurasInstalled")} offers support for things like Paladin auras, as well as more automated effects for spells such as Spike Growth. Active Token Effects${MuncherSettings.getInstalledIcon("atlInstalled")} allows for effects to change tokens size and vision.</p>
<p>For games looking for high levels of automation, particularly around spells and more complex character features such as Battle Master Manoeuvres, then the "Midi-QOL" suite is required. This will allow varying degrees of automation from auto-calculating hit rolls, advantage damage, and even applying it for you (if desired).</p>
<p>For high automation games you will need some additional modules, but are otherwise not required: Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, and Times Up${MuncherSettings.getInstalledIcon("timesUp")}.</p>
`;
    // const importExtras = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-extras");

    const importConfig = [
      {
        name: "use-inbuilt-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-inbuilt-icons"),
        description: "Use icons from the inbuilt dictionary? (High coverage of items, feats, and spells).",
        enabled: true,
      },
      {
        name: "use-srd-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-srd-icons"),
        description: "Use icons from the SRD compendium? (This can take a while).",
        enabled: true,
      },
      {
        name: "use-ddb-spell-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-spell-icons"),
        description: "Use spell school icons from D&DBeyond?",
        enabled: true,
      },
      {
        name: "use-ddb-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-item-icons"),
        description: "Use equipment icons from D&DBeyond (where they exist)?",
        enabled: true,
      },
      {
        name: "use-ddb-generic-item-icons",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-ddb-generic-item-icons"),
        description: "Use D&D Beyond generic item type images, if available? (final fallback)",
        enabled: true,
      },
      {
        name: "use-combined-description",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-combined-description"),
        description: "Use short snippets? If selected will use the short snippet snippet, with the full description in a collapsed box.",
        enabled: true,
      },
      {
        name: "add-description-to-chat",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "add-description-to-chat"),
        description: "Use the short description for the chat card? (otherwise will use normal description).",
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
        name: "ignore-non-ddb-items",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-ignore-non-ddb-items"),
        description:
          "Ignore items on character sheet that have not been imported from D&D Beyond? This will remove items that have been removed from the DDB character since the last import, but will keep items added to the character within Foundry.",
        enabled: true,
      },
      {
        name: "create-companions",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-create-companions"),
        description: "Generate summon monster actors? (Requires item/actor create permissions)",
        enabled: true,
      },
    ];

    const advancedImportConfig = [
      {
        name: "add-features-to-compendiums",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-features-to-compendiums"),
        title: "[EXPERIMENTAL] Import classes/class features, species, feats and backgrounds to compendiums?",
        description:
          "Adds classes (if level20), class features, backgrounds, species, species traits, and feats to your DDB Importer compendiums.",
        enabled: true,
      },
      {
        name: "import-full-spell-list",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-import-full-spell-list"),
        title: "Import full spell list?",
        description:
          "If a Cobalt Cookie is set, import all available spells for classes such as Cleric, where spells can be changed out on a long rest.",
        enabled: true,
      },
      {
        name: "use-active-sources",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-active-sources"),
        title: "Restrict imported spells to allowed sources?",
        description:
          "Use allowed source on DDB when adding spells to character.",
        enabled: true,
      },
      {
        name: "remove-2024",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-2024"),
        title: "Remove 2024 Spells?",
        description:
          "Removes 2024 spells from character imports, and removes (Legacy) suffix on spell names.",
        enabled: true,
      },
      {
        name: "remove-legacy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-remove-legacy"),
        title: "Remove Legacy Spells?",
        description:
          "Removes legacy spells from character imports.",
        enabled: true,
      },
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
        name: "add-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-midi-effects"),
        title: "Generate MidiQOL Automation Effects?",
        description: `Generates high degree of automation Effects for MidiQOL? <br> <i>This is not recommended for new users to Foundry.</i><br> Requires MidiQOL ${MuncherSettings.getInstalledIcon("midiQolInstalled")} module.<br>These will replace any effects created by DDB Importer.`,
        enabled: effectModulesAvailable.hasCore,
      },
      {
        name: "use-chris-premades",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-use-chris-premades"),
        title: "Use Automation Effects from the Cauldron of Plentiful Resources module?",
        description: `Cauldron of Plentiful Resources ${MuncherSettings.getInstalledIcon("chrisInstalled")} offer even more automation for all aspects of D&D, but have even more pre-requisites. You should investigate and set up this module before importing with this option selected. Requires Cauldron of Plentiful Resources ${MuncherSettings.getInstalledIcon("chrisInstalled")} module.<br>These will replace any effects created by DDB Importer.`,
        enabled: chrisInstalled,
      },
      {
        name: "active-effect-copy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-active-effect-copy"),
        title: "Retain Active Effects?",
        description:
          "Retain existing Active Effects, this will try and transfer any existing effects on the actor such as custom effects, effects from conditions or existing spells. Untick this option if you experience <i>odd</i> behaviour.",
        enabled: true,
      },
    ];

    const syncConfig = [
      {
        name: "action-use",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "sync-policy-action-use"),
        description: "Action Uses (Currently unavailable for this version of DDB Importer)",
        enabled: false,
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
        description: "Conditions/Exhaustion",
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
      installedModulesText,
      importPolicies1,
      importPolicies2,
      importConfig,
      extrasConfig,
      advancedImportConfig,
      effectImportConfig,
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
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-use-combined-description", false);
      MuncherSettings.toggleByName("character-import-policy-use-combined-description", false);
    } else {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-" + selection, checked);
    }

    if (selection === "use-combined-description") {
      game.settings.set(SETTINGS.MODULE_ID, "add-description-to-chat", false);
      MuncherSettings.toggleByName("character-import-policy-add-description-to-chat", false);
    }

    if (selection === "remove-2024" && checked) {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-remove-legacy", false);
      MuncherSettings.toggleByName("character-import-policy-remove-legacy", false);
    } else if (selection === "remove-legacy" && checked) {
      game.settings.set(SETTINGS.MODULE_ID, "character-update-policy-remove-2024", false);
      MuncherSettings.toggleByName("character-import-policy-remove-2024", false);
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
These require the following modules: DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}, and Times Up${MuncherSettings.getInstalledIcon("timesUp")} as a minimum.<br>
Effects can also be created to use Active Auras${MuncherSettings.getInstalledIcon("activeAurasInstalled")} and Active Token Effects${MuncherSettings.getInstalledIcon("atlInstalled")}.
`;

    const generateMidiEffects = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects");
    if (generateMidiEffects && !effectModulesAvailable.hasCore) {
      game.settings.set(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects", false);
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
        name: "add-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects"),
        description: automationText,
        enabled: effectModulesAvailable.hasCore,
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
        description: "Only import homebrew items?",
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
        name: "add-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-midi-effects"),
        description: automationText,
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
        description: "Only import homebrew spells?",
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
        description: "[Experimental] Load attack/weapon items from DDB compendium instead of parsing action/attack? (Poor success rate).",
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
        description: "Use portrait image for token rather than token image (i.e. full art).",
        enabled: true,
      },
      {
        name: "use-token-avatar-image",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-token-avatar-image"),
        description: "Use token image for portrait rather than the portrait image (i.e. close up).",
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
        name: "download-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-download-images"),
        description: "Download D&D Beyond monster images (takes longer and needs space).",
        enabled: true,
      },
      {
        name: "remote-images",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-remote-images"),
        description: "Use D&D Beyond remote monster images (a lot quicker)",
        enabled: true,
      },
      {
        name: "monster-tokenize",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-monster-tokenize"),
        description: "Auto-Tokenize monsters token image? (Adds Tokenizer default token ring using the Tokenizer module).",
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
        description: "Monsters display legendary resources on bar2? (Like the SRD Monsters).",
        enabled: true,
      },
      {
        name: "add-monster-midi-effects",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-add-monster-midi-effects"),
        description: `Generate Automation Effects that use Midi-QOL on monster attacks/features? <br>These are for a highly automated game, and are things such as managing abilities with conditions that have saves every round, or attacks which apply conditions such as frightened or prone.<br>Requires DAE${MuncherSettings.getInstalledIcon("daeInstalled")}, Midi-QOL${MuncherSettings.getInstalledIcon("midiQolInstalled")}.`,
        enabled: effectModulesAvailable.hasMonster,
      },
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
        },
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
        name: "delete-during-update",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-delete-during-update"),
        description: "Faster updates? Will delete items during updates, so they can be re-imported.",
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
        name: "use-chris-premades",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-use-chris-premades"),
        description: `Use Automation Effects from the Cauldron of Plentiful Resources module? These provide high quality automations for spells, features, monsters, etc. (Requires Cauldron of Plentiful Resources ${MuncherSettings.getInstalledIcon("chrisInstalled")} module).<br>These will replace any effects created by DDB Importer.`,
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
        name: "exclude-legacy",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-exclude-legacy"),
        description: "Exclude legacy things from import? These are replaced by newer versions e.g. in Monsters of the Multiverse, 2024 PHB.",
        enabled: true,
      },
      {
        name: "legacy-postfix",
        isChecked: game.settings.get(SETTINGS.MODULE_ID, "munching-policy-legacy-postfix"),
        description: "Append (Legacy) to Legacy names? These are replaced by newer versions e.g. in Monsters of the Multiverse, 2024 PHB.",
        enabled: true,
      },
      {
        name: "use-source-filter",
        isChecked: enableSources,
        description: "Restrict import to specific source book(s)? (DDB sets this as the <i>first</i> book a monster appears in).",
        enabled: true,
      },
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
