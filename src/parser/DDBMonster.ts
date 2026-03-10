import { newNPC } from "./monster/templates/monster";
import { specialCases } from "./monster/special";
import { monsterFeatureEffectAdjustment } from "../effects/specialMonsters";
import { logger, utils, CompendiumHelper } from "../lib/_module";
import DDBMonsterFeatureFactory from "./monster/features/DDBMonsterFeatureFactory";
import { ExternalAutomations } from "../effects/_module";

// Declaration merging: these methods are added to DDBMonster.prototype
// by the files imported via extendParsers.ts
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
interface DDBMonster {
  // abilities.ts
  _generateAbilities(): void;
  // ac.ts
  BAD_AC_MONSTERS: string[];
  _generateAC(additionalItems?: any[]): Promise<void>;
  // conditions.ts
  getAdjustmentsConfig(type: any): any;
  getDamageAdjustments(type: any): any;
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
  getSizeFromId(sizeId: any): any;
  _generateSize(): void;
  // skills.ts
  _generateSkills(): any;
  _generateSkillsHTML(): any;
  // source.ts
  _generateSource(): void;
  // spellcasting.ts
  getSpellcasting(text: any): any;
  _generateSpellcastingAbility(text: any): void;
  _generateSpellLevel(text: any): void;
  _generateSpelldc(text: any): void;
  _generateSpellAttackBonus(text: any): void;
  _generateSpellcasting(): void;
  // spells.ts
  parseOutInnateSpells(text: any): any;
  parseAdditionalAtWillSpells(text: any): any;
  parseOutSpells(text: any, options?: { pactText?: any }): any;
  _generateSpellEdgeCases(): void;
  _generateSpells(): void;
  retrieveCompendiumSpells(spells: any): Promise<any>;
  getSpellEdgeCase(spell: any, type: any, spellList: any): any;
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
  npc: I5eMonsterData;
  proficiencyBonus: number;
  source: IDDBMonsterSourceData;
  useItemAC: boolean;
  legacyName: boolean;
  addMonsterEffects: boolean;
  addChrisPremades: boolean;
  removedHitPoints: number;
  temporaryHitPoints: number;
  unexpectedDescription: string | null;
  characterDescription: string;
  cr: {
    id: number;
    value: number;
    proficiencyBonus: number;
    xp: number;
  };

  typeName: string;
  img: string;
  stockImage: boolean;
  featureFactory: DDBMonsterFeatureFactory;
  is2014: boolean;
  is2024: boolean;
  use2024Spells: boolean;
  useCastActivity: boolean;
  forceRulesVersion: boolean;
  extra: boolean;

  spellcasting: {
    spelldc: number;
    spellcasting: "str" | "dex" | "con" | "int" | "wis" | "cha" | string;
    spellLevel: number;
    spellAttackBonus: number;
  };

  spellList: {
    class: any[];
    pact: any[];
    atwill: any[];
    innate: any[];
    edgeCases: { name: string; type: string; edge: string }[];
    material: boolean;
    innateMatch: boolean;
    concentration: boolean;
  };

  abilities: I5eAbilities & Record<string, {
    mod: number;
  }>;

  setProperty(name, value) {
    if (this.overrides["name"]) {
      this[name] = this.overrides["name"];
    } else {
      this[name] = value;
    }
  }

  constructor(ddbObject = null, { existingNpc = null, extra = false, useItemAC = true,
    legacyName = true, addMonsterEffects = false, addChrisPremades = false, use2024Spells = null,
    useCastActivity = null, forceRulesVersion = null } = {}, overrides = {},
  ) {
    this.source = ddbObject;

    // processing options
    this.extra = extra;
    this.npc = existingNpc;
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
    this.name = overrides["name"] ?? (existingNpc ? existingNpc.name : null);
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
      this.items = foundry.utils.duplicate(existingNpc.items);
      this.img = existingNpc.img;
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


    this.proficiencyBonus = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId).proficiencyBonus;
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

    this.cr = CONFIG.DDB.challengeRatings.find((cr) => cr.id == this.source.challengeRatingId);
    this._generateType();

    const alignment = CONFIG.DDB.alignments.find((c) => this.source.alignmentId == c.id);
    this.npc.system.details.alignment = alignment ? alignment.name : "";
    this.npc.system.details.cr = this.cr.value;
    this.npc.system.details.xp = { value: this.cr.xp };

    this._generateSource();
    this._generateEnvironments();
    this.npc.system.details.biography.value = this.source.characteristicsDescription;
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

    this.npc = await CompendiumHelper.existingActorCheck("monster", this.npc);
    this.npc = await monsterFeatureEffectAdjustment(this, this.addMonsterEffects);
    this.npc = specialCases(this.npc);

    if (this.addChrisPremades) {
      for (const item of this.npc.items) {
        await ExternalAutomations.applyChrisPremadeEffect({
          document: item,
          type: "monsterfeature",
          monsterName: this.npc.name,
          isMonster: true,
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
