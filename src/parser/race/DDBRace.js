import { SETTINGS, DICTIONARY } from "../../config/_module.mjs";
import { utils, logger, CompendiumHelper, FileHelper, DDBCompendiumFolders, DDBItemImporter, DDBSources } from "../../lib/_module.mjs";
import AdvancementHelper from "../advancements/AdvancementHelper.js";
import { DDBModifiers, DDBReferenceLinker, DDBDataUtils, SystemHelpers } from "../lib/_module.mjs";


export default class DDBRace {

  static SPECIAL_ADVANCEMENTS = {};

  static EXCLUDED_FEATURE_ADVANCEMENTS = [];

  static EXCLUDED_FEATURE_ADVANCEMENTS_2014 = [];

  static FORCE_SUBRACE_2024 = [
    "Elf",
    "Gnome",
    "Tiefling",
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

  #getLineageTrait() {
    if (this.is2014) return null;
    if (DDBRace.FORCE_SUBRACE_2024.includes(this.race.baseRaceName)) {
      const lineageTrait = this.race.racialTraits.find((r) => r.definition.name.includes("Lineage") || r.definition.name.includes("Fiendish Legacy"));
      if (!lineageTrait) return null;
      const choice = DDBDataUtils.getChoices({ ddb: this.ddbData, type: "race", feat: lineageTrait, selectionOnly: true });
      this.isLineage = true;
      return choice[0];
    }
    return null;
  }

  #getFullName() {
    const baseName = this.race.fullName ?? this.race.name;
    const lineageName = this.lineageName;
    if (lineageName) return lineageName;
    return baseName;
  }

  constructor(ddbData, race, compendiumRacialTraits, isGeneric = false) {
    this.ddbData = ddbData;
    this.race = race;
    this.is2014 = this.race.sources.some((s) => {
      const force2014 = DICTIONARY.source.is2014.includes(s.sourceId);
      if (force2014) return true;
      const force2024 = DICTIONARY.source.is2024.includes(s.sourceId);
      if (force2024) return false;
      return Number.isInteger(s.sourceId) && s.sourceId < 145;
    });

    this.isLegacy = this.race.isLegacy;
    this.#fixups();
    this.compendiumRacialTraits = compendiumRacialTraits;
    this._generateDataStub();
    this.type = "humanoid";
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.isLineage = false;
    this.lineageTrait = this.#getLineageTrait();
    this.fullName = this.#getFullName();

    this.data.name = utils.nameString(this.fullName);
    this.data.system.description.value += `${this.race.description}\n\n`;

    this.isLegacy = this.race.isLegacy;
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

    this.data.system.source = DDBSources.parseSource(this.race);

    if (this.race.isSubRace && this.race.baseRaceName) this.data.system.requirements = this.race.baseRaceName;
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    if (legacyName && this.race.isLegacy) {
      this.data.name += " (Legacy)";
    }

    this.#addWeightSpeeds();
    this.#addSizeAdvancement();

    this.abilityAdvancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();

    this.isGeneric = isGeneric || ddbData === null;

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: "race",
      noMods: this.isGeneric,
    });

    this.featLink = {
      advancementId: null,
      name: null,
      uuid: null,
    };

    this.spellLinks = [];

    // compendium
    this._compendiums = {
      traits: CompendiumHelper.getCompendiumType("traits", false),
    };
    this._indexFilter = {
      traits: {
        fields: [
          "name",
          "flags.ddbimporter.fullRaceName",
          "flags.ddbimporter.groupName",
          "flags.ddbimporter.isLineage",
          "flags.ddbimporter.featureMeta",
          "flags.ddbimporter.baseName",
          "flags.ddbimporter.entityRaceId",
        ],
      },
    };

    this._advancementMatches = {
      traits: {},
    };

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

    const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
    this.data.system.description.value += image;
    return image;
  }

  #typeCheck(trait) {
    if (trait.name.trim() !== "Creature Type") return;
    const typeRegex = /You are an? (\S*)\./i;
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
      const size = DICTIONARY.actor.actorSizes.find((s) => s.id === this.race.sizeId);
      advancement.updateSource({ configuration: { sizes: [size.value] } });
    }

    this.data.system.advancement.push(advancement.toObject());
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
    if (!this.is2014) return;
    this.race.racialTraits.forEach((t) => {
      const trait = t.definition;
      if (!["Ability Score Increase", "Ability Score Increases"].includes(trait.name.trim())) return;
      this.#addAbilityScoreAdvancement(trait);
    });
    this.data.system.advancement.push(this.abilityAdvancement.toObject());
  }

  // skills, e.g. variant human
  #generateSkillAdvancement(trait) {
    // if (!["Skills"].includes(trait.name.trim())) return;

    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, "race")
        .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.actor.skills.map((s) => s.subType).includes(mod.subType),
    );
    const advancement = this.advancementHelper.getSkillAdvancement(skillExplicitMods, trait, undefined, 0);

    if (advancement) this.data.system.advancement.push(advancement.toObject());
  }

  #generateLanguageAdvancement(trait) {
    // if (!["Languages"].includes(trait.name.trim())) return;

    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, "race")
        .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, trait, 0);
    if (advancement) this.data.system.advancement.push(advancement.toObject());
  }

  #generateToolAdvancement(trait) {
    // if (!["Tools"].includes(trait.name.trim())) return;

    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, "race")
        .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getToolAdvancement(mods, trait, 0);
    if (advancement) this.data.system.advancement.push(advancement.toObject());
  }

  static async getCompendiumSpellUuidsFromNames(names) {
    const spellChoice = game.settings.get("ddb-importer", "munching-policy-force-spell-version");
    const spells = await CompendiumHelper.retrieveCompendiumSpellReferences(names, {
      use2024Spells: spellChoice === "FORCE_2024",
    });

    if (spells.length > 0) {
      return spells.map((s) => {
        return { uuid: s.uuid, name: s.name };
      });
    }
    return [];
  }

  async #getCantripChoiceAdvancement({ choices = [], abilities = [], hint = "", name, spellListChoice = null } = {}) {
    if (choices.length === 0 && !spellListChoice) return undefined;
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();
    const uuids = await DDBRace.getCompendiumSpellUuidsFromNames(choices);

    this.spellLinks.push({
      type: "choice",
      advancementId: advancement._id,
      choices,
      uuids,
      level: 0,
    });

    advancement.updateSource({
      title: name,
      hint,
      configuration: {
        allowDrops: false,
        pool: uuids,
        choices: {
          "0": {
            count: 1,
            replacement: false,
          },
          replacement: {
            count: null,
            replacement: false,
          },
        },
        restriction: {
          level: "0",
          type: "spell",
        },
        type: "spell",
        spell: {
          ability: abilities,
          preparation: "",
          uses: {
            max: "",
            per: "",
            requireSlot: false,
          },
        },
      },
    });
    if (uuids.length > 0 || spellListChoice) return advancement;

    return undefined;
  }

  async #getCantripGrantAdvancement({ choices = [], abilities = [], hint = "", name } = {}) {
    if (choices.length === 0) return undefined;
    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const uuids = await DDBRace.getCompendiumSpellUuidsFromNames(choices);

    this.spellLinks.push({
      type: "grant",
      advancementId: advancement._id,
      choices,
      uuids,
      level: 1,
    });

    advancement.updateSource({
      title: name,
      level: 1,
      configuration: {
        items: uuids.map((s) => {
          s.optional = false;
          return s;
        }),
        type: "spell",
        spell: {
          ability: abilities,
          preparation: "",
          uses: {
            max: "",
            per: "",
            requireSlot: false,
          },
        },
      },
      hint,
    });
    if (uuids.length > 0) return advancement;

    return undefined;
  }

  async #getSpellGrantAdvancement({ spellGrant, abilities = [], hint = "", name } = {}) {
    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const uuids = await DDBRace.getCompendiumSpellUuidsFromNames([spellGrant.name]);

    this.spellLinks.push({
      type: "grant",
      advancementId: advancement._id,
      choices: [spellGrant],
      uuids,
      level: spellGrant.level,
    });

    advancement.updateSource({
      title: name,
      level: spellGrant.level,
      configuration: {
        items: uuids.map((s) => {
          s.optional = false;
          return s;
        }),
        type: "spell",
        spell: {
          ability: abilities,
          preparation: "always",
          uses: {
            max: spellGrant.amount === "" ? "" : spellGrant.amount,
            per: spellGrant.amount === "" ? "" : "lr",
            requireSlot: false,
          },
        },
      },
      hint,
    });

    if (uuids.length > 0) return advancement;
    return advancement;
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

    logger.debug("Spell Advancement Data", {
      htmlData,
      this: this,
      trait,
      abilityData,
      name,
      hint,
    });

    const cantripChoiceAdvancement = await this.#getCantripChoiceAdvancement({
      choices: htmlData.cantripChoices,
      abilities: abilityData.abilities,
      hint,
      name,
      spellListChoice: htmlData.spellListCantripChoice,
    });
    if (cantripChoiceAdvancement) {
      advancements.push(cantripChoiceAdvancement);
    }

    const cantripGrantAdvancement = await this.#getCantripGrantAdvancement({
      choices: htmlData.cantripGrants,
      abilities: abilityData.abilities,
      hint,
      name,
    });
    if (cantripGrantAdvancement) {
      advancements.push(cantripGrantAdvancement);
    }

    for (const spellGrant of htmlData.spellGrants) {
      const spellGrantAdvancement = await this.#getSpellGrantAdvancement({
        spellGrant,
        abilities: abilityData.abilities,
        hint,
        name,
      });
      if (spellGrantAdvancement) {
        advancements.push(spellGrantAdvancement);
      }
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
      this.data.system.advancement.push(advancement.toObject());
    });

  }

  async #generateFeatAdvancement(trait) {
    if (!["Feats", "Feat"].includes(trait.name.trim())) return;

    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();

    const compendium = CompendiumHelper.getCompendiumType("feats", false);
    const index = compendium ? await compendium.getIndex() : [];

    advancement.updateSource({
      title: "Feat",
      configuration: {
        allowDrops: true,
        pool: index.map((i) => i.uuid),
        choices: {
          "0": 1,
        },
        restriction: {
          type: "feat",
        },
      },
    });

    this.data.system.advancement.push(advancement.toObject());

    const feat = this.ddbData?.character?.feats?.find((f) =>
      f.componentId === trait.id
      && f.componentTypeId === trait.entityTypeId,
    );
    if (!feat) {
      logger.warn(`Unable to link advancement to feat`, { advancement, trait, this: this });
      return;
    };
    const featMatch = index.find((i) => i.name === feat.definition.name);
    if (!featMatch) {
      logger.warn(`Unable to link advancement to feat ${feat.definition.name}, this is probably because the feats have not been munched to the compendium`, { feat });
      return;
    }

    this.featLink.advancementId = advancement._id;
    this.featLink.name = feat.definition.name;
    this.featLink.uuid = featMatch.uuid;

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

  #generateConditionAdvancement(trait) {
    const mods = this.advancementHelper.noMods
      ? []
      : DDBModifiers.getModifiers(this.ddbData, "race")
        .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getConditionAdvancement(mods, trait, 0);
    if (advancement) this.data.system.advancement.push(advancement.toObject());
  }

  /**
   * Finds a match in the compendium trait for the given feature.
   *
   * @param {object} trait The trait to find a match for.
   * @returns {object|undefined} - The matched feature, or undefined if no match is found.
   */
  #getTraitCompendiumMatch(trait) {
    if (!this._compendiums.traits) {
      return [];
    }
    logger.debug(`Getting trait match for ${trait.name}`);
    return this._compendiums.traits.index.find((match) => {
      const matchFlags = foundry.utils.getProperty(match, "flags.ddbimporter.featureMeta")
        ?? foundry.utils.getProperty(match, "flags.ddbimporter");
      if (!matchFlags) return false;
      const featureFlagName = foundry.utils.getProperty(matchFlags, "originalName")?.trim().toLowerCase();
      const featureFlagNameMatch = featureFlagName
        && featureFlagName == trait.name.trim().toLowerCase();
      const nameMatch = !featureFlagNameMatch
        && match.name.trim().toLowerCase() == trait.name.trim().toLowerCase();

      if (!nameMatch && !featureFlagNameMatch) {
        logger.verbose(`Unable to find ${trait.name} in compendium`, { trait, matchFlags, match });
        return false;
      }

      const traitMatch
        = matchFlags.fullRaceName == this.race.fullName
          || (matchFlags.groupName == this.groupName
            && matchFlags.isLineage == this.isLineage);
      return traitMatch;
    });
  }

  traitAdvancements = [];

  async #generateTraitAdvancementFromCompendiumMatch(trait) {
    const traitMatch = this.#getTraitCompendiumMatch(trait);

    if (!traitMatch) return;

    const shouldInclude = !DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS.includes(trait.name)
      || (this.is2014 && DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(trait.name));
    if (!shouldInclude) return;
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
      this.data.system.advancement.push(obj);
    } else {
      this.traitAdvancements[levelAdvancement].configuration.items.push({ uuid: traitMatch.uuid, optional: false });
      this._advancementMatches.traits[this.traitAdvancements[levelAdvancement]._id][traitMatch.name] = traitMatch.uuid;
    }
  }

  linkSpells(ddbCharacter) {
    logger.debug("Linking Spells to Race", {
      DDBRace: this,
      ddbCharacter,
    });

    ddbCharacter.data.race.system.advancement
      .filter((a) => foundry.utils.hasProperty(a, "configuration.spell"))
      .forEach((a, idx, advancements) => {
        const addedSpells = {};
        let ability;

        for (const spell of ddbCharacter.data.spells) {
          const valid = spell.flags.ddbimporter.dndbeyond.lookup === "race"
            && !spell.flags.ddbimporter.dndbeyond.usesSpellSlot;
          if (!valid) continue;

          const spellLinkMatch = this.spellLinks.find((l) => l.advancementId === a._id);
          if (!spellLinkMatch) continue;

          const spellUuidMatch = spellLinkMatch.find((l) =>
            l.name.toLowerCase() === spell.flags.ddbimporter.originalName.toLowerCase(),
          );
          if (!spellUuidMatch) continue;

          if (spell.flags.ddbimporter.dndbeyond.ability) ability = spell.flags.ddbimporter.dndbeyond.ability;

          logger.debug(`Advancement Race ${a._id} found Spell ${spell.name} (${spellUuidMatch.uuid})`);
          addedSpells[spell._id] = spellUuidMatch.uuid;
          foundry.utils.setProperty(spell, "flags.dnd5e.sourceId", spellUuidMatch.uuid);
          foundry.utils.setProperty(spell, "flags.dnd5e.advancementOrigin", `${this.data._id}.${a._id}`);
        }

        if (a.type === "ItemChoice") {
          a.value = {
            ability,
            added: {
              "0": addedSpells,
            },
          };
        } else {
          a.value = {
            ability,
            added: addedSpells,
          };
        }

        advancements[idx] = a;
      });

  }

  linkFeatures(ddbCharacter) {
    logger.debug("Linking Advancements to Feats for Race", {
      DDBRace: this,
      ddbCharacter,
    });

    ddbCharacter.data.race.system.advancement.forEach((a, idx, advancements) => {
      if (a.type === "ItemChoice") {
        const addedFeats = {};

        for (const type of ["actions", "features"]) {
          for (const feat of ddbCharacter.data[type]) {
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
    logger.debug("Processed race advancements", ddbCharacter.data.race.system.advancement);
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
    if (this.isGeneric) {
      this.#generateHTMLSenses();
      return;
    }
    for (const senseName in this.data.system.senses) {
      const basicOptions = {
        subType: senseName,
      };
      DDBModifiers.filterModifiers((this.ddbData?.character?.modifiers?.race ?? []), "sense", basicOptions).forEach((sense) => {
        if (Number.isInteger(sense.value) && sense.value > this.data.system.senses[senseName]) {
          this.data.system.senses[senseName] = parseInt(sense.value);
        }
      });
      DDBModifiers.filterModifiers((this.ddbData?.character?.modifiers?.race ?? []), "set-base", basicOptions).forEach((sense) => {
        if (Number.isInteger(sense.value) && sense.value > this.data.system.senses[senseName]) {
          this.data.system.senses[senseName] = parseInt(sense.value);
        }
      });
    }
  }

  // #generateScaleValueAdvancements() {
  //   for (const trait of this.race.racialTraits) {
  //     continue;
  //     let specialFeatures = [];
  //     let advancement = AdvancementHelper.generateScaleValueAdvancement(trait);
  //     const specialLookup = DDBRace.SPECIAL_ADVANCEMENTS[advancement.title];
  //     if (specialLookup) {
  //       if (specialLookup.additionalAdvancements) {
  //         specialLookup.additionalFunctions.forEach((fn) => {
  //           specialFeatures.push(fn(advancement));
  //         });
  //       }
  //       if (specialLookup.fixFunction) advancement = specialLookup.fixFunction(advancement, specialLookup.functionArgs);
  //     }
  //     this.data.system.advancement.push(advancement);
  //     this.data.system.advancement.push(...specialFeatures);
  //   }
  // }

  #advancementFixes() {
    if (this.is2014) return;
    if (this.data.name.startsWith("Dragonborn")) {
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
      this.data.system.advancement.push(breathWeapon);
    }

  }

  async build() {
    try {
      await this._generateRaceImage();
    } catch (e) {
      logger.error("Error generating race image, probably because you don't have permission to browse the host file system.", { e });
    }

    await this._buildCompendiumIndex("traits", this._indexFilter.traits);

    for (const t of this.race.racialTraits) {
      const trait = t.definition;
      this.#addFeatureDescription(trait);
      this.#typeCheck(trait);
      this.#flightCheck(trait);

      this.#generateSkillAdvancement(trait);
      this.#generateLanguageAdvancement(trait);
      this.#generateToolAdvancement(trait);
      this.#generateFeatAdvancement(trait);
      this.#generateConditionAdvancement(trait);
      await this.#generateSpellAdvancement(trait);

      this.#generateTraitAdvancementFromCompendiumMatch(trait);
    }

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

  async addToCompendium() {
    if (!game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-add-features-to-compendiums")) return;
    const updateFeatures = game.settings.get(SETTINGS.MODULE_ID, "character-update-policy-update-add-features-to-compendiums");

    const traitHandlerOptions = {
      chrisPremades: true,
      matchFlags: ["fullRaceName", "groupName", "isLineage"],
      useCompendiumFolders: true,
      deleteBeforeUpdate: false,
    };

    const traitCompendiumFolders = new DDBCompendiumFolders("traits");
    await traitCompendiumFolders.loadCompendium("traits");

    if (this.isLineage) {
      await traitCompendiumFolders.createSubTraitFolders(this.groupName, this.groupName);
    } else {
      await traitCompendiumFolders.createSubTraitFolders(this.groupName, this.fullName);
    }

    const race = foundry.utils.deepClone(this.data);

    for (const advancement of race.system.advancement) {
      delete advancement.value;
    }

    const speciesHandler = await DDBItemImporter.buildHandler("race", [race], updateFeatures, traitHandlerOptions);
    await speciesHandler.buildIndex(traitHandlerOptions.indexFilter);

  }

}

