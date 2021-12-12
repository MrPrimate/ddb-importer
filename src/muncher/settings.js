// import logger from "../logger.js";
import utils from "../utils.js";
import logger from "../logger.js";
import { getPatreonTiers } from "./utils.js";
import { getCobalt } from "../lib/Secrets.js";

function autoACDisableEffects() {
  const AUTO_AC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;
  if (AUTO_AC) {
    game.settings.set("ddb-importer", "character-update-policy-generate-ac-armor-effects", false);
    game.settings.set("ddb-importer", "character-update-policy-generate-base-ac", false);
    game.settings.set("ddb-importer", "character-update-policy-generate-ac-override-effects", false);
  }
}

export function setRecommendedCharacterActiveEffectSettings(html) {
  $(html).find("#character-import-policy-dae-copy").prop("checked", false);
  game.settings.set("ddb-importer", "character-update-policy-dae-copy", false);
  $(html).find("#character-import-policy-dae-effect-copy").prop("checked", true);
  game.settings.set("ddb-importer", "character-update-policy-dae-effect-copy", true);
  $(html).find("#character-import-policy-add-item-effects").prop("checked", true);
  game.settings.set("ddb-importer", "character-update-policy-add-item-effects", true);
  $(html).find("#character-import-policy-add-character-effects").prop("checked", true);
  game.settings.set("ddb-importer", "character-update-policy-add-character-effects", true);
  $(html).find("#character-import-policy-generate-ac-feature-effects").prop("checked", true);
  game.settings.set("ddb-importer", "character-update-policy-generate-ac-feature-effects", true);
  $(html).find("#character-import-policy-active-effect-copy").prop("checked", false);
  game.settings.set("ddb-importer", "character-update-policy-active-effect-copy", false);

  const AUTO_AC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;
  if (AUTO_AC) {
    autoACDisableEffects();
  } else {
    $(html).find("#character-import-policy-generate-ac-armor-effects").prop("checked", true);
    game.settings.set("ddb-importer", "character-update-policy-generate-ac-armor-effects", true);
    $(html).find("#character-import-policy-generate-base-ac").prop("checked", true);
    game.settings.set("ddb-importer", "character-update-policy-generate-base-ac", true);
    $(html).find("#character-import-policy-generate-ac-override-effects").prop("checked", false);
    game.settings.set("ddb-importer", "character-update-policy-generate-ac-override-effects", false);
  }

  ["class", "race", "background", "feat"].forEach((type) => {
    $(html).find(`#character-import-policy-effect-${type}-spell-bonus`).prop("checked", true);
    game.settings.set("ddb-importer", `character-update-policy-effect-${type}-spell-bonus`, true);
    $(html).find(`#character-import-policy-effect-${type}-speed`).prop("checked", false);
    game.settings.set("ddb-importer", `character-update-policy-effect-${type}-speed`, false);
    $(html).find(`#character-import-policy-effect-${type}-senses`).prop("checked", false);
    game.settings.set("ddb-importer", `character-update-policy-effect-${type}-senses`, false);
    $(html).find(`#character-import-policy-effect-${type}-hp`).prop("checked", false);
    game.settings.set("ddb-importer", `character-update-policy-effect-${type}-hp`, false);
    $(html).find(`#character-import-policy-effect-${type}-damages`).prop("checked", false);
    game.settings.set("ddb-importer", `character-update-policy-effect-${type}-damages`, false);
  });
}

export function getCharacterImportSettings() {
  const AUTO_AC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;
  autoACDisableEffects();

  const importPolicies = [
    {
      name: "name",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-name"),
      description: "Name",
    },
    {
      name: "hp",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-hp"),
      description: "HP",
    },
    {
      name: "hit-die",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-hit-die"),
      description: "Hit Die",
    },
    {
      name: "class",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-class"),
      description: "Classes",
    },
    {
      name: "feat",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-feat"),
      description: "Features",
    },
    {
      name: "weapon",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-weapon"),
      description: "Weapons",
    },
    {
      name: "equipment",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-equipment"),
      description: "Other Equipment",
    },
    {
      name: "currency",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-currency"),
      description: "Currency",
    },
    {
      name: "spell",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-spell"),
      description: "Spells",
    },
    {
      name: "image",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-image"),
      description: "Image",
    },
    {
      name: "bio",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-bio"),
      description: "Bio",
    },
  ];

  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const daeSRDInstalled = utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");
  const midiSRDInstalled = utils.isModuleInstalledAndActive("midi-srd");
  const daeSRDContentAvailable = daeSRDInstalled || midiSRDInstalled;

  // const importExtras = game.settings.get("ddb-importer", "character-update-policy-import-extras");

  const importConfig = [
    {
      name: "use-inbuilt-icons",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-inbuilt-icons"),
      description: "Use icons from the inbuilt dictionary. (High coverage of items, feats, and spells).",
      enabled: true,
    },
    {
      name: "use-srd-icons",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd-icons"),
      description: "Use icons from the SRD compendium. (This can take a while).",
      enabled: true,
    },
    {
      name: "use-ddb-spell-icons",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-ddb-spell-icons"),
      description: "Use spell school icons from D&DBeyond.",
      enabled: true,
    },
    {
      name: "use-ddb-item-icons",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-ddb-item-icons"),
      description: "Use equipment icons from D&DBeyond (where they exist).",
      enabled: true,
    },
    {
      name: "use-ddb-generic-item-icons",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-ddb-generic-item-icons"),
      description: "Use D&D Beyond generic item type images, if available (final fallback)",
      enabled: true,
    },
    {
      name: "use-full-description",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-full-description"),
      description: "For actions use full description and snippets, else use snippets only.",
      enabled: true,
    },
    {
      name: "use-actions-as-features",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-actions-as-features"),
      description:
        "Import D&D Beyond Actions as Features, not weapons.",
      enabled: true,
    },
    {
      name: "use-action-and-feature",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-action-and-feature"),
      description:
        "[CAUTION] If a feature is marked as an action, import both the action and the feature. This might lead to some weird behaviour.",
      enabled: true,
    },
  ];

  const advancedImportConfig = [
    {
      name: "use-override",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-override"),
      title: "Replace Items using those in your Override compendium",
      description:
        "Use existing items from <i>ddb-import Override compendium</i>, rather than parsing from DDB. This is useful if you want to place customised items into the compendium for use by characters.",
      enabled: true,
    },
    {
      name: "use-existing",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-existing"),
      title: "[Caution] Replace Items using ddb-importer compendiums",
      description:
        "Use existing items from <i>ddb-import compendiums</i>, rather than parsing from DDB. This is useful if you have customised the items in the compendium, although you will lose any custom effects applied by this module e.g. Improved Divine Smite. Please consider marking the item you wish to keep as ignored by import instead.",
      enabled: true,
    },
    {
      name: "use-srd",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-use-srd"),
      title: "[Caution] Replace Items using SRD compendiums",
      description:
        "Use the <i>SRD compendiums</i>, rather than DDB. Importing using SRD will not include features like fighting style and divine smite in damage calculations. Please consider marking the item you wish to keep as ignored by import instead.",
      enabled: true,
    },
  ];

  const effectImportConfig1 = [
    {
      name: "add-item-effects",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-add-item-effects") && daeInstalled,
      title: "Generate Active Effects for Equipment",
      description:
        "Dynamically generate active effects for a characters equipment, doesn't include AC effects on armor, but will for things like the Ring of Protection.",
      enabled: daeInstalled,
    },
    {
      name: "add-character-effects",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-add-character-effects") && daeInstalled,
      title: "Generate Active Effects for Character Features/Racial Traits/Feats/Backgrounds",
      description:
        "Dynamically generate active effects for a character. Some effects are always generated, some are optional (see below).",
      enabled: daeInstalled,
    },
  ];
  const effectImportConfig2 = AUTO_AC
  ? []
  : [
    {
      name: "generate-ac-armor-effects",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-generate-ac-armor-effects") && daeInstalled,
      title: "Generate Active Effects ACs for Armor",
      description:
        "Dynamically add AC values as dynamic effects to armor items. If you're using DAE to auto-calculate AC, you don't need this.",
      enabled: daeInstalled && !AUTO_AC,
    },
  ];
  const effectImportConfig3 = [
    {
      name: "generate-ac-feature-effects",
      isChecked:
        game.settings.get("ddb-importer", "character-update-policy-generate-ac-feature-effects") && daeInstalled,
      title: "Generate DAE Active Effects ACs for Character Features & Racial Traits",
      description:
        "Use extras in DAE to Dynamically add AC values as dynamic effects to items, this might not work as expected for some AC calculations. If unticked some ac bonuses will still be generated.",
      enabled: daeInstalled,
    },
  ];
  const effectImportConfig4 = AUTO_AC
  ? []
  : [
    {
      name: "generate-base-ac",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-generate-base-ac"),
      title: "Set AC to base value",
      description:
        "Calculate AC base to base value, e.g. 10 +dex mod/natural armor rating. Useful if you want the AC to be correct when Armor is unequipped.",
      enabled: !AUTO_AC,
    },
    {
      name: "generate-ac-override-effects",
      isChecked:
        game.settings.get("ddb-importer", "character-update-policy-generate-ac-override-effects") && daeInstalled,
      title: "[Caution] Generate DAE Override ACs",
      description:
        "Generate possible AC combinations as dynamic effects, these are high priority effects that override other effects. Useful if you can't calculate your AC correctly using other effects.",
      enabled: daeInstalled && !AUTO_AC,
    },
  ];
  const effectImportConfig5 = [
    {
      name: "dae-effect-copy",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-effect-copy") && daeSRDContentAvailable,
      title: "Copy Active Effect from DAE Compendiums",
      description:
        "<i>Transfer</i> the <i>Dynamic Active Effects Compendiums</i> effect for matching items/features/spells (requires DAE SRD and/or Midi SRD module). This may result in odd character AC's, HP etc. especially if the generate item and character effect options above are unticked. Please try importing the character with this option disabled before logging a bug.",
      enabled: daeInstalled && daeSRDContentAvailable,
    },
    // {
    //   name: "dae-copy",
    //   isChecked: game.settings.get("ddb-importer", "character-update-policy-dae-copy") && daeSRDContentAvailable,
    //   title: "[Caution] Replace Items using DAE compendiums",
    //   description:
    //     "Replace parsed item with <i>Dynamic Active Effects Compendiums</i> for matching items/features/spells (requires DAE SRD and/or Midi SRD module). This will remove any effects applied directly to your character/not via features/items. This may result in odd character AC's, HP etc. especially if the generate options above are unticked. Please try importing the character with this option disabled before logging a bug.",
    //   enabled: daeInstalled && daeSRDContentAvailable,
    // },
    {
      name: "active-effect-copy",
      isChecked: game.settings.get("ddb-importer", "character-update-policy-active-effect-copy"),
      title: "Retain Active Effects",
      description:
        "Retain existing Active Effects, this will try and transfer any existing effects on the actor such as custom effects, effects from conditions or existing spells. Untick this option if you experience <i>odd</i> behaviour, especially around AC.",
      enabled: true,
    },
  ];

  // dae migration function no longer sound
  if (game.settings.get("ddb-importer", "character-update-policy-dae-copy")) {
    game.settings.set("ddb-importer", "character-update-policy-dae-copy", false);
    game.settings.set("ddb-importer", "character-update-policy-dae-effect-copy", true);
  }

  const effectImportConfig = [...effectImportConfig1, ...effectImportConfig2, ...effectImportConfig3, ...effectImportConfig4, ...effectImportConfig5];

  const effectSelectionConfig = {
    class: [
      {
        name: "effect-class-spell-bonus",
        title: "Spell Bonuses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-spell-bonus"),
        enabled: true,
      },
      {
        name: "effect-class-speed",
        title: "Movement",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-speed"),
        enabled: true,
      },
      {
        name: "effect-class-senses",
        title: "Senses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-senses"),
        enabled: true,
      },
      {
        name: "effect-class-hp",
        title: "HP",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-hp"),
        enabled: true,
      },
      {
        name: "effect-class-damages",
        title: "Imm/Res/Vuln",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-class-damages"),
        enabled: true,
      },
    ],
    race: [
      {
        name: "effect-race-spell-bonus",
        title: "Spell Bonuses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-spell-bonus"),
        enabled: true,
      },
      {
        name: "effect-race-speed",
        title: "Movement",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-speed"),
        enabled: true,
      },
      {
        name: "effect-race-senses",
        title: "Senses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-senses"),
        enabled: true,
      },
      {
        name: "effect-race-hp",
        title: "HP",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-hp"),
        enabled: true,
      },
      {
        name: "effect-race-damages",
        title: "Imm/Res/Vuln",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-race-damages"),
        enabled: true,
      },
    ],
    background: [
      {
        name: "effect-background-spell-bonus",
        title: "Spell Bonuses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-spell-bonus"),
        enabled: true,
      },
      {
        name: "effect-background-speed",
        title: "Movement",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-speed"),
        enabled: true,
      },
      {
        name: "effect-background-senses",
        title: "Senses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-senses"),
        enabled: true,
      },
      {
        name: "effect-background-hp",
        title: "HP",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-hp"),
        enabled: true,
      },
      {
        name: "effect-background-damages",
        title: "Imm/Res/Vuln",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-background-damages"),
        enabled: true,
      },
    ],
    feat: [
      {
        name: "effect-feat-spell-bonus",
        title: "Spell Bonuses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-spell-bonus"),
        enabled: true,
      },
      {
        name: "effect-feat-speed",
        title: "Movement",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-speed"),
        enabled: true,
      },
      {
        name: "effect-feat-senses",
        title: "Senses",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-senses"),
        enabled: true,
      },
      {
        name: "effect-feat-hp",
        title: "HP",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-hp"),
        enabled: true,
      },
      {
        name: "effect-feat-damages",
        title: "Imm/Res/Vuln",
        isChecked: game.settings.get("ddb-importer", "character-update-policy-effect-feat-damages"),
        enabled: true,
      },
    ],
  };

  const syncConfig = [
    {
      name: "action-use",
      isChecked: game.settings.get("ddb-importer", "sync-policy-action-use"),
      description: "Action Uses",
      enabled: true,
    },
    {
      name: "currency",
      isChecked: game.settings.get("ddb-importer", "sync-policy-currency"),
      description: "Currency",
      enabled: true,
    },
    {
      name: "deathsaves",
      isChecked: game.settings.get("ddb-importer", "sync-policy-deathsaves"),
      description: "Death Saves",
      enabled: true,
    },
    {
      name: "equipment",
      isChecked: game.settings.get("ddb-importer", "sync-policy-equipment"),
      description: "Equipment",
      enabled: true,
    },
    {
      name: "condition",
      isChecked: game.settings.get("ddb-importer", "sync-policy-condition"),
      description: "Exhaustion",
      enabled: true,
    },
    {
      name: "hitdice",
      isChecked: game.settings.get("ddb-importer", "sync-policy-hitdice"),
      description: "Hit Dice/Short Rest",
      enabled: true,
    },
    {
      name: "hitpoints",
      isChecked: game.settings.get("ddb-importer", "sync-policy-hitpoints"),
      description: "Hit Points",
      enabled: true,
    },
    {
      name: "inspiration",
      isChecked: game.settings.get("ddb-importer", "sync-policy-inspiration"),
      description: "Inspiration",
      enabled: true,
    },
    {
      name: "spells-prepared",
      isChecked: game.settings.get("ddb-importer", "sync-policy-spells-prepared"),
      description: "Spells Prepared",
      enabled: true,
    },
    {
      name: "spells-slots",
      isChecked: game.settings.get("ddb-importer", "sync-policy-spells-slots"),
      description: "Spell Slots",
      enabled: true,
    },
    {
      name: "spells-sync",
      isChecked: game.settings.get("ddb-importer", "sync-policy-spells-sync"),
      description: "Spells Known",
      enabled: false,
    },
    {
      name: "xp",
      isChecked: game.settings.get("ddb-importer", "sync-policy-xp"),
      description: "XP",
      enabled: true,
    },
  ];

  const extrasConfig = [
    // {
    //   name: "update-existing",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-update-existing"),
    //   description: "Update existing things.",
    //   enabled: true,
    // },
    // {
    //   name: "use-srd",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd"),
    //   description: "Use SRD compendium things instead of importing.",
    //   enabled: true,
    // },
    // {
    //   name: "use-inbuilt-icons",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-inbuilt-icons"),
    //   description: "Use icons from the inbuilt dictionary. (High coverage of items, feats, and spells).",
    //   enabled: true,
    // },
    // {
    //   name: "use-srd-icons",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd-icons"),
    //   description: "Use icons from the SRD compendiums.",
    //   enabled: true,
    // },
    // {
    //   name: "download-images",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-download-images"),
    //   description: "Download D&D Beyond images (takes longer and needs space).",
    //   enabled: true,
    // },
    // {
    //   name: "remote-images",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-remote-images"),
    //   description: "Use D&D Beyond remote images (a lot quicker)",
    //   enabled: true,
    // },
    // {
    //   name: "use-dae-effects",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-use-dae-effects"),
    //   description: "Copy effects from DAE (items and spells only). (Requires DAE and SRD module)",
    //   enabled: daeInstalled,
    // },
    // {
    //   name: "hide-description",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-hide-description"),
    //   description: "Hide description from players?",
    //   enabled: true,
    // },
    // {
    //   name: "monster-items",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-monster-items"),
    //   description: "[Experimental] Load items from DDB compendium instead of parsing action/attack?",
    //   enabled: true,
    // },
    // {
    //   name: "update-images",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-update-images"),
    //   description: "Update images on existing items?",
    //   enabled: true,
    // },
    // {
    //   name: "dae-copy",
    //   isChecked: game.settings.get("ddb-importer", "munching-policy-dae-copy"),
    //   description: "Use Dynamic Active Effects Compendiums for matching items/features (requires DAE and SRD module).",
    //   enabled: daeInstalled,
    // },
  ];

  const uploadDir = game.settings.get("ddb-importer", "image-upload-directory");
  const badDirs = ["[data]", "[data] ", "", null];
  const dataDirSet = !badDirs.includes(uploadDir);
  const tier = game.settings.get("ddb-importer", "patreon-tier");
  const tiers = getPatreonTiers(tier);

  const result = {
    importPolicies: importPolicies,
    importConfig: importConfig,
    extrasConfig: extrasConfig,
    advancedImportConfig: advancedImportConfig,
    effectImportConfig: effectImportConfig,
    effectSelectionConfig: effectSelectionConfig,
    dataDirSet: dataDirSet,
    syncConfig: syncConfig,
    tiers: tiers,
  };

  return result;
}

export function updateActorSettings(html, event) {
  const selection = event.currentTarget.dataset.section;
  const checked = event.currentTarget.checked;
  const AUTO_AC = utils.versionCompare(game.data.system.data.version, "1.4.0") >= 0;

  logger.debug(`Updating munching-policy-${selection} to ${checked}`);
  game.settings.set("ddb-importer", "character-update-policy-" + selection, checked);

  if (selection === "dae-copy" && checked) {
    $(html).find("#character-import-policy-dae-effect-copy").prop("checked", false);
    game.settings.set("ddb-importer", "character-update-policy-dae-effect-copy", false);
  } else if (selection === "dae-effect-copy" && checked) {
    $(html).find("#character-import-policy-dae-copy").prop("checked", false);
    game.settings.set("ddb-importer", "character-update-policy-dae-copy", false);
    $(html).find("#character-import-policy-add-item-effects").prop("checked", true);
    game.settings.set("ddb-importer", "character-update-policy-add-item-effects", true);
    $(html).find("#character-import-policy-add-character-effects").prop("checked", true);
    game.settings.set("ddb-importer", "character-update-policy-add-character-effects", true);
  } else if (!AUTO_AC && (selection === "generate-ac-armor-effects" || selection === "generate-ac-feature-effects") && checked) {
    game.settings.set("dae", "calculateArmor", false);
    game.settings.set("dae", "applyBaseAC", false);
  }
}

function getCompendiumFolderLookups(type) {
  const compendiumFolderSetting = game.settings.settings.get(`ddb-importer.munching-selection-compendium-folders-${type}`);
  const settingValue = game.settings.get("ddb-importer", `munching-selection-compendium-folders-${type}`);

  let selections = [];
  for (const [key, value] of Object.entries(compendiumFolderSetting.choices)) {
    selections.push({
      key: key,
      label: value,
      selected: key === settingValue,
    });
  }

  return selections;
}

export function getMuncherSettings(includeHomebrew = true) {
  const cobalt = getCobalt() != "";
  const betaKey = game.settings.get("ddb-importer", "beta-key") != "";
  const tier = game.settings.get("ddb-importer", "patreon-tier");
  const tiers = getPatreonTiers(tier);
  const daeInstalled = utils.isModuleInstalledAndActive("dae");
  const daeSRDInstalled = utils.isModuleInstalledAndActive("Dynamic-Effects-SRD");
  const midiSRDInstalled = utils.isModuleInstalledAndActive("midi-srd");
  const daeSRDContentAvailable = daeSRDInstalled || midiSRDInstalled;
  const compendiumFolderAdd = game.settings.get("ddb-importer", "munching-policy-use-compendium-folders");
  const compendiumFoldersInstalled = utils.isModuleInstalledAndActive("compendium-folders");
  const compendiumFolderMonsterStyles = getCompendiumFolderLookups("monster");
  const compendiumFolderSpellStyles = getCompendiumFolderLookups("spell");
  const compendiumFolderItemStyles = getCompendiumFolderLookups("item");

  const itemConfig = [
    {
      name: "use-ddb-item-icons",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-item-icons"),
      description: "Use D&D Beyond item images, if available",
      enabled: true,
    },
    {
      name: "use-ddb-generic-item-icons",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-generic-item-icons"),
      description: "Use D&D Beyond generic item type images, if available (final fallback)",
      enabled: true,
    },
    {
      name: "add-effects",
      isChecked: game.settings.get("ddb-importer", "munching-policy-add-effects"),
      description: "[Experimental] Dynamically generate DAE effects (equipment only). (Requires DAE)",
      enabled: daeInstalled,
    },
    {
      name: "add-ac-armor-effects",
      isChecked: game.settings.get("ddb-importer", "munching-policy-add-ac-armor-effects"),
      description: "[Experimental] Dynamically generate DAE AC effects on armor equipment. (Requires DAE)",
      enabled: daeInstalled,
    },
  ];

  const spellConfig = [
    {
      name: "use-ddb-spell-icons",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-ddb-spell-icons"),
      description: "If no other icon, use the D&DBeyond spell school icon.",
      enabled: true,
    },
  ];

  const sourcesSelected = game.settings.get("ddb-importer", "munching-policy-monster-sources").flat().length > 0;
  const homebrewDescription = sourcesSelected
      ? "SOURCES SELECTED! You can't import homebrew with a source filter selected"
      : "Include homebrew?";

  const basicMonsterConfig = [
    {
      name: "hide-description",
      isChecked: game.settings.get("ddb-importer", "munching-policy-hide-description"),
      description: "Hide monster action description from players?",
      enabled: true,
    },
    {
      name: "monster-items",
      isChecked: game.settings.get("ddb-importer", "munching-policy-monster-items"),
      description: "[Experimental] Load items from DDB compendium instead of parsing action/attack?",
      enabled: true,
    },
    {
      name: "update-images",
      isChecked: game.settings.get("ddb-importer", "munching-policy-update-images"),
      description: "Update Monster images on existing items?",
      enabled: true,
    },
    {
      name: "use-full-token-image",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-full-token-image"),
      description: "Use avatar image for token rather than token image",
      enabled: true,
    },
    {
      name: "use-token-avatar-image",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-token-avatar-image"),
      description: "Use token image for avatar rather than avatar image",
      enabled: true,
    },
    {
      name: "dae-copy",
      isChecked: game.settings.get("ddb-importer", "munching-policy-dae-copy"),
      description: "Use Dynamic Active Effects Compendiums for matching items/features (requires DAE and SRD module).",
      enabled: daeInstalled && daeSRDContentAvailable,
    }
  ];

  const homebrewMonsterConfig = includeHomebrew
    ? [
        {
          name: "monster-homebrew",
          isChecked: game.settings.get("ddb-importer", "munching-policy-monster-homebrew") && !sourcesSelected,
          description: homebrewDescription,
          enabled: tiers.homebrew && !sourcesSelected,
        },
        {
          name: "monster-homebrew-only",
          isChecked: game.settings.get("ddb-importer", "munching-policy-monster-homebrew-only") && !sourcesSelected,
          description: "Homebrew monsters only? (Otherwise both)",
          enabled: tiers.homebrew && !sourcesSelected,
        },
        {
          name: "monster-exact-match",
          isChecked: game.settings.get("ddb-importer", "munching-policy-monster-exact-match"),
          description: "Exact name match?",
          enabled: tiers.homebrew,
        }
      ]
    : [];

  const monsterConfig = basicMonsterConfig.concat(homebrewMonsterConfig);

  const genericConfig = [
    {
      name: "update-existing",
      isChecked: game.settings.get("ddb-importer", "munching-policy-update-existing"),
      description: "Update existing things.",
      enabled: true,
    },
    {
      name: "use-inbuilt-icons",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-inbuilt-icons"),
      description: "Use icons from the inbuilt dictionary. (High coverage, recommended, fast).",
      enabled: true,
    },
    {
      name: "use-srd-icons",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd-icons"),
      description: "Use icons from the SRD compendiums.",
      enabled: true,
    },
    {
      name: "download-images",
      isChecked: game.settings.get("ddb-importer", "munching-policy-download-images"),
      description: "Download D&D Beyond images (takes longer and needs space).",
      enabled: true,
    },
    {
      name: "remote-images",
      isChecked: game.settings.get("ddb-importer", "munching-policy-remote-images"),
      description: "Use D&D Beyond remote images (a lot quicker)",
      enabled: true,
    },
    {
      name: "use-dae-effects",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-dae-effects"),
      description: "Copy effects from DAE (items and spells only). (Requires DAE and SRD or Midi content module)",
      enabled: daeInstalled && daeSRDContentAvailable,
    },
    {
      name: "use-compendium-folders",
      isChecked: compendiumFoldersInstalled ? compendiumFolderAdd : false,
      description: "Generate compendium folders. You can migrate an existing import in the Tools tab.",
      enabled: compendiumFoldersInstalled,
    },
    {
      name: "use-srd",
      isChecked: game.settings.get("ddb-importer", "munching-policy-use-srd"),
      description:
        "[CAUTION] Use SRD compendium things instead of importing. This is not recommended, and may break adventure munching functionality.",
      enabled: true,
    },
  ];

  const resultData = {
    cobalt,
    genericConfig,
    monsterConfig,
    spellConfig,
    itemConfig,
    beta: betaKey && cobalt,
    tiers,
    compendiumFoldersInstalled,
    compendiumFolderMonsterStyles,
    compendiumFolderItemStyles,
    compendiumFolderSpellStyles,
  };

  // console.warn(resultData);

  return resultData;
}

export function updateMuncherSettings(html, event) {
  const selection = event.currentTarget.dataset.section;
  const checked = event.currentTarget.checked;

  logger.debug(`Updating munching-policy-${selection} to ${checked}`);

  game.settings.set("ddb-importer", "munching-policy-" + selection, checked);

  switch (selection) {
    case "use-full-token-image": {
      if (checked) {
        game.settings.set("ddb-importer", "munching-policy-use-token-avatar-image", false);
        $("#munching-policy-use-token-avatar-image").prop("checked", false);
      }
      break;
    }
    case "use-token-avatar-image": {
      if (checked) {
        game.settings.set("ddb-importer", "munching-policy-use-full-token-image", false);
        $("#munching-policy-use-full-token-image").prop("checked", false);
      }
      break;
    }
    case "monster-homebrew": {
      if (!checked) {
        game.settings.set("ddb-importer", "munching-policy-monster-homebrew-only", false);
        $("#munching-policy-monster-homebrew-only").prop("checked", false);
      }
      break;
    }
    case "monster-homebrew-only": {
      if (checked) {
        game.settings.set("ddb-importer", "munching-policy-monster-homebrew", true);
        $("#munching-policy-monster-homebrew").prop("checked", true);
      }
      break;
    }
    case "remote-images": {
      if (checked) {
        game.settings.set("ddb-importer", "munching-policy-download-images", false);
        $("#munching-generic-policy-download-images").prop("checked", false);
      }
      break;
    }
    case "download-images": {
      if (checked) {
        game.settings.set("ddb-importer", "munching-policy-remote-images", false);
        $("#munching-generic-policy-remote-images").prop("checked", false);
      }
      break;
    }
    // no default
  }
}
