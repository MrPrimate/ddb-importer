import { SETTINGS, DICTIONARY } from "../../config/_module.mjs";
import { utils, logger, CompendiumHelper, FileHelper, DDBCompendiumFolders, DDBItemImporter, DDBSources } from "../../lib/_module.mjs";
import AdvancementHelper from "../advancements/AdvancementHelper.js";
import { DDBModifiers, DDBReferenceLinker, DDBDataUtils, SystemHelpers } from "../lib/_module.mjs";


export default class DDBRace {

  static SPECIAL_ADVANCEMENTS = {};

  static EXCLUDED_FEATURE_ADVANCEMENTS = [];

  static EXCLUDED_FEATURE_ADVANCEMENTS_2014 = [];

  static FORCE_ADVANCEMENT_REPLACE = [];

  static FORCE_SUBRACE_2024 = [
    "Elf",
    "Gnome",
    "Tiefling",
  ];

  static FORCE_TRAIT_GRANT = [
    // "Infernal Legacy",
    // "Fiendish Legacy",
    // "Elven Lineage",
    // "Gnomish Lineage",
  ];

  static getGroupName(ids, baseRaceName) {
    const ddbGroup = CONFIG.DDB.raceGroups.find((r) => ids.includes(r.id));
    if (ddbGroup) {
      return ddbGroup.name;
    }
    const lowercaseName = baseRaceName.toLowerCase().trim();
    if ((lowercaseName.includes("elf") && !lowercaseName.includes("half")) || ["eladrin"].includes(lowercaseName)) {
      return "Elf";
    }
    if (["githzerai", "githyanki"].includes(lowercaseName)) return "Gith";
    if (lowercaseName.includes("genasi")) return "Genasi";
    if (lowercaseName.includes("gnome")) return "Gnome";
    if (lowercaseName.includes("human")) return "Human";
    if (lowercaseName.includes("yuan-ti")) return "Yuan-ti";
    return baseRaceName;
  }

  _generateDataStub() {
    this.data = {
      _id: foundry.utils.randomID(),
      name: "",
      type: "race",
      system: SystemHelpers.getTemplate("race"),
      flags: {
        ddbimporter: {
          type: "race",
        },
      },
      img: null,
    };
  }

  #fixups() {
    // fixup
    if (this.race.baseName === "Harengon") {
      this.race.sizeId = 10;
    }
  }

  get lineageName() {
    if (!this.lineageTrait) return null;
    return this.lineageTrait.label.replace(" Lineage", "").replace(" Legacy", "").trim();
  }

  #getTraitChoice(trait) {
    const choice = DDBDataUtils.getChoices({ ddb: this.ddbData, type: "race", feat: trait, selectionOnly: true });
    return choice[0];
  }

  #getLineageTrait() {
    if (this.is2014) return null;
    if (DDBRace.FORCE_SUBRACE_2024.includes(this.race.baseRaceName)) {
      const lineageTrait = this.race.racialTraits.find((r) => r.definition.name.includes("Lineage") || r.definition.name.includes("Fiendish Legacy"));
      if (!lineageTrait) return null;
      this.isLineage = true;
      return this.#getTraitChoice(lineageTrait);
    }
    return null;
  }

  #getFullName() {
    const baseName = this.race.fullName ?? this.race.name;
    const lineageName = this.lineageName;
    const legacyName = this.isMuncher && this.isLegacy && this.data.system.source.book
      ? ` (${this.data.system.source.book})`
      : "";
    if (lineageName) {
      if (lineageName.includes(baseName)) {
        return `${lineageName}${legacyName}`;
      } else {
        return `${baseName} (${lineageName})${legacyName}`;
      }
    }
    return `${baseName}${legacyName}`;
  }

  isLineage = false;

  spellLinks = [];

  featLink = {
    advancementId: null,
    name: null,
    uuid: null,
  };

  choiceMap = new Map();

  configChoices = {};

  traitAdvancements = [];

  traitAdvancementUuids = new Set();

  _indexFilter = {
    traits: {
      fields: [
        "name",
        "flags.ddbimporter",
      ],
    },
    feats: {
      fields: [
        "name",
        "flags.ddbimporter.id",
        // "flags.ddbimporter",
        "flags.ddbimporter.is2014",
        "flags.ddbimporter.is2024",
        "flags.ddbimporter.featureMeta",
        "flags.ddbimporter.subType",
        "system.type.subtype",
        "system.prerequisites.level",
      ],
    },
  };

  _advancementMatches = {
    traits: {},
  };

  _compendiums = {
    traits: CompendiumHelper.getCompendiumType("traits", false),
    feats: CompendiumHelper.getCompendiumType("feats", false),
  };

  abilityAdvancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();

  constructor({ ddbCharacter, compendiumRacialTraits } = {}) {
    this.ddbCharacter = ddbCharacter;
    this.ddbData = ddbCharacter.source.ddb;
    this.isMuncher = ddbCharacter.isMuncher ?? false;
    this.race = ddbCharacter.source.ddb.character.race;
    this.is2014 = this.race.sources.every((s) => DDBSources.is2014Source(s));
    this.is2024 = !this.is2014;
    this.version = this.is2014 ? "2014" : "2024";

    this.isLegacy = this.race.isLegacy;
    this.#fixups();
    this.compendiumRacialTraits = compendiumRacialTraits;
    this._generateDataStub();
    this.data.system.source = DDBSources.parseSource(this.race);

    this.type = "humanoid";
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.lineageTrait = this.#getLineageTrait();
    this.fullName = this.#getFullName();
    this.data.name = utils.nameString(this.fullName);
    this.data.system.description.value += `${this.race.description}\n\n`;

    this.baseRaceName = this.race.baseRaceName;
    this.groupName = DDBRace.getGroupName(this.race.groupIds, this.baseRaceName);
    this.isSubRace = this.race.isSubRace || this.groupName !== this.fullName;

    const sourceIds = this.race.sources.map((sm) => sm.sourceId);
    this.legacy = this.race.isLegacy || CONFIG.DDB.sources.some((ddbSource) =>
      sourceIds.includes(ddbSource.id)
      && DICTIONARY.sourceCategories.legacy.includes(ddbSource.sourceCategoryId),
    );

    this.data.flags.ddbimporter = {
      type: "race",
      entityRaceId: this.race.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.race.sources.length > 0 ? [0].sourceId : -1, // is homebrew
      baseName: this.race.baseName,
      baseRaceId: this.race.baseRaceId,
      baseRaceName: this.race.baseRaceName,
      fullName: this.fullName,
      fullRaceName: this.fullName,
      subRaceShortName: this.race.subRaceShortName,
      isHomebrew: this.race.isHomebrew,
      isLegacy: this.race.isLegacy,
      legacy: this.legacy,
      is2014: this.is2014,
      is2024: !this.is2014,
      isSubRace: this.isSubRace,
      moreDetailsUrl: this.race.moreDetailsUrl,
      featIds: this.race.featIds,
      groupIds: this.race.groupIds,
      groupName: this.groupName,
      isLineage: this.isLineage,
      lineageName: this.lineageName,
    };

    if (this.race.moreDetailsUrl) {
      this.data.flags.ddbimporter['moreDetailsUrl'] = this.race.moreDetailsUrl;
    }

    if (this.race.isSubRace && this.race.baseRaceName) this.data.system.requirements = this.race.baseRaceName;

    this.#addWeightSpeeds();
    this.#addSizeAdvancement();

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: "race",
      isMuncher: this.isMuncher,
    });

  }

  _addAdvancement(...advancements) {
    this.data.system.advancement.push(...advancements.flat());
  }

  getCompendiumIxByFlags(compendiums, flags, findAll = false) {
    for (const compendium of compendiums) {
      if (!this._compendiums[compendium]) {
        continue;
      }
      logger.verbose(`Searching for trait with flags in ${compendium}:`, flags);

      const filterFunction = ((i) => {
        return Object.entries(flags).every(([key, value]) => {
          return foundry.utils.getProperty(i, `flags.ddbimporter.${key}`) === value;
        });
      });
      const match = findAll
        ? this._compendiums[compendium].index.filter(filterFunction)
        : this._compendiums[compendium].index.find(filterFunction);
      if (match) return match;
    }
    return null;
  }

  async _buildCompendiumIndex(type, indexFilter = {}) {
    if (Object.keys(indexFilter).length > 0) this._indexFilter[type] = indexFilter;
    if (!this._compendiums[type]) return;
    await this._compendiums[type].getIndex(this._indexFilter[type]);
  }


  async _generateRaceImage() {
    let avatarUrl;
    let largeAvatarUrl;
    let portraitAvatarUrl;

    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    const rules = this.data.system.source?.rules ?? "2024";
    const book = utils.normalizeString(this.data.system.source?.book ?? "");
    const bookRuleStub = [rules, book].join("-");

    if (this.race.portraitAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-race-portrait`;
      const pathPostfix = useDeepPaths ? `/race/portrait` : "";
      const downloadOptions = { type: "race-portrait", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix, download: true };
      portraitAvatarUrl = await FileHelper.getImagePath(this.race.portraitAvatarUrl, downloadOptions);

      this.data.img = portraitAvatarUrl;
      this.data.flags.ddbimporter['portraitAvatarUrl'] = this.race.portraitAvatarUrl;
    }

    if (this.race.avatarUrl) {
      const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-race-avatar`;
      const pathPostfix = useDeepPaths ? `/race/avatar` : "";
      const downloadOptions = { type: "race-avatar", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix, download: true };
      avatarUrl = await FileHelper.getImagePath(this.race.avatarUrl, downloadOptions);
      this.data.flags.ddbimporter['avatarUrl'] = this.race.avatarUrl;
      if (!this.data.img) {
        this.data.img = avatarUrl;
      }
    }

    if (this.race.largeAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-large";
      const pathPostfix = useDeepPaths ? `/race/large` : "";
      const downloadOptions = { type: "race-large", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
      largeAvatarUrl = await FileHelper.getImagePath(this.race.largeAvatarUrl, downloadOptions);
      // eslint-disable-next-line require-atomic-updates
      this.data.flags.ddbimporter['largeAvatarUrl'] = this.race.largeAvatarUrl;
      if (!this.data.img) {
        this.data.img = largeAvatarUrl;
      }
    }

    if (this.data.img) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.keepIcon", true);
    }

    const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
    this.data.system.description.value += image;
    return image;
  }

  #typeCheck(trait) {
    if (trait.name.trim() !== "Creature Type") return;
    const typeRegex = /(?:You are|You're) an? (\S*)\./i;
    const typeMatch = trait.description.match(typeRegex);
    if (typeMatch) {
      logger.debug(`Explicit type detected: ${typeMatch[1]}`, typeMatch);
      this.type = typeMatch[1].toLowerCase();
    }
  }

  #addFeatureDescription(trait) {
    // for whatever reason 2024 races still have a hidden ability score entry
    if (!this.is2014 && trait.name.startsWith("Ability Score ")) return;
    const featureMatch = this.compendiumRacialTraits?.find((match) => {
      const baseName = foundry.utils.getProperty(match, "flags.ddbimporter.baseName");
      if (!baseName) return false;
      const entityRaceId = foundry.utils.getProperty(match, "flags.ddbimporter.entityRaceId");
      if (!entityRaceId) return false;
      return utils.nameString(trait.name) === utils.nameString(baseName)
      && entityRaceId === trait.entityRaceId;
    });
    const title = (featureMatch) ? `<p><b>@Compendium[${this._compendiumLabel}.${featureMatch._id}]{${trait.name}}</b></p>` : `<p><b>${trait.name}</b></p>`;
    this.data.system.description.value += `${title}\n${trait.description}\n\n`;
  }

  #addWeightSpeeds() {
    if (this.race.weightSpeeds?.normal) {
      this.data.system.movement = {
        burrow: this.race.weightSpeeds.normal.burrow ?? 0,
        climb: this.race.weightSpeeds.normal.climb ?? 0,
        fly: this.race.weightSpeeds.normal.fly ?? 0,
        swim: this.race.weightSpeeds.normal.swim ?? 0,
        walk: this.race.weightSpeeds.normal.walk ?? 0,
        units: "ft",
        hover: false,
      };
    }
  }

  #addSizeAdvancement() {
    const advancement = new game.dnd5e.documents.advancement.SizeAdvancement();

    const ddbSizeData = CONFIG.DDB.creatureSizes.find((s) => s.id === this.race.sizeId);
    if (ddbSizeData.id === 10) {
      advancement.updateSource({ configuration: { sizes: ["med", "sm"] } });
    } else if (ddbSizeData !== 4) {
      const size = DICTIONARY.sizes.find((s) => s.id === this.race.sizeId);
      advancement.updateSource({ configuration: { sizes: [size.value] } });
    }

    this._addAdvancement(advancement.toObject());
  }

  #flightCheck(trait) {
    if (trait.name.trim() === "Flight" && foundry.utils.getProperty(this.race, "weightSpeeds.normal.fly") === 0) {
      const typeRegex = /you have a flying speed equal to your walking speed/i;
      const flightMatch = trait.description.match(typeRegex);
      if (flightMatch) {
        logger.debug(`Missing flight detected: ${flightMatch[1]}`, flightMatch);
        this.data.system.movement.fly = this.data.system.movement.walk;
      }
    }
  }

  #addAbilityScoreAdvancement(trait) {
    if (!["Ability Score Increase", "Ability Score Increases"].includes(trait.name.trim())) return;
    const pointMatchRegex = /Your ability scores each increase by 1|or increase three different scores by 1/i;
    if (pointMatchRegex.test(trait.description)) {
      this.abilityAdvancement.configuration.points = 3;
      this.abilityAdvancement.updateSource({ configuration: { points: 3 } });
    } else {
      // Your Intelligence score increases by 2, and your Wisdom score increases by 1.
      // Your Wisdom score increases by 2, and your Constitution score increases by 1.
      // Your Strength score increases by 1.
      // Your Constitution score increases by 2.
      // Your Charisma score increases by 2, and          two other ability scores of your choice increase by 1.
      // Your Charisma score increases by 2. In addition, one other ability score of your choice increases by 1.
      // Your Constitution score increases by 2, and      one other ability score of your choice increases by 1.

      const update = this.abilityAdvancement.configuration.toObject();
      const fixedRegex = /Your (\w+) score increases by (\d)/i;
      const fixedMatch = trait.description.match(fixedRegex);
      if (fixedMatch) {
        const ability = DICTIONARY.actor.abilities.find((a) => a.long === fixedMatch[1].toLowerCase());
        if (ability) {
          update.fixed[ability.value] = parseInt(fixedMatch[2]);
        }
      }

      const extraFixedRegex = /and your (\w+) score increases by (\d)/i;
      const extraFixedMatch = trait.description.match(extraFixedRegex);
      if (extraFixedMatch) {
        const ability = DICTIONARY.actor.abilities.find((a) => a.long === extraFixedMatch[1].toLowerCase());
        if (ability) {
          update.fixed[ability.value] = parseInt(extraFixedMatch[2]);
        }
      }
      const wildCardRegex = /(\w+) other ability score of your choice increases by (\d)/i;
      const wildCardMatch = trait.description.match(wildCardRegex);
      if (wildCardMatch) {
        const numb = DICTIONARY.numbers.find((n) => n.natural === wildCardMatch[1].toLowerCase());
        const value = parseInt(wildCardMatch[2]);
        if (numb && Number.isInteger(value)) {
          update.points = (update.points ?? 0) + (value * numb.num);
          update.cap = Math.max(value, (update.cap ?? 0));
        }
      }

      this.abilityAdvancement.updateSource({ configuration: update });
    }
  }

  #generateAbilityAdvancement() {
    // console.warn("Ability advancement", {
    //   this: this,
    // })
    if (!this.is2014) return;
    this.race.racialTraits
      .filter((t) => ["Ability Score Increase", "Ability Score Increases"].includes(t.definition.name.trim()))
      .forEach((t) => {
        this.#addAbilityScoreAdvancement(t.definition);
      });
    this._addAdvancement(this.abilityAdvancement.toObject());
  }

  // skills, e.g. variant human
  #generateSkillAdvancement(trait) {
    // if (!["Skills"].includes(trait.name.trim())) return;

    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.actor.skills.map((s) => s.subType).includes(mod.subType),
    );
    const advancement = this.advancementHelper.getSkillAdvancement({
      mods: skillExplicitMods,
      feature: trait,
      level: 0,
    });

    if (advancement) this._addAdvancement(advancement.toObject());
  }

  #generateLanguageAdvancement(trait) {
    // if (!["Languages"].includes(trait.name.trim())) return;

    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, trait, 0);
    if (advancement) this._addAdvancement(advancement.toObject());
  }

  #generateToolAdvancement(trait) {
    // if (!["Tools"].includes(trait.name.trim())) return;

    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getToolAdvancement({
      mods: mods,
      feature: trait,
      level: 0,
    });
    if (advancement) this._addAdvancement(advancement.toObject());
  }

  async #generateSpellAdvancement(trait) {
    const advancements = [];

    const htmlData = trait.description.includes("Choose a lineage from the")
      || trait.description.includes("Choose a legacy from the")
      ? AdvancementHelper.parseHTMLTableSpellAdvancementData({
        description: trait.description,
        species: this.fullName,
      })
      : trait.description.includes(" Choose one of the following options")
        ? AdvancementHelper.parseHTMLPTagSpellAdvancementData({
          description: trait.description,
          species: this.fullName,
        })
        : AdvancementHelper.parseHTMLSpellAdvancementData(trait.description);

    const abilityData = AdvancementHelper.parseHTMLSpellCastingAbilities(trait.description);
    const name = trait.name.toLowerCase().includes("spell")
      ? trait.name
      : `${trait.name} (Spells)`;

    const hint = htmlData.hint !== "" ? htmlData.hint : abilityData.hint;

    logger.debug(`Spell Advancement Data from ${trait.name}`, {
      htmlData,
      this: this,
      trait,
      abilityData,
      name,
      hint,
    });

    const cantripChoiceAdvancement = await AdvancementHelper.getCantripChoiceAdvancement({
      choices: htmlData.cantripChoices,
      abilities: abilityData.abilities,
      hint,
      name,
      spellListChoice: htmlData.spellListCantripChoice,
      spellLinks: this.spellLinks,
      is2024: this.is2024,
    });
    if (cantripChoiceAdvancement) {
      advancements.push(cantripChoiceAdvancement);
    }

    const cantripGrantAdvancement = await AdvancementHelper.getCantripGrantAdvancement({
      choices: htmlData.cantripGrants,
      abilities: abilityData.abilities,
      hint,
      name,
      spellLinks: this.spellLinks,
      is2024: this.is2024,
    });
    if (cantripGrantAdvancement) {
      advancements.push(cantripGrantAdvancement);
    }

    for (const spellGrant of htmlData.spellGrants) {
      const spellGrantAdvancement = await AdvancementHelper.getSpellGrantAdvancement({
        spellGrants: [spellGrant],
        abilities: abilityData.abilities,
        hint,
        name,
        spellLinks: this.spellLinks,
        is2024: this.is2024,
      });
      if (spellGrantAdvancement) {
        advancements.push(spellGrantAdvancement);
      }
      // TO DO: add cast via slot
    }


    // Add chosen to advancements
    // loop through race spells

    // let isChoice = false;
    // const advancements = [];
    // const choiceData = {
    //   0: [],
    //   1: [],
    //   2: [],
    //   3: [],
    //   4: [],
    //   5: [],
    //   6: [],
    //   7: [],
    //   8: [],
    //   9: [],
    // };

    // const speciesSpells = this.ddbData.character.spells.race;
    // const speciesOptions = this.ddbData.character.options.race;
    // const spellChoices = this.ddbData.character.choices.race;

    // const grantSpells = [];
    // const choiceSpells = [];

    // for (const spell of speciesSpells) {

    //   const advancement = new game.dnd5e.documents.advancement.SpellAdvancement();

    //   const spellComponentId = spell.componentId;

    //   // SPELL COMPONENT ID MATCH
    //   // chosen spell option
    //   options.race[]  definition.id //spellcoponent id

    //   options.race[] componentId // OPTIONCOMPONENTID
    //     // race.racialTraits.definition.id === OPTIONCOMPONENTID
    //     // choices.race.componentId
    //     // for spellcasting choice
    //     // choices.choiceDefinitions.options.componentId === OPTIONCOMPONENTID

    //   // chpsen option
    //   choices{ race: [ { optionValue}]}
    //   // available options
    //   choices{ race: [ { optionIds[]}]}


    // }


    // determine if spell is choice or grant

    // if choice, filter out 2014/2024 versions

    // find spells in compendium
    // prepare advancement

    // set chosen values

    logger.debug("Spell Advancements", {
      advancements,
    });

    advancements.forEach((advancement) => {
      this._addAdvancement(advancement.toObject());
    });

  }

  async #generateFeatAdvancement(trait) {
    if (!["Feats", "Feat", "Versatile"].includes(trait.name.trim())) return;

    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();

    const uuids = this._compendiums.feats.index
      .filter((i) => {
        const prerequisite = foundry.utils.getProperty(i, "system.prerequisites.level");
        if (prerequisite && prerequisite !== "") {
          if (parseInt(prerequisite) > 1) return false;
        }
        if (this.is2014) {
          if (foundry.utils.getProperty(i, "flags.ddbimporter.is2024")) return false;
        } else if (this.is2024) {
          if (foundry.utils.getProperty(i, "flags.ddbimporter.is2014")) return false;
          if (foundry.utils.getProperty(i, "system.type.subtype") !== "origin") return false;
        }
        return true;
      })
      .map((i) => i.uuid);

    advancement.updateSource({
      title: trait.name,
      hint: trait.snippet ?? trait.description ?? undefined,
      configuration: {
        allowDrops: true,
        pool: Array.from(uuids).map((f) => {
          return { uuid: f };
        }),
        choices: {
          "0": {
            count: 1,
            replacement: false,
          },
        },
        type: "feat",
        restriction: {
          type: "feat",
          subtype: this.is2014 ? undefined : "origin",
        },
      },
    });

    this._addAdvancement(advancement.toObject());

    const feat = this.ddbData?.character?.feats?.find((f) =>
      f.componentId === trait.id
      && f.componentTypeId === trait.entityTypeId,
    );
    if (!feat) {
      logger.warn(`Unable to link advancement to feat`, { advancement, trait, this: this });
      return;
    };
    const featMatch = this._compendiums.feats.index.find((i) =>
      i.name === feat.definition.name
      && foundry.utils.getProperty(i, "flags.ddbimporter.id") === feat.definition.id,
    );
    if (!featMatch) {
      logger.warn(`Unable to link advancement to feat ${feat.definition.name}, this is probably because the feats have not been munched to the compendium`, { feat });
      return;
    }

    this.featLink.advancementId = advancement._id;
    this.featLink.name = feat.definition.name;
    this.featLink.uuid = featMatch.uuid;

    // console.warn("Generated feat advancement link", {
    //   this: this,
    //   trait,
    //   feat,
    //   featMatch,
    //   featLink: this.featLink,
    //   advancement,
    //   toObject: advancement.toObject(),
    // });

    // this update is done later, once everything is built
    // we just add the hints to the feat here
    // const update = {
    //   value: {
    //     added: {
    //       "0": {
    //         // "IRs6OOXQk3AvK3GW": "Compendium.world.ddb-test2-ddb-feats.Item.cHie2wNgxBG9m62F"
    //       },
    //     },
    //   },
    // };

    // advancement.updateSource(update);
  }

  // eslint-disable-next-line complexity
  async #generateTraitChoiceAdvancement(trait, choices) {
    logger.debug(`Generating choice trait advancement for trait ${trait.name} with ${choices.length} choices`);
    const keys = new Set();
    const uuids = new Set();
    const configChoices = {};
    let lowestLevel = 0;

    for (const choice of choices) {
      // build a list of options for each choice
      const choiceRegex = /level (\d+) /i;
      const choiceLevel = (choice.label ?? "").match(choiceRegex);
      const level = choiceLevel && choiceLevel.length > 1
        ? parseInt(choiceLevel[1])
        : (trait.requiredLevel ?? 0);
      const currentCount = parseInt(configChoices[level]?.count ?? 0);

      if (lowestLevel === 0) lowestLevel = level;
      if (level < lowestLevel) lowestLevel = level;

      configChoices[level] = { count: currentCount + 1, replacement: false };

      const key = `${choice.componentTypeId}-${choice.type}-${trait.requiredLevel ?? 0}-${level}`;
      const choiceDefinition = this.ddbData.character.choices.choiceDefinitions.find((def) => def.id === `${choice.componentTypeId}-${choice.type}`);
      if (!choiceDefinition) {
        logger.warn(`Could not find choice definition for ${key}`);
        continue;
      }
      const choiceOptions = choiceDefinition.options
        .filter((o) => choice.optionIds.includes(o.id));

      if (choiceOptions.length === 0) {
        logger.warn(`Could not find choice options for ${key} with option Ids: ${choice.optionIds.join(", ")}`, {
          this: this, trait,
          choice,
          choiceDefinition,
          key,
        });
        continue;
      }
      keys.add(key);

      const traits = [];

      for (const option of choiceOptions) {

        const compendiumFeature = this.getCompendiumIxByFlags(["traits"], { // action feature
          componentId: option.id,
          is2014: this.is2014,
          is2024: this.is2024,
          "dndbeyond.entityRaceId": this.race.entityRaceId,
          // classId: this.ddbParentClassDefinition.id,
        })
        ?? this.getCompendiumIxByFlags(["traits"], { // choice feature
          "id": option.optionComponentId,
          "isChoiceFeature": true,
          "dndbeyond.entityRaceId": this.race.entityRaceId,
          "dndbeyond.choice.optionId": option.id,
        }) ?? this.getCompendiumIxByFlags(["feats"], { // feat choice
          id: option.id,
        });

        if (compendiumFeature) {
          traits.push(compendiumFeature);
          uuids.add(compendiumFeature.uuid);
        } else if (this.isMuncher && this.addToCompendium) {
          logger.info(`Could not find choice trait option id ${option.id} (${option.label}) for trait ${trait.name}`, {
            this: this,
            trait,
            option,
          });
        }
      }

      this.choiceMap.set(key, traits);
      foundry.utils.setProperty(CONFIG.DDBI, `muncher.debug.race.${this.name}${this.version}.trait.${trait.name}.compendiumChoices`, traits);
    }

    if (uuids.size === 0) {
      logger.warn(`No valid traits found for advancement of trait ${trait.name}, you can ignore this message unless you think this trait should offer an advancement choice.`);
      return;
    }
    if (Object.keys(configChoices).length === 0) {
      logger.warn(`No valid choices found for advancement of trait ${trait.name}, you can ignore this message unless you think this trait should offer an advancement choice.`);
      return;
    }

    const forceReplace = DDBRace.FORCE_ADVANCEMENT_REPLACE.includes(trait.name);
    this.configChoices[trait.name] = AdvancementHelper.getChoiceReplacements(trait.description ?? trait.snippet ?? "", lowestLevel, configChoices, forceReplace);
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();

    advancement.updateSource({
      title: utils.nameString(trait.name),
      hint: trait.snippet ?? trait.description ?? "",
      configuration: {
        restriction: {
          type: "race",
        },
        choices: configChoices,
        type: "feat",
        pool: Array.from(uuids).map((f) => {
          return { uuid: f };
        }),
        allowDrops: true,
      },
      icons: "icons/magic/symbols/cog-orange-red.webp",
    });

    // console.warn(`Generated choice advancement for feature ${feature.name}:`, {
    //   advancement,
    //   this: this,
    //   feature,
    //   choices,
    //   uuids,
    // });

    // eslint-disable-next-line no-warning-comments
    // TODO: handle chosen advancements on non muncher races
    this._addAdvancement(advancement.toObject());

  }

  // eslint-disable-next-line complexity
  async #generateTraitOptionAdvancement(trait, options) {
    logger.debug(`Generating choice trait option advancement for trait ${trait.name} with ${options.length} options`);

    const uuids = new Set();
    const configChoices = {};
    let lowestLevel = 0;

    for (const option of options) {
      // {
      //   "componentId": 13856091,
      //   "componentTypeId": 1960452172,
      //   "definition": {
      //     "id": 3727501,
      //     "entityTypeId": 306912077,
      //     "name": "Breath Weapon (Cold)",
      //     "description": "<p>When you take the Attack action on your turn, you can replace one of your attacks with an exhalation of magical energy in either a 15-foot Cone or a 30-foot Line that is 5 feet wide (choose the shape each time). Each creature in that area must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 Cold damage. On a successful save, a creature takes half as much damage. This damage increases by 1d10 when you reach character levels 5 (2d10), 11 (3d10), and 17 (4d10).</p>\r\n<p>You can use this Breath Weapon a number of times equal to your Proficiency Bonus, and you regain all expended uses when you finish a Long Rest.</p>",
      //     "snippet": "When you take the Attack action on your turn, you can replace one attack with a breath weapon that is a 15-ft. Cone or a 30-ft. Line that’s 5 ft. wide (choose the shape each time). Each creature must make a DC {{savedc:con}} Dex. saving throw taking {{1+((1+characterlevel)/6)@rounddown}}<strong>d10</strong> Cold damage on a failed save or half as much damage on a success.",
      //     "activation": null,
      //     "sourceId": null,
      //     "sourcePageNumber": 187,
      //     "creatureRules": [],
      //     "spellListIds": []
      //   }
      // },
      const traits = [];

      const matchFlags = {
        "id": option.componentId,
        "isChoiceFeature": true,
        "dndbeyond.entityRaceId": this.race.entityRaceId,
        "dndbeyond.choice.parentName": trait.name,
        "entityTypeId": option.componentTypeId,
        "dndbeyond.choice.entityTypeId": option.definition.entityTypeId,
      };

      const compendiumFeatures = this.getCompendiumIxByFlags(["traits"], matchFlags, true);

      if (compendiumFeatures) {
        traits.push(...compendiumFeatures);
        for (const compendiumFeature of compendiumFeatures) {
          uuids.add(compendiumFeature.uuid);
        }
      } else if (this.isMuncher && this.addToCompendium) {
        logger.verbose(`Could not find choice trait compendium options for trait ${trait.name}`, {
          this: this,
          trait,
          option,
        });
      }

      // build a list of options for each choice
      const level = trait.requiredLevel ?? 0;
      configChoices[level] = { count: 1, replacement: false };

      this.choiceMap.set(`${option.componentId}-${option.componentTypeId}`, traits);
      foundry.utils.setProperty(CONFIG.DDBI, `muncher.debug.race.${this.name}${this.version}.trait.${trait.name}.compendiumOptions`, traits);
    }

    if (uuids.size === 0) {
      logger.warn(`No valid traits options found for advancement of trait ${trait.name}, you can ignore this message unless you think this trait should offer an advancement choice.`);
      return;
    }
    if (Object.keys(configChoices).length === 0) {
      logger.warn(`No valid options found for advancement of trait ${trait.name}, you can ignore this message unless you think this trait should offer an advancement choice.`);
      return;
    }

    const forceReplace = DDBRace.FORCE_ADVANCEMENT_REPLACE.includes(trait.name);
    this.configChoices[trait.name] = AdvancementHelper.getChoiceReplacements(trait.description ?? trait.snippet ?? "", lowestLevel, configChoices, forceReplace);
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();

    advancement.updateSource({
      title: utils.nameString(trait.name),
      hint: trait.snippet ?? trait.description ?? "",
      configuration: {
        restriction: {
          type: "race",
        },
        choices: configChoices,
        type: "feat",
        pool: Array.from(uuids).map((f) => {
          return { uuid: f };
        }),
        allowDrops: true,
      },
      icons: "icons/magic/symbols/cog-orange-red.webp",
    });

    // console.warn(`Generated choice advancement for feature ${feature.name}:`, {
    //   advancement,
    //   this: this,
    //   feature,
    //   choices,
    //   uuids,
    // });

    // eslint-disable-next-line no-warning-comments
    // TODO: handle chosen advancements on non muncher races
    this._addAdvancement(advancement.toObject());

  }

  async #generateTraitAdvancementChoicesIfOption(trait) {
    logger.verbose(`Attempting to generate choice advancement for trait ${trait.name} without explicit choices`);
    const optionMatches = this.ddbData.character.options["race"]
      .filter(
        (option) =>
          trait.entityTypeId == option.componentTypeId
          && trait.id == option.componentId,
      );
    if (optionMatches.length === 0) return;
    await this.#generateTraitOptionAdvancement(trait, optionMatches);
  }

  async #generateTraitAdvancementChoices(raceTraits) {
    // for choice traits such as fighting styles:
    // for each trait with typ3 choices, build an item choice advancement
    // then search for matching traits from the choicedefintiions.
    for (const trait of raceTraits) {
      // ensure we have fleshed out choice data
      DDBDataUtils.getChoices({
        ddb: this.ddbData,
        type: "race",
        feat: trait,
        selectionOnly: false,
      });

      if ((this.isLineage && this.lineageTrait.componentId === trait.id)
        || (DDBRace.FORCE_TRAIT_GRANT.includes(trait.name))) {
        logger.debug(`Skipping trait for choice advancement: ${trait.name}`);
        continue;
      }

      const choices = this.ddbData.character.choices.race
        .filter((choice) =>
          [3, 8].includes(choice.type) // choice feature
          && (!choice.defaultSubtypes || choice.defaultSubtypes.length === 0) // this kind of feature grants a fixed thing
          && choice.componentId === trait.id,
        );

      logger.verbose(`Checking trait for choices: ${trait.name}`, { trait, this: this, choices });
      if (choices.length === 0) {
        await this.#generateTraitAdvancementChoicesIfOption(trait);
        continue;
      }

      // eslint-disable-next-line no-warning-comments
      // TODO: determine if different traits at each level, if so, create multiple advancements
      await this.#generateTraitChoiceAdvancement(trait, choices);
    }
  }

  async #generateTraitAdvancements() {
    logger.debug(`Parsing ${this.name} traits for advancement`);
    this.featureAdvancements = [];
    const raceTraits = this.race.racialTraits
      .map((t) => t.definition)
      .filter((trait) =>
        !DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS.includes(trait.name)
        || (this.is2014 && DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(trait.name)));
    for (const trait of raceTraits) {
      await this.#generateTraitAdvancementFromCompendiumMatch(trait);
    }
    this.data.system.advancement = this.data.system.advancement.concat(this.featureAdvancements);

    // for choice traits such as fighting styles:
    // for each trait with typ3 choices, build an item choice advancement
    // then search for matching traits from the choicedefintiions.
    await this.#generateTraitAdvancementChoices(raceTraits);

    foundry.utils.setProperty(CONFIG.DDBI, `muncher.debug.race.${this.name}${this.version}.choiceMap`, this.choiceMap);


  }

  #generateConditionAdvancement(trait) {
    // TO DO: Dragonborn Resistance choice advancement
    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getConditionAdvancement(mods, trait, 0);
    if (advancement) this._addAdvancement(advancement.toObject());
  }

  /**
   * Finds a match in the compendium trait for the given feature.
   *
   * @param {object} trait The trait to find a match for.
   * @returns {object|undefined} - The matched feature, or undefined if no match is found.
   */
  #getTraitCompendiumMatch(trait) {
    if (!this._compendiums.traits) {
      return null;
    }
    logger.debug(`Getting trait match for ${trait.name}`);
    const traitName = utils.nameString(trait.name);

    const findTraits = (excludeFlags = {}, looseMatch = true, choiceMatch = false) => {
      const results = this._compendiums.traits.index.filter((match) => {
        const matchFlags = foundry.utils.getProperty(match, "flags.ddbimporter.featureMeta")
          ?? foundry.utils.getProperty(match, "flags.ddbimporter");
        if (!matchFlags) return false;
        const matchName = foundry.utils.getProperty(matchFlags, "originalName")?.trim()
          ?? match.name.trim();
        const nameMatch = traitName.toLowerCase() === matchName.toLowerCase();
        const isIdMatch = trait.id === matchFlags.id;
        if (!nameMatch && looseMatch) {
          const containsMatch = traitName.toLowerCase().includes(matchName);
          if (!containsMatch || !isIdMatch) return false;
        } else if (nameMatch && !looseMatch && !isIdMatch) {
          return false;
        }
        for (const [key, value] of Object.entries(excludeFlags)) {
          if (matchFlags[key] === value) return false;
        }

        const traitMatch
          = matchFlags.fullRaceName == this.race.fullName
            || (matchFlags.groupName == this.groupName
              && matchFlags.isLineage == this.isLineage);

        if (choiceMatch && traitMatch) {
          const choice = this.#getTraitChoice(trait);
          if (!choice) return false;
          const choiceOptionMatch = foundry.utils.getProperty(matchFlags, "dndbeyond.choice.optionId") === choice.id;
          if (!choiceOptionMatch) return false;
        }
        return traitMatch;
      });
      return results;
    };

    const exactMach = findTraits.call(this, {}, false);
    const firstPass = findTraits.call(this);

    if (this.isLineage && this.lineageTrait.componentId === trait.id) {
      const lineageMatch = findTraits.call(this, {}, false, true);
      if (lineageMatch.length === 0) {
        logger.warn(`No compendium trait match found for lineage trait ${trait.name}`, {
          trait,
          lineageMatch,
          this: this,
          exactMach,
          firstPass,
        });
        return null;
      } else if (lineageMatch.length > 1) {
        logger.warn(`Multiple compendium trait matches found for lineage trait ${trait.name}`, {
          trait,
          lineageMatch,
          this: this,
        });
        return null;
      }
      return lineageMatch[0];
    }

    if (firstPass.length === 1) {
      return firstPass[0];
    } else if (firstPass.length > 1) {
      const secondPass = findTraits.call(this, {
        "isChoice": true,
      });
      if (secondPass.length === 1) {
        return secondPass[0];
      } else if (secondPass.length > 1 && exactMach.length === 1) {
        return exactMach[0];
      } else if (secondPass.length > 1) {
        logger.warn(`Multiple compendium trait matches found for trait ${trait.name}, even after filtering choices. This is likely okay and a choice feature will be generated`, {
          firstPass,
          secondPass,
          exactMach,
          trait,
          this: this,
        });
      } else {
        logger.warn(`Unable to find match found for trait ${trait.name}.`, {
          firstPass,
          secondPass,
          exactMach,
          trait,
          this: this,
        });
      }


    }
    return null;
  }


  async #generateTraitAdvancementFromCompendiumMatch(trait) {
    const traitMatch = this.#getTraitCompendiumMatch(trait);

    if (!traitMatch) return;

    const shouldInclude = !DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS.includes(trait.name)
      || (this.is2014 && DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(trait.name));
    if (!shouldInclude) return;

    if (this.traitAdvancementUuids.has(traitMatch.uuid)) return;
    this.traitAdvancementUuids.add(traitMatch.uuid);

    const requiredLevel = trait.requiredLevel ?? 0;
    const levelAdvancement = this.traitAdvancements.findIndex((advancement) => advancement.level === requiredLevel);

    if (levelAdvancement == -1) {
      const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
      this._advancementMatches.traits[advancement._id] = {};
      this._advancementMatches.traits[advancement._id][traitMatch.name] = traitMatch.uuid;

      const update = {
        configuration: {
          items: [{ uuid: traitMatch.uuid }],
        },
        value: {},
        level: requiredLevel,
        title: "Traits",
        icon: "",
        classRestriction: "",
      };
      advancement.updateSource(update);
      const obj = advancement.toObject();
      this.traitAdvancements.push(obj);
      this._addAdvancement(obj);
    } else {
      this.traitAdvancements[levelAdvancement].configuration.items.push({ uuid: traitMatch.uuid, optional: false });
      this._advancementMatches.traits[this.traitAdvancements[levelAdvancement]._id][traitMatch.name] = traitMatch.uuid;
    }
  }

  linkSpells(ddbCharacter) {
    logger.warn("Linking Spells to Race", {
      DDBRace: this,
      ddbCharacter,
    });

    const validSpells = ddbCharacter.data.spells.filter((spell) => {
      return spell.flags.ddbimporter.dndbeyond.lookup === "race"
        && !spell.flags.ddbimporter.dndbeyond.usesSpellSlot;
    });

    ddbCharacter.data.race.system.advancement
      .filter((a) =>
        foundry.utils.hasProperty(a, "configuration.spell")
        && this.spellLinks.some((l) => l.advancementId === a._id),
      )
      .forEach((a, idx, advancements) => {
        const addedSpells = {};
        let ability;
        const spellLinkMatch = this.spellLinks.find((l) => l.advancementId === a._id);

        for (const spell of validSpells) {
          const spellUuidMatch = spellLinkMatch.uuids.find((l) =>
            l.name.toLowerCase() === spell.flags.ddbimporter.originalName.toLowerCase(),
          );
          if (!spellUuidMatch) continue;

          if (spell.flags.ddbimporter.dndbeyond.ability) ability = spell.flags.ddbimporter.dndbeyond.ability;
          logger.debug(`Advancement Race ${a._id} found Spell ${spell.name} (${spellUuidMatch.uuid})`);

          if (a.type === "ItemChoice") {
            if (!foundry.utils.hasProperty(addedSpells, "0")) {
              addedSpells["0"] = {};
            }
            addedSpells["0"][spell._id] = spellUuidMatch.uuid;
          } else {
            addedSpells[spell._id] = spellUuidMatch.uuid;
          }
          foundry.utils.setProperty(spell, "flags.dnd5e.sourceId", spellUuidMatch.uuid);
          foundry.utils.setProperty(spell, "flags.dnd5e.advancementOrigin", `${this.data._id}.${a._id}`);
        }

        a.value = {
          ability,
          added: addedSpells,
        };

        advancements[idx] = a;
      });

  }

  linkFeatures() {
    logger.debug("Linking Advancements to Feats for Race", {
      DDBRace: this,
      ddbCharacter: this.ddbCharacter,
    });


    this.ddbCharacter.data.race.system.advancement.forEach((a, idx, advancements) => {
      if (["ItemChoice", "ItemGrant"].includes(a.type) && (!a.level || a.level <= this.ddbCharacter.totalLevels)) {
        const addedFeats = {};

        for (const type of ["features"]) {
          for (const feat of this.ddbCharacter.data[type]) {
            const isMatch = feat.type === "feat"
              && feat.system.type.value === "feat"
              && feat.flags.ddbimporter.type === "feat"
              && feat.name.startsWith(this.featLink.name);

            // eslint-disable-next-line no-continue
            if (!isMatch) continue;

            logger.debug(`Advancement Race ${a._id} found Feature ${feat.name} (${this.featLink.uuid})`);
            addedFeats[feat._id] = this.featLink.uuid;
            foundry.utils.setProperty(feat, "flags.dnd5e.sourceId", this.featLink.uuid);
            foundry.utils.setProperty(feat, "flags.dnd5e.advancementOrigin", `${this.data._id}.${a._id}`);
          }

          // console.warn("Post feat match for advancement", {
          //   addedFeats,
          // });

          if (Object.keys(addedFeats).length > 0) {
            const added = {
              "0": addedFeats,
              // {
              //   "IRs6OOXQk3AvK3GW": "Compendium.world.ddb-test2-ddb-feats.Item.cHie2wNgxBG9m62F"
              // },
            };

            a.value = {
              added,
            };
            advancements[idx] = a;
          }
        }
      }
    });
    logger.debug("Processed race advancements", this.ddbCharacter.data.race.system.advancement);
  }

  #generateHTMLSenses() {
    const textDescription = AdvancementHelper.stripDescription(this.data.system.description.value);

    // You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light
    // You can see in dim light within 120 feet of you as if it were bright light and in darkness as if it were dim light.
    const darkVisionRegex = /you can see in dim light within (\d+) feet of you as if it were bright light/im;
    const darkVisionMatch = textDescription.match(darkVisionRegex);

    if (darkVisionMatch) {
      this.data.system.senses.darkvision = parseInt(darkVisionMatch[1]);
    }
  }

  #generateSenses() {
    for (const senseName in this.data.system.senses) {
      const basicOptions = {
        subType: senseName,
      };
      const senseModifiers = [
        ...DDBModifiers.filterModifiers((this.ddbData.character?.modifiers?.race ?? []), "sense", basicOptions),
        ...DDBModifiers.filterModifiers((this.ddbData.character?.modifiers?.race ?? []), "set-base", basicOptions),
      ];
      senseModifiers
        .filter((mod) => {
          // we remove senses that are granted as part of a choice feature for the species
          const isChoiceModifier = this.ddbData.character.choices.choiceDefinitions.some((def) =>
            def.options.some((opt) => opt.id === mod.componentId),
          );
          return !isChoiceModifier;
        })
        .forEach((mod) => {
          if (Number.isInteger(mod.value) && mod.value > this.data.system.senses[senseName]) {
            this.data.system.senses[senseName] = parseInt(mod.value);
          }
        });
    }
  }

  #fix2024DragonBorn() {
    if (!this.data.name.startsWith("Dragonborn")) return;
    const breathWeapon = {
      _id: foundry.utils.randomID(),
      type: "ScaleValue",
      configuration: {
        distance: { units: "" },
        identifier: `breath-weapon`,
        type: "dice",
        scale: {
          1: {
            number: 1,
            faces: 10,
          },
          5: {
            number: 2,
            faces: 10,
          },
          11: {
            number: 3,
            faces: 10,
          },
          17: {
            number: 4,
            faces: 10,
          },
        },
      },
      value: {},
      title: `Breath Weapon Dice`,
      icon: null,
    };
    this._addAdvancement(breathWeapon);
  }

  #fix2024Aasimar() {
    if (!this.data.name.startsWith("Aasimar")) return;
    for (let advancement of this.data.system.advancement) {
      if (advancement.title !== "Celestial Revelation") continue;
      advancement.type = "ItemGrant";
      advancement.configuration.items = foundry.utils.deepClone(advancement.configuration.pool);
      delete advancement.configuration.pool;
      delete advancement.configuration.choices;
      delete advancement.configuration.allowDrops;
    }
  }

  #advancementFixes() {
    if (this.is2014) return;
    this.#fix2024DragonBorn();
    this.#fix2024Aasimar();

  }

  async build() {
    try {
      await this._generateRaceImage();
    } catch (e) {
      logger.error("Error generating race image, probably because you don't have permission to browse the host file system.", { e });
    }

    await this._buildCompendiumIndex("traits", this._indexFilter.traits);
    await this._buildCompendiumIndex("feats", this._indexFilter.feats);

    for (const t of this.race.racialTraits) {
      const trait = t.definition;
      logger.debug(`Processing trait: ${trait.name}`, {
        trait,
        this: this,
      });
      this.#addFeatureDescription(trait);
      this.#typeCheck(trait);
      this.#flightCheck(trait);

      this.#generateSkillAdvancement(trait);
      this.#generateLanguageAdvancement(trait);
      this.#generateToolAdvancement(trait);
      this.#generateFeatAdvancement(trait);
      this.#generateConditionAdvancement(trait);
      await this.#generateSpellAdvancement(trait);
    }

    await this.#generateTraitAdvancements();
    this.#generateAbilityAdvancement();
    this.#advancementFixes();
    this.#generateSenses();

    // set final type
    foundry.utils.setProperty(this.data, "system.type.value", this.type);

    // finally a tag parse to update the description
    this.data.system.description.value = DDBReferenceLinker.parseTags(this.data.system.description.value);

    logger.debug("Race generated", { DDBRace: this });
  }

  static async getRacialTraitsLookup(racialTraits, fail = true) {
    const compendium = CompendiumHelper.getCompendiumType("traits", fail);
    if (compendium) {
      const flags = ["name", "flags.ddbimporter.entityRaceId", "flags.ddbimporter.baseName"];
      const index = await compendium.getIndex({ fields: flags });
      const traitIndex = await index.filter((i) => racialTraits.some((orig) => i.name === orig.name));
      return traitIndex;
    } else {
      return [];
    }
  }

  async addToCompendium(update = null, compendiumImportTypes = ["species"]) {
    if (!compendiumImportTypes.includes("species")) return;
    const updateFeatures = update ?? game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    const traitHandlerOptions = {
      chrisPremades: true,
      matchFlags: ["baseRaceId", "fullRaceName", "groupName", "isLineage", "is2014", "isLegacy"],
      useCompendiumFolders: true,
      deleteBeforeUpdate: false,
      indexFilter: {
        fields: [
          "name",
          "flags.ddbimporter",
        ],
      },
    };

    const traitCompendiumFolders = new DDBCompendiumFolders("traits");
    await traitCompendiumFolders.loadCompendium("traits");
    await traitCompendiumFolders.createSubTraitFolders(this.data);
    const race = foundry.utils.deepClone(this.data);

    for (const advancement of race.system.advancement) {
      delete advancement.value;
    }

    const speciesHandler = await DDBItemImporter.buildHandler("race", [race], updateFeatures, traitHandlerOptions);
    await speciesHandler.buildIndex(traitHandlerOptions.indexFilter);

  }

}

