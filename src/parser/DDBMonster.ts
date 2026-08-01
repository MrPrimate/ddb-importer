import { newNPC } from "./monster/templates/monster";
import { specialCases } from "./monster/special";
import { monsterFeatureEffectAdjustment } from "../effects/specialMonsters";
import { logger, utils, CompendiumHelper } from "../lib/_module";
import DDBMonsterFeatureFactory from "./monster/features/DDBMonsterFeatureFactory";
import ExternalAutomations from "../effects/external/ExternalAutomations";

export interface IDDBMonsterOverrides {
  name?: string;
  [key: string]: any;
}

interface IDDBMonsterConstructorOptions {
  existingNpc?: TParsedMonsterData | null;
  extra?: boolean;
  useItemAC?: boolean;
  legacyName?: boolean;
  addMonsterEffects?: boolean;
  addChrisPremades?: boolean;
  use2024Spells?: boolean | null;
  useCastActivity?: boolean | null;
  forceRulesVersion?: string | null;
}

// Declaration merging: these methods are added to DDBMonster.prototype
// by the files imported via extendParsers.ts
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface DDBMonster {
  // abilities.ts
  _generateAbilities(): void;
  // ac.ts
  BAD_AC_MONSTERS: string[];
  _generateAC(additionalItems?: string[]): Promise<void>;
  // conditions.ts
  getAdjustmentsConfig(type: string): TAdjustmentsConfigResult;
  getDamageAdjustments(type: string): I5eDamageTraitSet;
  _generateDamageImmunities(): void;
  _generateDamageResistances(): void;
  _generateDamageVulnerabilities(): void;
  _generateConditionImmunities(): void;
  // environments.ts
  _generateEnvironments(): void;
  // features.ts
  _generateFeatures(): Promise<void>;
  // habitats.ts
  _generateHabitats(): void;
  // hp.ts
  _generateHitPoints(): void;
  // languages.ts
  _generateLanguages(): void;
  // movement.ts
  _generateMovement(): void;
  // senses.ts
  getTextSenses(): any;
  _generateTokenSenses(): void;
  _generateSenses(): void;
  // size.ts
  getSizeFromId(sizeId: number): IDDBActorSizeData;
  _generateSize(): void;
  // skills.ts
  _generateSkills(): I5eSkills | undefined;
  _generateSkillsHTML(): I5eSkills | undefined;
  // source.ts
  _generateSource(): void;
  // spellcasting.ts
  getSpellcasting(text: string): T5eAbility;
  _generateSpellcastingAbility(text: string): void;
  _generateSpellLevel(text: string): void;
  _generateSpelldc(text: string): void;
  _generateSpellAttackBonus(text: string): void;
  _generateSpellcasting(): void;
  // spells.ts
  parseOutInnateSpells(text: string): void;
  parseAdditionalAtWillSpells(text: string): void;
  parseOutSpells(text: string, options?: { pactText?: string }): void;
  _generateSpellEdgeCases(): void;
  _generateSpells(): void;
  retrieveCompendiumSpells(spells: string[]): Promise<I5eSpellItem[]>;
  getSpellEdgeCase(spell: I5eSpellItem, type: string): void;
  _addSpellHints(): void;
  addSpells(): Promise<void>;
  // treasure.ts
  _generateTreasure(): void;
  // type.ts
  _generateType(): void;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
class DDBMonster {
  name: string;
  npc: TParsedMonsterData;
  proficiencyBonus: number | null;
  source: IDDBMonsterSourceData;
  useItemAC: boolean;
  legacyName: boolean;
  addMonsterEffects: boolean;
  addChrisPremades: boolean;
  // assigned via setProperty() in the constructor
  removedHitPoints!: number;
  temporaryHitPoints!: number;
  unexpectedDescription: string | null = null;
  characterDescription: string;
  cr: {
    id: number;
    value: number;
    proficiencyBonus: number;
    xp: number;
  };
  typeName: string;
  img: string | null = null;
  stockImage: boolean;
  featureFactory: DDBMonsterFeatureFactory;
  // assigned by _generateSource() at the start of the parse flow (or forced in the constructor)
  is2014!: boolean;
  is2024!: boolean;
  legacy!: boolean;
  use2024Spells: boolean | null;
  useCastActivity: boolean | null;
  forceRulesVersion: string | null;
  extra: boolean;
  spellcasting: {
    spelldc: number;
    spellcasting: T5eAbility | "";
    spellLevel: number;
    spellAttackBonus: number;
  };
  spellList: IDDBMonsterSpellListTracker;
  // abilities/movement/ac are populated by their parse steps before any read
  abilities!: I5eAbilities;
  movement!: {
    movement: I5eMovement;
    special: string[];
  };
  items: I5eMonsterItem[];
  ac!: {
    ac: I5eArmorClass;
    flatAC: boolean;
    acItems: I5eMonsterItem[];
    dexBonus: number;
    ddbItems: I5eMonsterItem[];
    adjustedItems: I5eMonsterItem[];
    allItemsMatched: boolean;
    badACMonster: boolean;
    rawItems: I5eMonsterItem[];
    effects: I5eEffectData[];
  };
  overrides: IDDBMonsterOverrides;

  setProperty(name: string, value: any) {
    if (this.overrides[name]) {
      (this as Record<string, any>)[name] = this.overrides[name];
    } else {
      (this as Record<string, any>)[name] = value;
    }
  }

  constructor(ddbObject: any = null, { existingNpc = null, extra = false, useItemAC = true,
    legacyName = true, addMonsterEffects = false, addChrisPremades = false, use2024Spells = null,
    useCastActivity = null, forceRulesVersion = null }: IDDBMonsterConstructorOptions = {}, overrides: IDDBMonsterOverrides = {},
  ) {
    this.source = ddbObject;

    // processing options
    this.extra = extra;
    // TODO: this is a bit dangerous as the object type says npc is defined, but it can be null here. It currently works
    // fine because the two DDBMonstor constructor sites define this after construction (manually and via .parse(), this
    // can probably be cleaned up a bit more.
    this.npc = existingNpc as TParsedMonsterData;
    this.useItemAC = useItemAC;
    this.legacyName = legacyName;
    this.addMonsterEffects = addMonsterEffects;
    this.addChrisPremades = addChrisPremades;

    // some of this data can be overwritten, useful for mangling new actions
    this.overrides = overrides;

    // used by extra processing
    this.setProperty("removedHitPoints", (this.source?.removedHitPoints ?? 0));
    this.setProperty("temporaryHitPoints", (this.source?.temporaryHitPoints ?? 0));

    this.characterDescription = "";

    // processing info
    this.name = (overrides["name"] ?? (existingNpc ? existingNpc.name : null)) ?? "";
    this.proficiencyBonus = null;
    this.cr = {
      "id": 1,
      "value": 0,
      "proficiencyBonus": 2,
      "xp": 10,
    };
    this.typeName = "";
    this.items = [];

    if (existingNpc) {
      this.setProperty("proficiencyBonus", existingNpc.system.attributes.prof);
      this.setProperty("cr", existingNpc.system.details.cr);
      this.setProperty("abilities", existingNpc.system.abilities);
      this.items = foundry.utils.duplicate(existingNpc.items) as unknown as I5eMonsterItem[];
      this.img = existingNpc.img ?? null;
    }
    this.stockImage = false;

    this.featureFactory = new DDBMonsterFeatureFactory({ ddbMonster: this });

    this.use2024Spells = use2024Spells;
    this.useCastActivity = useCastActivity;
    this.forceRulesVersion = forceRulesVersion;

    if (forceRulesVersion !== null) {
      this.is2014 = forceRulesVersion === "2014";
      this.is2024 = forceRulesVersion === "2024";
      this.use2024Spells = this.is2024;
      this.useCastActivity = this.is2024;
    }

    this.spellcasting = {
      spelldc: 10,
      spellcasting: "", // ability associated
      spellLevel: 0,
      spellAttackBonus: 0,
    };
    this.spellList = {
      class: [],
      pact: [],
      atwill: [],
      // {name: "", type: "srt/lng/day", value: 0} // check these values
      innate: [],
      edgeCases: [], // map { name: "", type: "", edge: "" }
      material: true,
      innateMatch: false,
      concentration: true,
    };

  }

  static STOCK_TYPE_IMAGES = [
    "https://www.dndbeyond.com/avatars/4675/664/636747837303835953.jpeg",
    "https://www.dndbeyond.com/avatars/4675/665/636747837392078487.jpeg",
    "https://www.dndbeyond.com/avatars/4675/666/636747837434463638.jpeg",
    "https://www.dndbeyond.com/avatars/4675/667/636747837482013331.jpeg",
    "https://www.dndbeyond.com/avatars/4675/668/636747837521115242.jpeg",
    "https://www.dndbeyond.com/avatars/4675/669/636747837569942785.jpeg",
    "https://www.dndbeyond.com/avatars/4675/671/636747837638112910.jpeg",
    "https://www.dndbeyond.com/avatars/4675/672/636747837699453839.jpeg",
    "https://www.dndbeyond.com/avatars/4675/674/636747837751071918.jpeg",
    "https://www.dndbeyond.com/avatars/4675/675/636747837794884984.jpeg",
    "https://www.dndbeyond.com/avatars/4675/676/636747837839875603.jpeg",
    "https://www.dndbeyond.com/avatars/4675/678/636747837893364274.jpeg",
    "https://www.dndbeyond.com/avatars/4675/679/636747837952193011.jpeg",
    "https://www.dndbeyond.com/avatars/4675/680/636747837998336262.jpeg",
  ];

  _calculateImage() {
    if (this.source) {
      this.img = (this.source.basicAvatarUrl) ? this.source.basicAvatarUrl : this.source.largeAvatarUrl;
      // foundry doesn't support gifs
      if (this.img && this.img.match(/.gif$/)) {
        this.img = null;
      }
      if (DDBMonster.STOCK_TYPE_IMAGES.includes(this.source.avatarUrl)) {
        this.stockImage = true;
      }
    } else {
      this.img = null;
    }
  }

  _generateFlags() {
    this.npc.flags.monsterMunch = {
      url: this.source.url,
      img: (this.img) ? this.img : this.source.avatarUrl,
      tokenImg: this.source.avatarUrl,
      isStockImg: DDBMonster.STOCK_TYPE_IMAGES.includes(this.source.avatarUrl),
    };
    this.npc.flags.ddbimporter = {
      id: this.source.id,
      entityTypeId: this.source.entityTypeId,
      // creatureGroup: monster.creatureGroup ? monster.creatureGroup : null,
      creatureGroupId: this.source.creatureGroupId ? this.source.creatureGroupId : null,
      creatureFlags: this.source.creatureFlags ? this.source.creatureFlags : [],
      automatedEvocationAnimation: this.source.automatedEvocationAnimation ? this.source.automatedEvocationAnimation : undefined,
      version: CONFIG.DDBI.version,
      isLegacy: this.source.isLegacy,
      sources: this.source.sources,
      compendiumId: this.npc._id,
    };
  }

  _generateTaggerFlags() {
    // if (!CONFIG.DDBI.tagger) return;
    const tags = [
      "dndbeyond",
      "ddb-importer",
    ];

    const type = this.npc.system.details.type.value;
    const customType = this.npc.system.details.type.custom;
    const subType = this.npc.system.details.type.custom;
    for (const tagElement of [type, customType, subType]) {
      if (utils.isString(tagElement) && tagElement.trim() !== "") {
        tags.push(tagElement);
      }
    }

    foundry.utils.setProperty(this.npc.prototypeToken, "flags.tagger.tags", tags);
  }

  _generate3DModels() {
    if (!(game as any).canvas3D?.CONFIG?.UI?.TokenBrowser) return;
    const matches = (game as any).canvas3D.CONFIG.UI.TokenBrowser.findByName(this.name.replace("(Legacy)", "").trim());
    if (matches && matches.length > 0) {
      foundry.utils.setProperty(this.npc.prototypeToken, "flags.levels-3d-preview.model3d", matches[0].output);
    }
  }

  async parse() {
    if (!this.name) this.name = utils.nameString(this.source.name);
    this.npc = foundry.utils.duplicate(newNPC(this.name, this.source.id));
    this.npc.system.identifier = utils.referenceNameString(this.name.toLowerCase());
    this._calculateImage();

    this.npc.prototypeToken.name = this.name;
    this._generateFlags();


    const crData = CONFIG.DDB.challengeRatings.find((cr) => cr.id === this.source.challengeRatingId);
    if (!crData) {
      logger.warn(`Unknown challenge rating id ${this.source.challengeRatingId} for ${this.name}, defaulting proficiency bonus to 2`);
    }
    this.proficiencyBonus = crData?.proficiencyBonus ?? 2;
    this.npc.system.attributes.prof = this.proficiencyBonus;
    this._generateAbilities();

    // skills are different with extras, because DDB
    if (utils.isString(this.source.skillsHtml) && this.source.skillsHtml.trim() !== "") {
      this._generateSkillsHTML();
    } else {
      this._generateSkills();
    }

    // Senses needed for actor and token
    this._generateSenses();
    this._generateTokenSenses();

    this._generateDamageImmunities();
    this._generateDamageResistances();
    this._generateDamageVulnerabilities();
    this._generateConditionImmunities();
    this._generateSize();
    this._generateLanguages();
    this._generateHitPoints();
    this._generateMovement();
    this._generateHabitats();

    // keep the constructor default if the challenge rating lookup misses
    this.cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id === this.source.challengeRatingId) ?? this.cr;
    this._generateType();

    const alignment = CONFIG.DDB.alignments.find((c) => this.source.alignmentId === c.id);
    this.npc.system.details.alignment = alignment ? alignment.name : "";
    this.npc.system.details.cr = this.cr.value;
    this.npc.system.details.xp = { value: this.cr.xp };

    this._generateSource();
    this._generateEnvironments();
    this.npc.system.details.biography.value = this.source.characteristicsDescription ?? "";
    this._generateSpellcasting();

    await this._generateFeatures();

    const extraGear = this.featureFactory.gear.length === 0
      ? (this.source.extraGear ?? "").replace(";", ",").split(",").map((g) => g.trim())
      : this.featureFactory.gear;

    await this._generateAC(extraGear);
    await this._generateTreasure();

    // Spellcasting 2014
    this._generateSpells();
    await this.addSpells();

    const badItems = this.items.filter((i) => i.name === "" || !i.name);
    if (badItems.length > 0) {
      logger.error(`${this.source.name} - ${badItems.length} items have no name.`, badItems);
      this.items = this.items.filter((i) => i.name && i.name !== "");
    }

    this.npc.items = this.items;

    if (this.legacyName && this.source.isLegacy) {
      this.npc.name += " (Legacy)";
      this.npc.prototypeToken.name += " (Legacy)";
    }

    this.npc = await CompendiumHelper.existingActorCheck("monster", this.npc) as TParsedMonsterData;
    // monsterFeatureEffectAdjustment mutates and returns this.npc
    this.npc = await monsterFeatureEffectAdjustment(this, this.addMonsterEffects) as TParsedMonsterData;
    // specialCases mutates and returns the same npc document
    this.npc = specialCases(this.npc) as TParsedMonsterData;

    if (this.addChrisPremades) {
      for (const item of this.npc.items) {
        await ExternalAutomations.applyChrisPremadeEffect({
          document: item,
          type: "monsterfeature",
          monsterName: this.npc.name,
        });
      }
    }

    this._generateTaggerFlags();
    this._generate3DModels();

    logger.debug(`Generated ${this.name}`, this);
    return this.npc;

  }

}

export default DDBMonster;
