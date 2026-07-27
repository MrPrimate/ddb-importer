import { DICTIONARY } from "../../config/_module";
import { utils, logger, CompendiumHelper, FileHelper, DDBCompendiumFolders, DDBItemImporter, DDBSources } from "../../lib/_module";
import AdvancementHelper from "../advancements/AdvancementHelper";
import type DDBCharacter from "../DDBCharacter";
import { DDBModifiers, DDBReferenceLinker, DDBDataUtils, SystemHelpers } from "../lib/_module";

type TIndexEntry = CompendiumCollection.IndexEntry<CompendiumCollection.DocumentName>;

// type TRaceChoiceDocumentTypes = I5eFeatItem | I5eWeaponItem;

type TRaceCompendiumTypes = "traits";

const TRAIT_FIELDS = [
  "name",
  "flags.ddbimporter",
];

const FEAT_FIELDS = [
  "name",
  "flags.ddbimporter.id",
  // "flags.ddbimporter",
  "flags.ddbimporter.is2014",
  "flags.ddbimporter.is2024",
  "flags.ddbimporter.featureMeta",
  "flags.ddbimporter.subType",
  "system.type.subtype",
  "system.prerequisites.level",
];

interface ITraitIndexEntry extends TIndexEntry {
  flags: {
    ddbimporter: IDDBImporterItemFlags;
  };
}

interface IFeatIndexEntry extends TIndexEntry {
  flags: {
    ddbimporter: {
      id: number;
      is2014: boolean;
      is2024: boolean;
      featureMeta: Record<string, unknown>;
      subType: string;
    };
  };
  system: {
    type: {
      subtype: string;

    };
    prerequisites: {
      level: number;
    };
  };
}

type TRaceIndexEntries = ITraitIndexEntry | IFeatIndexEntry;

export default class DDBRace {

  // Properties set in constructor
  ddbCharacter: DDBCharacter;
  ddbData: IDDBData;
  isMuncher: boolean;
  race: IDDBRace;
  is2014: boolean;
  is2024: boolean;
  version: string;
  isLegacy: boolean;
  type: string;
  _compendiumLabel: string;
  fullName: string;
  baseRaceName: string;
  // the DDB race base name, e.g. "Elf" for "High Elf"
  get baseName(): string {
    return this.race.baseName;
  }

  groupName: string;
  isSubRace: boolean;
  legacy: boolean;
  advancementHelper: AdvancementHelper;
  name: string;
  // assigned by _generateDataStub() in the constructor before any read
  data!: I5eRaceItem;
  lineageTrait: IDDBChoiceResult | null;
  compendiumRacialTraits: TIndexEntry[];
  pendingSpeciesDocument: I5eRaceItem | null = null;
  abilityAdvancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement);
  isLineage = false;
  spellLinks: IDDBSpellLink[] = [];
  featLink: {
    advancementId: string | null;
    name: string | null;
    uuid: string | null;
  } = {
    advancementId: null,
    name: null,
    uuid: null,
  };

  choiceMap = new Map<string, TRaceIndexEntries[]>();
  configChoices: Record<string, TI5eAdvItemChoiceConfigChoices> = {};
  traitAdvancements: I5eAdvancement[] = [];
  traitAdvancementUuids = new Set();
  _indexFilter: Record<string, { fields?: string[] }> = {
    traits: {
      fields: TRAIT_FIELDS,
    },
    feats: {
      fields: FEAT_FIELDS,
    },
  };

  _advancementMatches: Record<TRaceCompendiumTypes, Record<string, Record<string, string>>> = {
    traits: {},
  };
  _compendiums: Record<string, CompendiumCollection<any> | undefined> = {
    traits: CompendiumHelper.getCompendiumType("traits", false),
    feats: CompendiumHelper.getCompendiumType("feats", false),
  };

  static SPECIES_HANDLER_OPTIONS = {
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
    recursive: false,
  };

  static SPECIAL_ADVANCEMENTS = {};

  static EXCLUDED_FEATURE_ADVANCEMENTS: string[] = [
    // "Age",
    // "Alignment",
  ];

  static EXCLUDED_FEATURE_ADVANCEMENTS_2014: string[] = [];

  static FORCE_ADVANCEMENT_REPLACE: string[] = [];
  static FORCE_TRAIT_SPELL_ADVANCEMENT_ON_RACE = DICTIONARY.parsing.forceTraitSpellAdvancementOnRace;

  static FORCE_SUBRACE_2024 = [
    "Elf",
    "Gnome",
    "Tiefling",
  ];

  static FORCE_TRAIT_GRANT: string[] = [
    // "Infernal Legacy",
    // "Fiendish Legacy",
    // "Elven Lineage",
    // "Gnomish Lineage",
  ];

  static getGroupName(ids: number[], baseRaceName: string) {
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
      effects: [],
      system: SystemHelpers.getTemplate("race"),
      flags: {
        ddbimporter: {
          type: "race",
        },
      },
      img: undefined,
    };
  }

  // the data stub always populates flags.ddbimporter and system.description from
  // the template; these helpers re-establish that invariant for strict null checks
  // without changing runtime behaviour
  get #importerFlags(): IDDBImporterItemFlags {
    this.data.flags.ddbimporter ??= { type: "race" };
    return this.data.flags.ddbimporter;
  }

  #appendDescription(text: string) {
    const description = (this.data.system.description ??= { value: "", chat: "" });
    description.value += text;
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

  #getTraitChoice(trait: IDDBRacialTrait | IDDBRacialTraitDefinition): IDDBChoiceResult {
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

  #getFullName(): string {
    // name is not in the IDDBRace model but some payloads carry it
    const baseName = this.race.fullName ?? (foundry.utils.getProperty(this.race, "name") as string);
    const lineageName = this.lineageName;
    const sourceBook = this.data.system.source?.book;
    const legacyName = this.isMuncher && this.isLegacy && sourceBook
      ? ` (${sourceBook})`
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

  constructor({ ddbCharacter, compendiumRacialTraits }: { ddbCharacter: DDBCharacter; compendiumRacialTraits: TIndexEntry[] }) {
    this.ddbCharacter = ddbCharacter;
    const source = ddbCharacter.source;
    if (!source) {
      throw new Error("DDBRace requires a parsed DDB character source");
    }
    this.ddbData = source.ddb;
    this.isMuncher = ddbCharacter.isMuncher ?? false;
    this.race = source.ddb.character.race;
    this.is2014 = this.race.sources.every((s) => DDBSources.is2014Source(s));
    this.is2024 = !this.is2014;
    this.version = this.is2014 ? "2014" : "2024";

    this.isLegacy = this.race.isLegacy;
    this.#fixups();
    this.compendiumRacialTraits = compendiumRacialTraits;
    this._generateDataStub();
    const localSource = DDBSources.parseSource(this.race);
    this.data.system.source = localSource;
    foundry.utils.setProperty(this.data, "flags.ddbimporter.sourceId", localSource.id);
    foundry.utils.setProperty(this.data, "flags.ddbimporter.sourceCategory", localSource.sourceCategoryId);

    this.type = "humanoid";
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.lineageTrait = this.#getLineageTrait();
    this.fullName = this.#getFullName();
    this.data.name = utils.nameString(this.fullName);
    this.name = this.fullName;
    this.#appendDescription(`${this.race.description}\n\n`);

    this.baseRaceName = this.race.baseRaceName;
    this.groupName = DDBRace.getGroupName(this.race.groupIds, this.baseRaceName);
    this.isSubRace = this.race.isSubRace || this.groupName !== this.fullName;

    this.legacy = this.race.isLegacy;

    const importerFlags: IDDBImporterItemFlags = {
      type: "race",
      entityRaceId: this.race.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.race.sources.length > 0 ? this.race.sources[0].sourceId : -1, // is homebrew
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
      lineageName: this.lineageName ?? undefined,
    };
    this.data.flags.ddbimporter = importerFlags;

    if (this.race.moreDetailsUrl) {
      importerFlags.moreDetailsUrl = this.race.moreDetailsUrl;
    }

    // if (this.race.isSubRace && this.race.baseRaceName)
    //   this.data.system.requirements = this.race.baseRaceName;

    this.#addWeightSpeeds();
    this.#addSizeAdvancement();

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: "race",
      isMuncher: this.isMuncher,
    });

  }

  _addAdvancement(advancements: I5eAdvancement | I5eAdvancement[]) {
    if (!Array.isArray(advancements)) advancements = [advancements];
    const advancementRecord = (this.data.system.advancement ??= {});
    for (const advancement of advancements) {
      if (!advancement._id) advancement._id = foundry.utils.randomID();
      advancementRecord[advancement._id] = advancement;
    }
  }

  #getCompendiumIxesByFlags<T extends TRaceIndexEntries>(compendiums: string[], flags: Record<string, unknown>, findAll = false): T | T[] | null {
    for (const compendium of compendiums) {
      if (!this._compendiums[compendium]) {
        continue;
      }
      logger.verbose(`Searching for trait with flags in ${compendium}:`, flags);

      const filterFunction = ((i: object) => {
        return Object.entries(flags).every(([key, value]) => {
          return foundry.utils.getProperty(i, `flags.ddbimporter.${key}`) === value;
        });
      });
      const match = findAll
        ? this._compendiums[compendium].index.filter(filterFunction) as T[]
        : this._compendiums[compendium].index.find(filterFunction) as T | undefined;
      if (match) return match;
    }
    return null;
  }

  getCompendiumIxByFlags<T extends TRaceIndexEntries>(compendiums: string[], flags: Record<string, unknown>): T | null {
    const match = this.#getCompendiumIxesByFlags<T>(compendiums, flags, true);
    if (match) return match as T;
    return null;
  }

  getCompendiumIxByFlagsAll<T extends TRaceIndexEntries>(compendiums: string[], flags: Record<string, unknown>): T[] {
    const match = this.#getCompendiumIxesByFlags<T>(compendiums, flags, true);
    if (match) return match as T[];
    return [];
  }


  async _buildCompendiumIndex(type: string, indexFilter = {}) {
    if (Object.keys(indexFilter).length > 0) this._indexFilter[type] = indexFilter;
    if (!this._compendiums[type]) return;
    await this._compendiums[type].getIndex(this._indexFilter[type]);
  }


  async _generateRaceImage(): Promise<string> {
    let avatarUrl;
    let largeAvatarUrl;
    let portraitAvatarUrl;

    const targetDirectory = utils.getSetting<string>("other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = utils.getSetting<boolean>("use-deep-file-paths");

    const rules = this.data.system.source?.rules ?? "2024";
    const book = utils.normalizeString(this.data.system.source?.book ?? "");
    const bookRuleStub = [rules, book].join("-");

    if (this.race.portraitAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-race-portrait`;
      const pathPostfix = useDeepPaths ? `/race/portrait` : "";
      const downloadOptions = { type: "race-portrait", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix, download: true };
      portraitAvatarUrl = await FileHelper.getImagePath(this.race.portraitAvatarUrl, downloadOptions);

      this.data.img = portraitAvatarUrl;
      this.#importerFlags.portraitAvatarUrl = this.race.portraitAvatarUrl;
    }

    if (this.race.avatarUrl) {
      const imageNamePrefix = useDeepPaths ? `${bookRuleStub}` : `${bookRuleStub}-race-avatar`;
      const pathPostfix = useDeepPaths ? `/race/avatar` : "";
      const downloadOptions = { type: "race-avatar", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix, download: true };
      avatarUrl = await FileHelper.getImagePath(this.race.avatarUrl, downloadOptions);
      this.#importerFlags.avatarUrl = this.race.avatarUrl;
      if (!this.data.img) {
        this.data.img = avatarUrl;
      }
    }

    if (this.race.largeAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-large";
      const pathPostfix = useDeepPaths ? `/race/large` : "";
      const downloadOptions = { type: "race-large", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
      largeAvatarUrl = await FileHelper.getImagePath(this.race.largeAvatarUrl, downloadOptions);
      this.#importerFlags.largeAvatarUrl = this.race.largeAvatarUrl;
      if (!this.data.img) {
        this.data.img = largeAvatarUrl;
      }
    }

    if (this.data.img) {
      foundry.utils.setProperty(this.data, "flags.ddbimporter.keepIcon", true);
    }

    const image = (avatarUrl) ? `<img src="${avatarUrl}">\n\n` : (largeAvatarUrl) ? `<img src="${largeAvatarUrl}">\n\n` : "";
    this.#appendDescription(image);
    return image;
  }

  #typeCheck(trait: IDDBRacialTraitDefinition) {
    if (trait.name.trim() !== "Creature Type") return;
    const typeRegex = /(?:You are|You're) an? (\S*)\./i;
    const typeMatch = trait.description.match(typeRegex);
    if (typeMatch) {
      logger.debug(`Explicit type detected: ${typeMatch[1]}`, typeMatch);
      this.type = typeMatch[1].toLowerCase();
    }
  }

  #addFeatureDescription(trait: IDDBRacialTraitDefinition) {
    // for whatever reason 2024 races still have a hidden ability score entry
    if (!this.is2014 && trait.name.startsWith("Ability Score ")) return;
    const featureMatch = this.compendiumRacialTraits?.find((match) => {
      const baseName = foundry.utils.getProperty(match, "flags.ddbimporter.baseName") as string;
      if (!baseName) return false;
      const entityRaceId = foundry.utils.getProperty(match, "flags.ddbimporter.entityRaceId") as number;
      if (!entityRaceId) return false;
      return utils.nameString(trait.name) === utils.nameString(baseName)
      && entityRaceId === trait.entityRaceId;
    });
    const title = (featureMatch) ? `<p><b>@Compendium[${this._compendiumLabel}.${featureMatch._id}]{${trait.name}}</b></p>` : `<p><b>${trait.name}</b></p>`;
    this.#appendDescription(`${title}\n${trait.description}\n\n`);
  }

  #addWeightSpeeds() {
    if (this.race.weightSpeeds?.normal) {
      this.data.system.movement = {
        burrow: String(this.race.weightSpeeds.normal.burrow ?? 0),
        climb: String(this.race.weightSpeeds.normal.climb ?? 0),
        fly: String(this.race.weightSpeeds.normal.fly ?? 0),
        swim: String(this.race.weightSpeeds.normal.swim ?? 0),
        walk: String(this.race.weightSpeeds.normal.walk ?? 0),
        units: "ft",
        hover: false,
      };
    }
  }

  #addSizeAdvancement() {
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.SizeAdvancement);

    const ddbSizeData = CONFIG.DDB.creatureSizes.find((s) => s.id === this.race.sizeId);
    if (!ddbSizeData) {
      logger.warn(`Unable to find DDB creature size for size id ${this.race.sizeId}`);
    } else if (ddbSizeData.id === 10) {
      advancement.updateSource({ configuration: { sizes: ["med", "sm"] } });
    } else if (ddbSizeData.id !== 4) {
      const size = DICTIONARY.sizes.find((s) => s.id === this.race.sizeId);
      if (size) {
        advancement.updateSource({ configuration: { sizes: [size.value] } });
      } else {
        logger.warn(`Unable to find size mapping for size id ${this.race.sizeId}`);
      }
    }

    this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  #flightCheck(trait: IDDBRacialTraitDefinition) {
    if (trait.name.trim() === "Flight" && foundry.utils.getProperty(this.race, "weightSpeeds.normal.fly") === 0) {
      const typeRegex = /you have a flying speed equal to your walking speed/i;
      const flightMatch = trait.description.match(typeRegex);
      const movement = this.data.system.movement;
      if (flightMatch && movement) {
        logger.debug(`Missing flight detected: ${flightMatch[1]}`, flightMatch);
        movement.fly = movement.walk;
      }
    }
  }

  #addAbilityScoreAdvancement(trait: IDDBRacialTraitDefinition) {
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

      const update = foundry.utils.duplicate(this.abilityAdvancement.configuration);
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
    this._addAdvancement(this.abilityAdvancement.toObject() as I5eAdvancement);
  }

  // skills, e.g. variant human
  #generateSkillAdvancement(trait: IDDBRacialTraitDefinition) {
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

    if (advancement) this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  #generateLanguageAdvancement(trait: IDDBRacialTraitDefinition) {
    // if (!["Languages"].includes(trait.name.trim())) return;

    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, trait, 0);
    if (advancement) this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  #generateToolAdvancement(trait: IDDBRacialTraitDefinition) {
    // if (!["Tools"].includes(trait.name.trim())) return;

    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getToolAdvancement({
      mods: mods,
      feature: trait,
      level: 0,
    });
    if (advancement) this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  async #generateSpellAdvancement(trait: IDDBRacialTraitDefinition) {
    if (!DDBRace.FORCE_TRAIT_SPELL_ADVANCEMENT_ON_RACE.includes(trait.name.trim())) return;
    const advancements = await AdvancementHelper.getTraitSpellAdvancements({
      name: trait.name,
      species: this.fullName,
      description: trait.description,
      is2024: this.is2024,
    }, this.spellLinks);
    if (advancements) {
      advancements.forEach((advancement) => this._addAdvancement(advancement.toObject() as I5eAdvancement));
    }
  }

  async #generateFeatAdvancement(trait: IDDBRacialTraitDefinition) {
    if (!["Feats", "Feat", "Versatile"].includes(trait.name.trim())) return;

    const featCompendium = this._compendiums.feats;
    if (!featCompendium) {
      logger.warn(`Unable to find feats compendium, unable to generate feat advancement for trait ${trait.name}`);
      return;
    }

    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement);

    const uuids = featCompendium.index
      .filter((i) => {
        const prerequisite = foundry.utils.getProperty(i, "system.prerequisites.level") as string;
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

    // use our advancement mock to validate the update before we update advancement
    const update: I5eAdvancementItemChoice = {
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
    };
    advancement.updateSource(update as any);

    this._addAdvancement(advancement.toObject() as I5eAdvancementItemChoice);

    const feat = this.ddbData?.character?.feats?.find((f) =>
      f.componentId === trait.id
      && f.componentTypeId === trait.entityTypeId,
    );
    if (!feat) {
      logger.warn(`Unable to link advancement to feat`, { advancement, trait, this: this });
      return;
    };
    const featMatch = featCompendium.index.find((i: TIndexEntry) =>
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


  async #generateTraitChoiceAdvancement(trait: IDDBRacialTraitDefinition, choices: IDDBChoiceEntry[]) {
    logger.debug(`Generating choice trait advancement for trait ${trait.name} with ${choices.length} choices`);
    const keys = new Set<string>();
    const uuids = new Set<string>();
    const configChoices: Record<number, { count: number; replacement: boolean }> = {};
    let lowestLevel = 0;

    for (const choice of choices) {
      // build a list of options for each choice
      const choiceRegex = /level (\d+) /i;
      const choiceLevel = (choice.label ?? "").match(choiceRegex);
      const level = choiceLevel && choiceLevel.length > 1
        ? parseInt(choiceLevel[1])
        : (trait.requiredLevel ?? 0);
      const currentCount = configChoices[level]?.count ?? 0;

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

      const traits: ITraitIndexEntry[] = [];

      for (const option of choiceOptions) {

        const compendiumFeature: ITraitIndexEntry | null = this.getCompendiumIxByFlags<ITraitIndexEntry>(["traits"], { // action feature
          componentId: option.id,
          is2014: this.is2014,
          is2024: this.is2024,
          "dndbeyond.entityRaceId": this.race.entityRaceId,
          // classId: this.ddbParentClassDefinition.id,
        })
        ?? this.getCompendiumIxByFlags(["traits"], { // choice feature
          // TODO: investigate - IDDBChoiceDefinitionOption has no optionComponentId, so this lookup key is likely always undefined
          "id": foundry.utils.getProperty(option, "optionComponentId"),
          "isChoiceFeature": true,
          "dndbeyond.entityRaceId": this.race.entityRaceId,
          "dndbeyond.choice.optionId": option.id,
        }) ?? this.getCompendiumIxByFlags(["feats"], { // feat choice
          id: option.id,
        });

        if (compendiumFeature) {
          traits.push(compendiumFeature);
          uuids.add(compendiumFeature.uuid);
        } else if (this.isMuncher) {
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
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement);

    const updateData: I5eAdvancementItemChoice = {
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
      icon: "icons/magic/symbols/cog-orange-red.webp",
    };

    advancement.updateSource(updateData as any);

    // console.warn(`Generated choice advancement for feature ${feature.name}:`, {
    //   advancement,
    //   this: this,
    //   feature,
    //   choices,
    //   uuids,
    // });


    // TODO: handle chosen advancements on non muncher races
    this._addAdvancement(advancement.toObject() as I5eAdvancement);

  }


  async #generateTraitOptionAdvancement(trait: IDDBRacialTraitDefinition, options: IDDBOptionEntry[]) {
    logger.debug(`Generating choice trait option advancement for trait ${trait.name} with ${options.length} options`);

    const uuids = new Set<string>();
    const configChoices: Record<number, { count: number; replacement: boolean }> = {};
    const lowestLevel = 0;

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
      const traits: ITraitIndexEntry[] = [];

      const matchFlags = {
        "id": option.componentId,
        "isChoiceFeature": true,
        "dndbeyond.entityRaceId": this.race.entityRaceId,
        "dndbeyond.choice.parentName": trait.name,
        "entityTypeId": option.componentTypeId,
        "dndbeyond.choice.entityTypeId": option.definition.entityTypeId,
      };

      const compendiumFeatures: ITraitIndexEntry[] = this.getCompendiumIxByFlagsAll(["traits"], matchFlags);

      if (compendiumFeatures) {
        traits.push(...compendiumFeatures);
        for (const compendiumFeature of compendiumFeatures) {
          uuids.add(compendiumFeature.uuid);
        }
      } else if (this.isMuncher) {
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
    const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemChoiceAdvancement);

    const advancementData: I5eAdvancementItemChoice = {
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
      icon: "icons/magic/symbols/cog-orange-red.webp",
    };
    advancement.updateSource(advancementData as any);

    // console.warn(`Generated choice advancement for feature ${feature.name}:`, {
    //   advancement,
    //   this: this,
    //   feature,
    //   choices,
    //   uuids,
    // });


    // TODO: handle chosen advancements on non muncher races
    this._addAdvancement(advancement.toObject() as I5eAdvancement);

  }

  async #generateTraitAdvancementChoicesIfOption(trait: IDDBRacialTraitDefinition) {
    logger.verbose(`Attempting to generate choice advancement for trait ${trait.name} without explicit choices`);
    const optionMatches = (this.ddbData.character.options["race"] ?? [])
      .filter(
        (option) =>
          trait.entityTypeId == option.componentTypeId
          && trait.id == option.componentId,
      );
    if (optionMatches.length === 0) return;
    await this.#generateTraitOptionAdvancement(trait, optionMatches);
  }

  async #generateTraitAdvancementChoices(raceTraits: IDDBRacialTraitDefinition[]) {
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

      if ((this.isLineage && this.lineageTrait?.componentId === trait.id)
        || (DDBRace.FORCE_TRAIT_GRANT.includes(trait.name))) {
        logger.debug(`Skipping trait for choice advancement: ${trait.name}`);
        continue;
      }

      const choices = (this.ddbData.character.choices.race ?? [])
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


      // TODO: determine if different traits at each level, if so, create multiple advancements
      await this.#generateTraitChoiceAdvancement(trait, choices);
    }
  }

  async #generateTraitAdvancements() {
    logger.debug(`Parsing ${this.name} traits for advancement`);
    const raceTraits = this.race.racialTraits
      .map((t) => t.definition)
      .filter((trait) =>
        !DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS.includes(trait.name)
        || (this.is2014 && DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(trait.name)));
    for (const trait of raceTraits) {
      await this.#generateTraitAdvancementFromCompendiumMatch(trait);
    }

    // for choice traits such as fighting styles:
    // for each trait with typ3 choices, build an item choice advancement
    // then search for matching traits from the choicedefintiions.
    await this.#generateTraitAdvancementChoices(raceTraits);

    foundry.utils.setProperty(CONFIG.DDBI, `muncher.debug.race.${this.name}${this.version}.choiceMap`, this.choiceMap);


  }

  #generateConditionAdvancement(trait: IDDBRacialTraitDefinition) {
    // TO DO: Dragonborn Resistance choice advancement
    const mods = DDBModifiers.getModifiers(this.ddbData, "race")
      .filter((mod) => mod.componentId === trait.id && mod.componentTypeId === trait.entityTypeId);

    const advancement = this.advancementHelper.getConditionAdvancement(mods, trait, 0);
    if (advancement) this._addAdvancement(advancement.toObject() as I5eAdvancement);
  }

  /**
   * Finds a match in the compendium trait for the given feature.
   *
   * @param {IDDBRacialTraitDefinition} trait The trait to find a match for.
   * @returns {object|undefined} - The matched feature, or undefined if no match is found.
   */
  #getTraitCompendiumMatch(trait: IDDBRacialTraitDefinition): TIndexEntry | null {
    const traitCompendium = this._compendiums.traits;
    if (!traitCompendium) {
      return null;
    }
    logger.debug(`Getting trait match for ${trait.name}`);
    const traitName = utils.nameString(trait.name);

    const findTraits = (excludeFlags: Record<string, string | boolean | number> = {}, looseMatch = true, choiceMatch = false) => {
      const results = traitCompendium.index.filter((match: TIndexEntry) => {
        const matchFlags: IDDBImporterFlags = foundry.utils.getProperty(match, "flags.ddbimporter.featureMeta") as IDDBImporterFlags
          ?? foundry.utils.getProperty(match, "flags.ddbimporter") as IDDBImporterFlags;
        if (!matchFlags) return false;
        const matchName = (foundry.utils.getProperty(matchFlags, "originalName") as string)?.trim()
          ?? (match.name as string)?.trim();
        const nameMatch = traitName.toLowerCase() === matchName.toLowerCase();
        const isIdMatch = trait.id === matchFlags.id;
        if (!nameMatch && looseMatch) {
          const containsMatch = traitName.toLowerCase().includes(matchName);
          if (!containsMatch || !isIdMatch) return false;
        } else if (nameMatch && !looseMatch && !isIdMatch) {
          return false;
        }
        for (const [key, value] of Object.entries(excludeFlags)) {
          if (matchFlags[key as keyof IDDBImporterFlags] === value) return false;
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

    if (this.isLineage && this.lineageTrait?.componentId === trait.id) {
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


  async #generateTraitAdvancementFromCompendiumMatch(trait: IDDBRacialTraitDefinition) {
    const traitMatch = this.#getTraitCompendiumMatch(trait);

    if (!traitMatch) return;
    const traitMatchName = traitMatch.name;
    if (!traitMatchName) {
      logger.warn(`Compendium trait match for ${trait.name} has no name, skipping advancement`);
      return;
    }

    const shouldInclude = !DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS.includes(trait.name)
      || (this.is2014 && DDBRace.EXCLUDED_FEATURE_ADVANCEMENTS_2014.includes(trait.name));
    if (!shouldInclude) return;

    if (this.traitAdvancementUuids.has(traitMatch.uuid)) return;
    this.traitAdvancementUuids.add(traitMatch.uuid);

    const requiredLevel = trait.requiredLevel ?? 0;
    const levelAdvancement = this.traitAdvancements.findIndex((advancement) => advancement.level === requiredLevel);

    if (levelAdvancement == -1) {
      const advancement = AdvancementHelper.createAdvancement(game.dnd5e.documents.advancement.ItemGrantAdvancement);
      this._advancementMatches.traits[advancement._id] = {};
      this._advancementMatches.traits[advancement._id][traitMatchName] = traitMatch.uuid;

      const update: I5eAdvancementItemGrant = {
        configuration: {
          items: [{ uuid: traitMatch.uuid }],
        },
        value: {},
        level: requiredLevel,
        title: "Traits",
        icon: "",
        classRestriction: "",
      };
      advancement.updateSource(update as unknown as any);
      const obj = advancement.toObject() as I5eAdvancement;
      this.traitAdvancements.push(obj);
      this._addAdvancement(obj);
    } else {
      const existingAdvancement = this.traitAdvancements[levelAdvancement] as I5eAdvancementItemGrant;
      existingAdvancement.configuration.items ??= [];
      existingAdvancement.configuration.items.push({
        uuid: traitMatch.uuid,
        optional: false,
      });
      const existingId = existingAdvancement._id;
      if (existingId) {
        this._advancementMatches.traits[existingId][traitMatchName] = traitMatch.uuid;
      } else {
        // _addAdvancement always stamps an _id, so this should never happen
        logger.warn(`Trait advancement for level ${requiredLevel} is missing an id`, { trait, traitMatch });
      }
    }
  }

  linkSpells(ddbCharacter: DDBCharacter) {
    logger.warn("Linking Spells to Race", {
      DDBRace: this,
      ddbCharacter,
    });

    const validSpells = ddbCharacter.data.spells.filter((spell) => {
      return spell.flags.ddbimporter?.dndbeyond.lookup === "race"
        && !spell.flags.ddbimporter?.dndbeyond.usesSpellSlot;
    });

    const advancementRecord = ddbCharacter.data.race.system.advancement;
    if (!advancementRecord) {
      logger.warn("Race has no advancement record, unable to link spells");
      return;
    }

    for (const [id, advancement] of Object.entries(advancementRecord)) {
      if (!foundry.utils.hasProperty(advancement, "configuration.spell")) continue;
      const spellLinkMatch = this.spellLinks.find((l) => l.advancementId === id);
      if (!spellLinkMatch) continue;

      const a = advancement as I5eAdvancement; // restore full advancement shape

      const addedSpells: I5eAdvancementItemChoiceValueAdded | I5eAdvancementItemGrantValueAdded = {};
      let ability;

      for (const spell of validSpells) {
        const spellUuidMatch = (spellLinkMatch.uuids ?? []).find((l) =>
          l.name.toLowerCase() === spell.flags.ddbimporter?.originalName?.toLowerCase(),
        );
        if (!spellUuidMatch) continue;
        if (!spell._id) {
          logger.warn(`Spell ${spell.name} is missing an id, unable to link to race advancement`);
          continue;
        }

        if (spell.flags.ddbimporter?.dndbeyond.ability) ability = spell.flags.ddbimporter.dndbeyond.ability;
        logger.debug(`Advancement Race ${a._id} found Spell ${spell.name} (${spellUuidMatch.uuid})`);

        if (a.type === "ItemChoice") {
          if (!foundry.utils.hasProperty(addedSpells, "0")) {
            addedSpells["0"] = {};
          }
          (addedSpells as I5eAdvancementItemChoiceValueAdded)["0"][spell._id] = spellUuidMatch.uuid;
        } else {
          addedSpells[spell._id] = spellUuidMatch.uuid;
        }
        foundry.utils.setProperty(spell, "flags.dnd5e.sourceId", spellUuidMatch.uuid);
        foundry.utils.setProperty(spell, "flags.dnd5e.advancementOrigin", `${this.data._id}.${a._id}`);
      }

      a.value = {
        ability,
        added: addedSpells,
      } as unknown as typeof a.value;

      advancementRecord[id] = a;

    }

  }

  linkFeatures() {
    logger.debug("Linking Advancements to Feats for Race", {
      DDBRace: this,
      ddbCharacter: this.ddbCharacter,
    });


    const featLinkName = this.featLink.name;
    const featLinkUuid = this.featLink.uuid;
    if (featLinkName === null || featLinkUuid === null) {
      // no feat advancement link was generated, so there is nothing to match
      logger.debug("No feat link found for race, skipping feat advancement linking");
      return;
    }

    const advancementRecord = this.ddbCharacter.data.race.system.advancement;
    if (!advancementRecord) {
      logger.warn("Race has no advancement record, unable to link features");
      return;
    }

    for (const [id, a] of Object.entries(advancementRecord)) {
      const isValid = ["ItemChoice", "ItemGrant"].includes(a.type ?? "") && (!a.level || a.level <= this.ddbCharacter.totalLevels);
      if (!isValid) continue;
      const addedFeats: Record<string, string> = {};


      for (const feat of this.ddbCharacter.data.features) {
        const isMatch = feat.type === "feat"
          && feat.system.type.value === "feat"
          && feat.flags.ddbimporter?.type === "feat"
          && feat.name.startsWith(featLinkName);


        if (!isMatch || !feat._id) continue;

        logger.debug(`Advancement Race ${a._id} found Feature ${feat.name} (${featLinkUuid})`);
        addedFeats[feat._id] = featLinkUuid;
        foundry.utils.setProperty(feat, "flags.dnd5e.sourceId", featLinkUuid);
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
        advancementRecord[id] = a;
      }
    };
    logger.debug("Processed race advancements", this.ddbCharacter.data.race.system.advancement);
  }

  // #generateHTMLSenses() {
  //   const textDescription = AdvancementHelper.stripDescription(this.data.system.description.value);

  //   // You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light
  //   // You can see in dim light within 120 feet of you as if it were bright light and in darkness as if it were dim light.
  //   const darkVisionRegex = /you can see in dim light within (\d+) feet of you as if it were bright light/im;
  //   const darkVisionMatch = textDescription.match(darkVisionRegex);

  //   if (darkVisionMatch) {
  //     this.data.system.senses.darkvision = parseInt(darkVisionMatch[1]);
  //   }
  // }

  #generateSenses() {
    // const ranges = (this.data.system.senses.ranges ?? {}) as Record<string, any>;
    const ranges: T5eSenseRanges = this.data.system.senses?.ranges ?? {};
    for (const senseName in ranges) {
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
          const key = senseName as keyof T5eSenseRanges;
          if (Number.isInteger(mod.value) && parseInt(String(mod.value)) > (ranges[key] ?? 0)) {
            ranges[key] = parseInt(String(mod.value));
          }
        });
    }
  }

  #fix2024DragonBorn() {
    if (!this.data.name.startsWith("Dragonborn")) return;
    const breathWeapon: I5eAdvancementScaleValue = {
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
    this._addAdvancement(breathWeapon as unknown as I5eAdvancement);
  }

  #fix2024Aasimar() {
    if (!this.data.name.startsWith("Aasimar")) return;
    const advancementRecord = this.data.system.advancement ?? {};
    for (const key of Object.keys(advancementRecord)) {
      const advancement = advancementRecord[key];
      if (advancement.title !== "Celestial Revelation") continue;
      advancement.type = "ItemGrant";
      // reshape the choice configuration into an ItemGrant configuration
      const configuration = advancement.configuration as Record<string, any>;
      configuration.items = foundry.utils.deepClone(configuration.pool);
      delete configuration.pool;
      delete configuration.choices;
      delete configuration.allowDrops;
      advancementRecord[key] = advancement;
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
    const description = this.data.system.description;
    if (description) {
      description.value = DDBReferenceLinker.parseTags(description.value);
    }

    logger.debug("Race generated", { DDBRace: this });
  }

  static async getRacialTraitsLookup(racialTraits: IDDBRacialTraitDefinition[], fail = true): Promise<TIndexEntry[]> {
    const compendium = CompendiumHelper.getCompendiumType("traits", fail);
    if (compendium) {
      const flags = ["name", "flags.ddbimporter.entityRaceId", "flags.ddbimporter.baseName"];
      const index = await compendium.getIndex({ fields: flags });
      const traitIndex = await index.filter((i) => racialTraits.some((orig) => i.name === orig.name)) as unknown as TIndexEntry[];
      return traitIndex;
    } else {
      return [];
    }
  }

  _buildPendingSpeciesDocument(): I5eRaceItem {
    const race = foundry.utils.deepClone(this.data);
    const advancementRecord = race.system.advancement ?? {};
    for (const [id, advancement] of Object.entries(advancementRecord) as [string, any][]) {
      delete advancement.value;
      advancementRecord[id] = advancement;
    }
    return race;
  }

  static async writePendingSpeciesDocuments(races: I5eRaceItem[], update: boolean | null) {
    if (!races || races.length === 0) return;
    const traitCompendiumFolders = new DDBCompendiumFolders("traits");
    await traitCompendiumFolders.loadCompendium("traits");
    for (const race of races) {
      await traitCompendiumFolders.createSubTraitFolders(race);
    }
    const speciesHandler = await DDBItemImporter.buildHandler(
      "race", races, update ?? false, DDBRace.SPECIES_HANDLER_OPTIONS,
    );
    await speciesHandler.buildIndex(DDBRace.SPECIES_HANDLER_OPTIONS.indexFilter);
  }

  async addToCompendium(update: boolean | null, compendiumImportTypes: string[] = ["species"], { collectOnly = false } = {}) {
    if (!compendiumImportTypes.includes("species")) return;
    const race = this._buildPendingSpeciesDocument();
    this.pendingSpeciesDocument = race;
    if (collectOnly) return;

    await DDBRace.writePendingSpeciesDocuments([race], update);
  }

}

