import { parseTags } from "../../lib/DDBReferenceLinker.js";
import DDBHelper from "../../lib/DDBHelper.js";
import CompendiumHelper from "../../lib/CompendiumHelper.js";
import FileHelper from "../../lib/FileHelper.js";
import SETTINGS from "../../settings.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DICTIONARY from "../../dictionary.js";
import AdvancementHelper from "../advancements/AdvancementHelper.js";


export default class DDBRace {

  static SPECIAL_ADVANCEMENTS = {};

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
      system: utils.getTemplate("race"),
      flags: {
        ddbimporter: {
          type: "race",
        },
        obsidian: {
          source: {
            type: "race",
          },
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

  constructor(ddbData, race, compendiumRacialTraits, noMods = false) {
    this.ddbData = ddbData;
    this.race = race;
    this.#fixups();
    this.compendiumRacialTraits = compendiumRacialTraits;
    this._generateDataStub();
    this.type = "humanoid";
    this._compendiumLabel = CompendiumHelper.getCompendiumLabel("traits");

    this.data.name = (this.race.fullName) ? utils.nameString(this.race.fullName) : utils.nameString(this.race.name);
    this.data.system.description.value += `${this.race.description}\n\n`;

    this.fullName = this.race.fullName;
    this.isLegacy = this.race.isLegacy;
    this.baseRaceName = this.race.baseRaceName;
    this.groupName = DDBRace.getGroupName(this.race.groupIds, this.baseRaceName);
    this.isSubRace = this.race.isSubRace || this.groupName !== this.raceName;

    const sourceIds = this.race.sources.map((sm) => sm.sourceId);
    this.legacy = CONFIG.DDB.sources.some((ddbSource) =>
      sourceIds.includes(ddbSource.id)
      && [23, 26].includes(ddbSource.sourceCategoryId),
    );
    this.is2014 = this.race.isLegacy
      && this.race.sources.some((s) => Number.isInteger(s.sourceId) && s.sourceId < 145);

    this.data.flags.ddbimporter = {
      type: "race",
      entityRaceId: this.race.entityRaceId,
      version: CONFIG.DDBI.version,
      sourceId: this.race.sources.length > 0 ? [0].sourceId : -1, // is homebrew
      baseName: this.race.baseName,
      baseRaceId: this.race.baseRaceId,
      baseRaceName: this.race.baseRaceName,
      fullName: this.race.fullName,
      fullRaceName: this.race.fullName,
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
    };

    if (this.race.moreDetailsUrl) {
      this.data.flags.ddbimporter['moreDetailsUrl'] = this.race.moreDetailsUrl;
    }

    this.data.system.source = DDBHelper.parseSource(this.race);

    if (this.race.isSubRace && this.race.baseRaceName) this.data.system.requirements = this.race.baseRaceName;
    const legacyName = game.settings.get("ddb-importer", "munching-policy-legacy-postfix");
    if (legacyName && this.race.isLegacy) {
      this.data.name += " (Legacy)";
    }

    this.#addWeightSpeeds();
    this.#addSizeAdvancement();

    this.abilityAdvancement = new game.dnd5e.documents.advancement.AbilityScoreImprovementAdvancement();

    this.noMods = noMods || ddbData === null;

    this.advancementHelper = new AdvancementHelper({
      ddbData: this.ddbData,
      type: "race",
      noMods: this.noMods,
    });

    this.featLink = {
      advancementId: null,
      name: null,
      uuid: null,
    };
  }

  async _generateRaceImage() {
    let avatarUrl;
    let largeAvatarUrl;
    let portraitAvatarUrl;

    const targetDirectory = game.settings.get(SETTINGS.MODULE_ID, "other-image-upload-directory").replace(/^\/|\/$/g, "");
    const useDeepPaths = game.settings.get(SETTINGS.MODULE_ID, "use-deep-file-paths");

    if (this.race.portraitAvatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-portrait";
      const pathPostfix = useDeepPaths ? `/race/portrait` : "";
      const downloadOptions = { type: "race-portrait", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
      portraitAvatarUrl = await FileHelper.getImagePath(this.race.portraitAvatarUrl, downloadOptions);
      this.data.img = portraitAvatarUrl;
      this.data.flags.ddbimporter['portraitAvatarUrl'] = this.race.portraitAvatarUrl;
    }

    if (this.race.avatarUrl) {
      const imageNamePrefix = useDeepPaths ? "" : "race-avatar";
      const pathPostfix = useDeepPaths ? `/race/avatar` : "";
      const downloadOptions = { type: "race-avatar", name: this.race.fullName, targetDirectory, imageNamePrefix, pathPostfix };
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
    const typeRegex = /You are a (\S*)\./i;
    const typeMatch = trait.description.match(typeRegex);
    if (typeMatch) {
      logger.debug(`Explicit type detected: ${typeMatch[1]}`, typeMatch);
      this.type = typeMatch[1].toLowerCase();
    }
  }

  #addFeatureDescription(trait) {
    // for whatever reason 2024 races still have a hidden ability score entry
    if (!this.is2014 && trait.name.startsWith("Ability Score ")) return;
    const featureMatch = this.compendiumRacialTraits?.find((match) =>
      foundry.utils.hasProperty(match, "flags.ddbimporter.baseName") && foundry.utils.hasProperty(match, "flags.ddbimporter.entityRaceId")
      && utils.nameString(trait.name) === utils.nameString(match.flags.ddbimporter.baseName)
      && match.flags.ddbimporter.entityRaceId === trait.entityRaceId,
    );
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
      const size = DICTIONARY.character.actorSizes.find((s) => s.id === this.race.sizeId);
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
        const ability = DICTIONARY.character.abilities.find((a) => a.long === fixedMatch[1].toLowerCase());
        if (ability) {
          update.fixed[ability.value] = parseInt(fixedMatch[2]);
        }
      }

      const extraFixedRegex = /and your (\w+) score increases by (\d)/i;
      const extraFixedMatch = trait.description.match(extraFixedRegex);
      if (extraFixedMatch) {
        const ability = DICTIONARY.character.abilities.find((a) => a.long === extraFixedMatch[1].toLowerCase());
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
    if (!["Skills"].includes(trait.name.trim())) return;

    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, "race");
    const skillExplicitMods = mods.filter((mod) =>
      mod.type === "proficiency"
      && DICTIONARY.character.skills.map((s) => s.subType).includes(mod.subType),
    );
    const advancement = this.advancementHelper.getSkillAdvancement(skillExplicitMods, trait, undefined, 0);

    if (advancement) this.data.system.advancement.push(advancement.toObject());
  }

  #generateLanguageAdvancement(trait) {
    if (!["Languages"].includes(trait.name.trim())) return;

    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, "race");

    const advancement = this.advancementHelper.getLanguageAdvancement(mods, trait, 0);
    if (advancement) this.data.system.advancement.push(advancement.toObject());
  }

  #geneateToolAdvancement(trait) {
    if (!["Tools"].includes(trait.name.trim())) return;

    const mods = this.advancementHelper.noMods
      ? []
      : DDBHelper.getModifiers(this.ddbData, "race");

    const advancement = this.advancementHelper.getToolAdvancement(mods, trait, 0);
    if (advancement) this.data.system.advancement.push(advancement.toObject());
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
    if (this.noMods) {
      this.#generateHTMLSenses();
      return;
    }
    for (const senseName in this.data.system.senses) {
      const basicOptions = {
        subType: senseName,
      };
      DDBHelper.filterModifiers((this.ddbData?.character?.modifiers?.race ?? []), "sense", basicOptions).forEach((sense) => {
        if (Number.isInteger(sense.value) && sense.value > this.data.system.senses[senseName]) {
          this.data.system.senses[senseName] = parseInt(sense.value);
        }
      });
      DDBHelper.filterModifiers((this.ddbData?.character?.modifiers?.race ?? []), "set-base", basicOptions).forEach((sense) => {
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


    this.race.racialTraits.forEach((t) => {
      const trait = t.definition;
      this.#addFeatureDescription(trait);
      this.#typeCheck(trait);
      this.#flightCheck(trait);

      this.#generateSkillAdvancement(trait);
      this.#generateLanguageAdvancement(trait);
      this.#geneateToolAdvancement(trait);
      this.#generateFeatAdvancement(trait);
      // FUTURE, spells (at various levels, when supported)
    });

    this.#generateAbilityAdvancement();
    this.#advancementFixes();
    this.#generateSenses();

    // set final type
    foundry.utils.setProperty(this.data, "system.type.value", this.type);

    // finally a tag parse to update the description
    this.data.system.description.value = parseTags(this.data.system.description.value);

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

}

