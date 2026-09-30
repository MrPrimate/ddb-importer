import { DICTIONARY, SETTINGS } from "../../config/_module";
import { utils, logger, CompendiumHelper, DDBToolProficiencies } from "../../lib/_module";
import { AutoEffects } from "../enrichers/effects/_module";
import { DDBBasicActivity } from "../activities/_module";
import { DDBModifiers } from "../lib/_module";
import { parseWeaponMastery } from "../lib/WeaponMastery";
import TraitAdvancement from "dnd5e/dnd5e/module/documents/advancement/trait.mjs";

function htmlToText(html) {
  // keep html brakes and tabs
  return html.replace(/<\/td>/g, "\n")
    .replace(/<\/table>/g, "\n")
    .replace(/<\/tr>/g, "\n")
    .replace(/<\/p>/g, "\n")
    .replace(/<\/div>/g, "\n")
    .replace(/<\/h>/g, "\n")
    .replace(/<br>/g, "\n")
    .replace(/<br( )*\/>/g, "\n")
    .replace(/<[A-Za-z/][^<>]*>/g, "");
}

type TFeature = IDDBRacialTraitDefinition | IDDBClassFeatureDefinition | IDDBBackgroundDefinition | IDDBFeatDefinition;

interface ISpellAdvancementGrant {
  level: number;
  name: string;
  /** Free casts: a number or formula, "" for unlimited, undefined when the text is silent. */
  amount?: string;
  /** Rest that restores the free casts, "lr" when the text does not say. */
  period?: "sr" | "lr";
  /** Free casts a short rest restores when a long rest restores them all ("regain one expended use"). */
  shortRestRecovery?: string;
  /** Sorcery points spent to cast the spell instead of a spell slot. */
  sorceryPoints?: number;
  /** The free cast is one use of the feature itself rather than a count of its own. */
  featureUses?: boolean;
}

interface ISpellAdvancementChoice {
  level: number;
  spellList: string;
  amount: string;
  /** dnd5e spell school keys the chosen spell must come from (Fey Touched: div, enc); hint only before dnd5e 6.0 */
  schools?: string[];
}

interface IParsedSpellAdvancementData {
  spellListCantripChoice: string | null;
  spellListCantripChoiceNum?: number | null;
  spellListChoiceReplace?: boolean;
  cantripChoices: string[];
  cantripGrants: string[];
  spellGrants: ISpellAdvancementGrant[];
  spellChoices: ISpellAdvancementChoice[];
  hint: string;
}

interface IAdvancementGetterOptions  {
  mods: IModifiersMod[];
  feature: TFeature;
  availableToMulticlass?: boolean;
  level: number;
}

export default class AdvancementHelper {
  isMuncher: boolean;
  ddbData: IDDBData;
  type: string;
  isSubclass: boolean;

  constructor({ ddbData, type, dictionary = null, isMuncher = false, isSubclass = false }) {
    this.ddbData = ddbData;
    this.type = type;
    this.isMuncher = isMuncher;
    this.dictionary = dictionary ?? {
      multiclassSkill: 0,
      multiclassTool: 0,
    };
    this.isSubclass = isSubclass;
  }

  static stripDescription(description: string): string {
    const descriptionReplaced = description
      // processed descriptions carry reference links (the Minor &Reference[ill]{Illusion} cantrip)
      .replaceAll(/(?:&amp;|[&@])\w+\[[^\]]*\]\{([^}]*)\}/g, "$1")
      .replaceAll(/<br \/>(?:\s*)*/g, "<br />\n")
      .replaceAll(/<\/p>(?:\s*)*/g, "</p>\n")
      .replaceAll(/<\/dt>(?:\s*)*<dt>/g, "</dt>\n<dt>");
    // console.warn(descriptionReplaced);
    return htmlToText(descriptionReplaced);
    // return utils.stripHtml(descriptionReplaced, true);
  }

  static getChoiceReplacements(description, lowestLevel, choices = {}, forceReplace = false) {
    const replaceRegex = /you can replace(?! one of your attacks)/i;
    const replace = replaceRegex.test(description);

    if (replace || forceReplace) {
      for (const level of utils.arrayRange(20, 1, 1)) {
        if (parseInt(String(level)) < parseInt(lowestLevel)) continue;
        foundry.utils.setProperty(choices, `${level}.replacement`, true);
      }
    } else {
      for (const level of Object.keys(choices)) {
        foundry.utils.setProperty(choices, `${level}.replacement`, false);
      }
    }

    return choices;
  }


  getSkillChoicesFromOptions(feature: TFeature, level: number, proficiencyFeatures: TFeature[] = []) {
    const skillsChosen = new Set<string>();
    const skillChoices = new Set<string>();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      // check all features
      ((feature === null && proficiencyFeatures.some((f) => f.id === choice.componentId && "requiredLevel" in f && f.requiredLevel === level))
      // check specific feature
       || (feature && feature.id === choice.componentId && "requiredLevel" in feature && feature.requiredLevel === level))
      && choice.subType === 1
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.skills.find((skill) => skill.label === option.label);
      if (smallChosen) skillsChosen.add(smallChosen.name);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.skills.find((skill) => skill.label === option.label).name,
      );
      optionNames.forEach((skill) => {
        skillChoices.add(skill);
      });
    });

    return {
      chosen: Array.from(skillsChosen),
      choices: Array.from(skillChoices),
    };
  }

  getToolChoicesFromOptions(feature: TFeature, level: number) {
    const toolsChosen = new Set<string>();
    const toolChoices = new Set<string>();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      feature.id === choice.componentId
      && "requiredLevel" in feature && feature.requiredLevel === level
      && choice.subType === 1
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.proficiencies.find((prof) =>
        prof.type === "Tool"
        && prof.name === option.label
        && prof.baseTool,
      );
      if (smallChosen) {
        const toolStub = smallChosen.toolType === ""
          ? smallChosen.baseTool
          : `${smallChosen.toolType}:${smallChosen.baseTool}`;
        toolsChosen.add(toolStub);
      }
      const optionNames = optionChoice.options
        .filter((option) =>
          DICTIONARY.actor.proficiencies.some((prof) => prof.type === "Tool" && prof.name === option.label && prof.baseTool)
          && choice.optionIds.includes(option.id),
        )
        .map((option) =>
          DICTIONARY.actor.proficiencies.find((prof) => prof.type === "Tool" && prof.name === option.label),
        );
      optionNames.forEach((tool) => {
        const toolStub = tool.toolType === ""
          ? tool.baseTool
          : `${tool.toolType}:${tool.baseTool}`;
        toolChoices.add(toolStub);
      });
    });

    return {
      chosen: Array.from(toolsChosen),
      choices: Array.from(toolChoices),
    };
  }

  getLanguageChoicesFromOptions(feature: TFeature, level: number) {
    const languagesChosen = new Set<string>();
    const languageChoices = new Set<string>();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      feature.id === choice.componentId
      && "requiredLevel" in feature && feature.requiredLevel === level
      && choice.subType === 3
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.languages.find((lang) => lang.name === option.label);
      if (smallChosen) languagesChosen.add(smallChosen.value);
      const optionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.languages.find((lang) => lang.name === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.languages.find((lang) => lang.name === option.label).value,
      );
      optionNames.forEach((skill) => {
        languageChoices.add(skill);
      });
    });

    return {
      chosen: Array.from(languagesChosen),
      choices: Array.from(languageChoices),
    };
  }

  getChoicesFromOptions(feature: TFeature, type: string, level: number, choiceType: string | null = null) {
    const chosen = new Set<string>();
    const choices = new Set<string>();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[choiceType ?? this.type].filter((choice) => {
      return feature.id === choice.componentId
        && "requiredLevel" in feature && feature.requiredLevel === level
        && choice.subType === 1
        && choice.type === 2;
    }).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosen = DICTIONARY.actor.proficiencies.find((prof) => prof.type === type && prof.name === option.label);
      if (smallChosen) {
        const stub = smallChosen.advancement === ""
          ? smallChosen.foundryValue
          : `${smallChosen.advancement}:${smallChosen.foundryValue}`;
        chosen.add(stub);
      }
      const optionNames = optionChoice.options
        .filter((option) =>
          DICTIONARY.actor.proficiencies.some((prof) => prof.type === type && prof.name === option.label)
          && choice.optionIds.includes(option.id),
        )
        .map((option) =>
          DICTIONARY.actor.proficiencies.find((prof) => prof.type === type && prof.name === option.label),
        );
      optionNames.forEach((prof) => {
        const stub = prof.advancement === ""
          ? prof.foundryValue
          : `${prof.advancement}:${prof.foundryValue}`;
        choices.add(stub);
      });
    });

    return {
      chosen: Array.from(chosen),
      choices: Array.from(choices),
    };
  }

  getExpertiseChoicesFromOptions(feature: TFeature, level: number) {
    const skillsChosen = new Set<string>();
    const skillChoices = new Set<string>();
    const toolsChosen = new Set<string>();
    const toolChoices = new Set<string>();

    const choiceDefinitions = this.ddbData.character.choices.choiceDefinitions;

    this.ddbData.character.choices[this.type].filter((choice) =>
      feature.id === choice.componentId
      && "requiredLevel" in feature && feature.requiredLevel === level
      && choice.subType === 2
      && choice.type === 2,
    ).forEach((choice) => {
      const optionChoice = choiceDefinitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
      if (!optionChoice) return;
      const option = optionChoice.options.find((option) => option.id === choice.optionValue);
      if (!option) return;
      const smallChosenSkill = DICTIONARY.actor.skills.find((skill) => skill.label === option.label);
      if (smallChosenSkill) skillsChosen.add(smallChosenSkill.name);
      const smallChosenTool = DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === option.label);
      if (smallChosenTool) toolsChosen.add(smallChosenTool.baseTool);

      const skillOptionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.skills.some((skill) => skill.label === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.skills.find((skill) => skill.label === option.label).name,
      );
      skillOptionNames.forEach((skill) => {
        skillChoices.add(skill);
      });

      const toolOptionNames = optionChoice.options.filter((option) =>
        DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === option.label)
        && choice.optionIds.includes(option.id),
      ).map((option) =>
        DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === option.label).baseTool,
      );
      toolOptionNames.forEach((tool) => {
        toolChoices.add(tool);
      });
    });

    return {
      skills: {
        chosen: Array.from(skillsChosen),
        choices: Array.from(skillChoices),
      },
      tools: {
        chosen: Array.from(toolsChosen),
        choices: Array.from(toolChoices),
      },
    };
  }

  static advancementUpdate(advancement: TraitAdvancement, { pool = [], chosen = [], count = 0, grants = [] } = {}) {
    if (grants.length > 0) {
      advancement.updateSource({
        configuration: {
          grants,
        },
        value: {
          chosen: grants,
        },
      });
    }
    if (pool.length > 0) {
      advancement.updateSource({
        configuration: {
          choices: [{
            count: count === 0 ? undefined : count,
            pool,
          }],
        },
      });
    }

    if (chosen.length > 0) {
      advancement.updateSource({
        value: {
          chosen,
        },
      });
    }
  }

  getSaveAdvancement({feature, mods, availableToMulticlass, level}: IAdvancementGetterOptions): TraitAdvancement {
    // Diamond Soul ships one "saving-throws" modifier for proficiency in every save
    const allSaves = DDBModifiers.filterModifiers(mods, "proficiency", { subType: "saving-throws" }).length > 0;
    const updates = DICTIONARY.actor.abilities
      .filter((ability) => {
        return allSaves || DDBModifiers.filterModifiers(mods, "proficiency", { subType: `${ability.long}-saving-throws` }).length > 0;
      })
      .map((ability) => `saves:${ability.value}`);

    // Unfettered Mind, Elegant Courtier, Iron Mind: "choose-a-saving-throw" style modifiers are
    // a pick of any save rather than a grant
    const chooseCount = mods.filter((mod) =>
      mod.type === "proficiency" && (mod.subType ?? "").startsWith("choose-") && (mod.subType ?? "").includes("saving-throw"),
    ).length;

    if (updates.length === 0 && chooseCount === 0) return null;

    const allowReplacements = [
      "you instead gain saving throw proficiency with one ability in which",
      "instead gain proficiency in",
    ]
      .some((text) => feature.description.includes(text));

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    advancement.updateSource({
      classRestriction: (level > 1 || this.isSubclass)
        ? ""
        : availableToMulticlass ? "secondary" : "primary",
      configuration: {
        grants: updates,
        allowReplacements,
        ...(chooseCount > 0 ? { choices: [{ count: chooseCount, pool: ["saves:*"] }] } : {}),
      },
      level: level,
    });

    // add selection
    if (updates.length > 0) {
      advancement.updateSource({
        value: {
          chosen: updates,
        },
      });
    }

    return advancement;

  }

  static isBaseProficiency(feature) {
    return feature.name === "Proficiencies" || (feature.name.startsWith("Core") && feature.name.endsWith("Traits"));
  }

  /**
   * Feature-named "-proficiency" subtypes that DDB uses for a skill pick (their feature text lists
   * the skills). The slug alone cannot tell these from feature-named weapon or tool picks
   * ("choose-bladesinger-proficiency" is a weapon), so they are listed.
   */
  static SKILL_CHOICE_PROFICIENCY_SLUGS = new Set([
    "enchanter-proficiency",
    "choose-banneret-proficiency",
    "choose-a-nightwatcher-proficiency",
    "choose-primal-lore-proficiency",
    "choose-genies-splendor-proficiency",
    "choose-dhakaani-ghaaldar-proficiency",
  ]);

  /** Open picks that may be a skill or something else; imported as an open skill choice. */
  static MIXED_SKILL_CHOICE_SLUGS = new Set(["choose-a-skill-or-tool", "choose-a-skill-tool-or-weapon"]);

  /** Words in a choose subtype that name no skill: "choose-a-skill", "choose-nature-or-survival". */
  static #CHOOSE_NOISE = new Set(["choose", "a", "an", "or", "and", "the", "proficiency", "skill", "skills"]);

  /**
   * A DDB proficiency modifier whose subtype is a skill choice rather than a named skill:
   * - an open pick, "choose-a-skill" or "choose-a-<class>-skill[-proficiency]";
   * - a feature pick ending "-skill", e.g. "magical-knowledge-skill";
   * - a named list whose every word is a skill, e.g. "choose-nature-or-survival";
   * - one of the listed feature-named or mixed slugs above.
   * Anything else ("choose-cooks-utensils-or-herbalism-kit", "choose-a-kensei-tool",
   * "choose-an-iron-mind-saving-throw") is not a skill choice.
   */
  static isSkillChoiceSubType(subType: string | null | undefined): boolean {
    const slug = (subType ?? "").toLowerCase();
    if (slug === "") return false;
    if (AdvancementHelper.SKILL_CHOICE_PROFICIENCY_SLUGS.has(slug) || AdvancementHelper.MIXED_SKILL_CHOICE_SLUGS.has(slug)) return true;
    if ((/^choose-an?-(?:[a-z-]+-)?skill(?:-proficiency)?$/).test(slug)) return true;
    if (!slug.startsWith("choose-")) return (/-skill(?:-proficiency)?$/).test(slug);
    const { skills, leftover } = AdvancementHelper.#parseChooseSubType(slug);
    return skills.length > 0 && leftover.length === 0;
  }

  /**
   * The skills a choice subtype names, e.g. "choose-deception-insight-or-perception" ->
   * ["dec", "ins", "prc"]. Multi-word skills are matched greedily on their slug tokens;
   * "slight-of-hand" is a DDB typo for Sleight of Hand. An open choice names nothing.
   */
  static skillsFromChooseSubType(subType: string | null | undefined): string[] {
    return AdvancementHelper.#parseChooseSubType(subType).skills;
  }

  /** The skills a choose subtype names, and the words left over that are not skills. */
  static #parseChooseSubType(subType: string | null | undefined): { skills: string[]; leftover: string[] } {
    const tokens = (subType ?? "").toLowerCase().replace("slight-of-hand", "sleight-of-hand").split("-")
      .filter((token) => token !== "" && !AdvancementHelper.#CHOOSE_NOISE.has(token));
    const skills: string[] = [];
    const leftover: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      let matched = false;
      for (const width of [3, 2, 1]) {
        const slug = tokens.slice(i, i + width).join("-");
        const skill = DICTIONARY.actor.skills.find((s) => s.subType === slug);
        if (skill) {
          if (!skills.includes(skill.name)) skills.push(skill.name);
          i += width - 1;
          matched = true;
          break;
        }
      }
      if (!matched) leftover.push(tokens[i]);
    }
    return { skills, leftover };
  }

  /** "Expertise" and the 2024 level-prefixed repeats ("6: Expertise", "9: Expertise") are the class's own pick-two feature. */
  static isExpertiseFeature(name: string): boolean {
    return (/^(\d+: )?Expertise$/).test(name);
  }


  getSkillAdvancement({ mods, feature, availableToMulticlass = undefined, level }: IAdvancementGetterOptions): TraitAdvancement {
    const baseProficiency = AdvancementHelper.isBaseProficiency(feature);
    const skillsFromMods = mods
      .filter((mod) =>
        DICTIONARY.actor.skills.find((s) => s.label === mod.friendlySubtypeName),
      )
      .map((mod) =>
        DICTIONARY.actor.skills.find((s) => s.label === mod.friendlySubtypeName).name,
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedSkills = AdvancementHelper.parseHTMLSkills(feature.description);
    const chosenSkills = this.getSkillChoicesFromOptions(feature, level);

    const count = this.isMuncher && availableToMulticlass && baseProficiency
      ? this.dictionary.multiclassSkill
      : (parsedSkills.number > 0 || parsedSkills.grants.length > 0)
        ? parsedSkills.number
        : baseProficiency && availableToMulticlass
          ? this.dictionary.multiclassSkill
          : mods.length;

    // console.warn(`Parsing skill advancement for level ${level}`, {
    //   availableToMulticlass,
    //   level,
    //   feature,
    //   mods,
    //   parsedSkills,
    //   chosenSkills,
    //   count,
    //   skillsFromMods,
    // });

    if (count === 0 && parsedSkills.grants.length === 0) return null;

    const classRestriction = availableToMulticlass === undefined || this.isSubclass
      ? undefined
      : level > 1 ? "" : availableToMulticlass ? "secondary" : "primary";

    const title = !baseProficiency && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
      ? feature.name
      : "Skill Proficiencies";

    advancement.updateSource({
      title,
      classRestriction,
      configuration: {
        allowReplacements: true,
      },
      level,
    });

    // a choice the description parser could not read still carries its options in the DDB
    // subtype ("choose-nature-or-survival"); an open choice ("choose-a-skill") is any skill
    const chooseMods = mods.filter((mod) => mod.type === "proficiency" && AdvancementHelper.isSkillChoiceSubType(mod.subType));
    const subTypeSkills = chooseMods.flatMap((mod) => AdvancementHelper.skillsFromChooseSubType(mod.subType));
    const openChoice = chooseMods.some((mod) => AdvancementHelper.skillsFromChooseSubType(mod.subType).length === 0);
    const modPool = openChoice
      ? ["*"]
      : [...new Set([...skillsFromMods, ...subTypeSkills])];

    const pool = parsedSkills.choices.length > 0 || parsedSkills.grants.length > 0
      ? parsedSkills.choices.map((skill) => `skills:${skill}`)
      : modPool.map((choice) => `skills:${choice}`);

    const chosen = this.isMuncher || chosenSkills.chosen.length > 0
      ? chosenSkills.chosen.map((choice) => `skills:${choice}`)
        .concat(parsedSkills.grants.map((grant) => `skills:${grant}`))
      : skillsFromMods.map((choice) => `skills:${choice}`);

    const grants = [];
    if (this.isMuncher && availableToMulticlass && baseProficiency && pool.length > 0) {
      grants.push(...skillsFromMods.map((choice) => `skills:${choice}`));
    } else {
      grants.push(...parsedSkills.grants.map((grant) => `skills:${grant}`));
    }

    // console.warn(`Skills`, {
    //   level,
    //   feature,
    //   mods,
    //   skillsFromMods,
    //   parsedSkills,
    //   chosenSkills,
    //   count,
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants,
    });

    // console.warn("Final skill advancement", {
    //   advancement
    // });

    return advancement;
  }


  getLanguageAdvancement(mods: IModifiersMod[], feature: TFeature, level: number): TraitAdvancement {
    const languagesMods = DDBModifiers.filterModifiers(mods, "language");

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedLanguages = AdvancementHelper.parseHTMLLanguages(feature.description);
    const chosenLanguages = this.getLanguageChoicesFromOptions(feature, level);

    const languagesFromMods = languagesMods
      .filter((mod) => DICTIONARY.actor.languages.find((lang) => lang.name === mod.friendlySubtypeName))
      .map((mod) => {
        const language = DICTIONARY.actor.languages.find((lang) => lang.name === mod.friendlySubtypeName);
        return language.advancement ? `${language.advancement}:${language.value}` : language.value;
      });

    const count = parsedLanguages.number > 0 || parsedLanguages.grants.length > 0
      ? parsedLanguages.number !== 0
        ? parsedLanguages.number
        : 1
      : languagesMods.length;

    // console.warn(`Languages`, {
    //   i: level,
    //   languageFeature: feature,
    //   mods,
    //   languagesMods,
    //   parsedLanguages,
    //   chosenLanguages,
    //   languagesFromMods,
    //   languageCount: count,
    // });

    if (count === 0 && parsedLanguages.grants.length === 0) return null;

    const pool = parsedLanguages.choices.length > 0 || parsedLanguages.grants.length > 0
      ? parsedLanguages.choices.map((choice) => `languages:${choice}`)
      : languagesFromMods.map((choice) => `languages:${choice}`);

    const chosen = this.isMuncher || chosenLanguages.chosen.length > 0
      ? chosenLanguages.chosen.map((choice) => `languages:${choice}`)
        .concat(parsedLanguages.grants.map((grant) => `languages:${grant}`))
      : languagesFromMods.map((choice) => `languages:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
        ? feature.name
        : "Languages",
      configuration: {
        allowReplacements: true,
      },
      level: level,
    });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count: count,
      grants: parsedLanguages.grants.map((grant) => `languages:${grant}`),
    });

    return advancement;
  }


  getToolAdvancement({ mods, feature, availableToMulticlass = undefined, level }: IAdvancementGetterOptions): TraitAdvancement {
    const baseProficiency = AdvancementHelper.isBaseProficiency(feature);
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "proficiency");
    const toolMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => prof.type === "Tool" && prof.name === mod.friendlySubtypeName),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedTools = AdvancementHelper.parseHTMLTools(feature.description);
    const chosenTools = this.getToolChoicesFromOptions(feature, level);

    const toolsFromMods = toolMods.map((mod) => {
      const tool = DICTIONARY.actor.proficiencies
        .find((prof) => prof.type === "Tool" && prof.name === mod.friendlySubtypeName && prof.baseTool);
      if (!tool) return null;
      return tool.toolType === ""
        ? tool.baseTool
        : `${tool.toolType}:${tool.baseTool}`;
    }).filter((t) => t !== null);

    const count = this.isMuncher && availableToMulticlass && baseProficiency
      ? this.dictionary.multiclassTools
      : parsedTools.number > 0 || parsedTools.grants.length > 0
        ? parsedTools.number > 0
          ? parsedTools.number
          : 1
        : toolMods.length;

    const classRestriction = availableToMulticlass === undefined || this.isSubclass
      ? undefined
      : level > 1 ? "" : availableToMulticlass ? "secondary" : "primary";

    // console.warn(`Tools`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   toolMods,
    //   parsedTools,
    //   chosenTools,
    //   toolsFromMods,
    //   count,
    // });

    if (count === 0 && parsedTools.grants.length === 0) return null;

    const pool = parsedTools.choices.length > 0 || parsedTools.grants.length > 0
      ? parsedTools.choices.map((choice) => `tool:${choice}`)
      : toolsFromMods.map((choice) => `tool:${choice}`);

    const chosen = this.isMuncher || chosenTools.chosen.length > 0
      ? chosenTools.chosen.map((choice) => `tool:${choice}`)
        .concat(parsedTools.grants.map((grant) => `tool:${grant}`))
      : toolsFromMods.map((choice) => `tool:${choice}`);

    const grants = [];
    if (this.isMuncher && availableToMulticlass && baseProficiency && pool.length > 0) {
      grants.push(...toolsFromMods.map((choice) => `tool:${choice}`));
    } else {
      grants.push(...parsedTools.grants.map((grant) => `tool:${grant}`));
    }

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
        ? feature.name
        : "Tool Proficiencies",
      classRestriction,
      configuration: {
        allowReplacements: true,
      },
      level: level,
    });

    // console.warn("tools", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedTools.grants.map((grant) => `tool:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants,
    });

    return advancement;
  }


  getArmorAdvancement({ mods, feature, availableToMulticlass, level }: IAdvancementGetterOptions): TraitAdvancement {
    const baseProficiency = AdvancementHelper.isBaseProficiency(feature);
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "proficiency");
    const armorMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => prof.type === "Armor" && prof.name === mod.friendlySubtypeName),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedArmors = AdvancementHelper.parseHTMLArmorProficiencies(feature.description);
    const chosenArmors = this.getChoicesFromOptions(feature, "Armor", level);

    const armorsFromMods = armorMods.map((mod) => {
      const armor = DICTIONARY.actor.proficiencies
        .find((prof) => prof.type === "Armor" && prof.name === mod.friendlySubtypeName);
      return armor.advancement === ""
        ? armor.foundryValue
        : `${armor.advancement}:${armor.foundryValue}`;
    });

    const count = parsedArmors.number > 0 || parsedArmors.grants.length > 0
      ? parsedArmors.number > 0
        ? parsedArmors.number
        : 1
      : armorMods.length;

    // console.warn(`Armor`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   toolMods: armorMods,
    //   parsedArmors,
    //   chosenArmors,
    //   armorsFromMods,
    //   count,
    // });

    if (count === 0 && parsedArmors.grants.length === 0) return null;

    const classRestriction = availableToMulticlass === undefined || this.isSubclass
      ? undefined
      : level > 1 ? "" : availableToMulticlass ? "secondary" : "primary";

    const pool = parsedArmors.choices.length > 0 || parsedArmors.grants.length > 0
      ? parsedArmors.choices.map((choice) => `armor:${choice}`)
      : armorsFromMods.map((choice) => `armor:${choice}`);

    const chosen = this.isMuncher || chosenArmors.chosen.length > 0
      ? chosenArmors.chosen.map((choice) => `armor:${choice}`)
        .concat(parsedArmors.grants.map((grant) => `armor:${grant}`))
      : armorsFromMods.map((choice) => `armor:${choice}`);

    const grants = [];
    if (this.isMuncher && availableToMulticlass && baseProficiency && pool.length > 0) {
      grants.push(...armorsFromMods.map((choice) => `armor:${choice}`));
    } else {
      grants.push(...parsedArmors.grants.map((grant) => `armor:${grant}`));
    }

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
        ? feature.name
        : "Armor Training",
      classRestriction,
      configuration: {
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("armor", {
    //   pool,
    //   chosen,
    //   count,
    //   grants,
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants,
    });

    return advancement;
  }


  getWeaponAdvancement(mods, feature, availableToMulticlass, level) {
    const baseProficiency = AdvancementHelper.isBaseProficiency(feature);
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "proficiency");
    const weaponMods = proficiencyMods
      .filter((mod) =>
        DICTIONARY.actor.proficiencies
          .some((prof) => prof.type === "Weapon" && prof.name === mod.friendlySubtypeName),
      );

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedWeapons = this.isMuncher && availableToMulticlass
      ? { number: 0, choices: [], grants: [] }
      : AdvancementHelper.parseHTMLWeaponProficiencies(feature.description);
    const chosenWeapons = this.getChoicesFromOptions(feature, "Weapon", level);

    const weaponsFromMods = weaponMods.map((mod) => {
      const weapon = DICTIONARY.actor.proficiencies
        .find((prof) => prof.type === "Weapon" && prof.name === mod.friendlySubtypeName);
      return weapon.advancement === ""
        ? weapon.foundryValue
        : `${weapon.advancement}:${weapon.foundryValue}`;
    });

    const count = parsedWeapons.number > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.number > 0
        ? parsedWeapons.number
        : 1
      : weaponMods.length;

    // console.warn(`Weapon`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   parsedMasteries,
    //   parsedWeapons,
    //   chosenWeapons,
    //   weaponsFromMods,
    //   count,
    // });

    if (count === 0 && parsedWeapons.grants.length === 0) return null;

    const classRestriction = availableToMulticlass === undefined || this.isSubclass
      ? undefined
      : level > 1 ? "" : availableToMulticlass ? "secondary" : "primary";

    const pool = parsedWeapons.choices.length > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.choices.map((choice) => `weapon:${choice}`)
      : weaponsFromMods.map((choice) => `weapon:${choice}`);


    const chosen = this.isMuncher || chosenWeapons.chosen.length > 0
      ? chosenWeapons.chosen.map((choice) => `weapon:${choice}`)
        .concat(parsedWeapons.grants.map((grant) => `weapon:${grant}`))
      : weaponsFromMods.map((choice) => `weapon:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
        ? feature.name
        : "Weapon Proficiencies",
      classRestriction,
      configuration: {
        mode: "default",
        allowReplacements: false,
      },
      level: level,
    });

    // console.warn("weapons", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    // });

    const grants = [];
    if (this.isMuncher && availableToMulticlass && baseProficiency && pool.length > 0) {
      grants.push(...weaponsFromMods.map((choice) => `weapon:${choice}`));
    } else {
      grants.push(...parsedWeapons.grants.map((grant) => `weapon:${grant}`));
    }

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants,
    });

    return advancement;
  }

  //   {
  //     "fixedValue": null,
  //     "id": "62627888",
  //     "entityId": 4,
  //     "entityTypeId": 1782728300,
  //     "type": "weapon-mastery",
  //     "subType": "sap-longsword",
  //     "dice": null,
  //     "restriction": "",
  //     "statId": null,
  //     "requiresAttunement": false,
  //     "duration": null,
  //     "friendlyTypeName": "Weapon Mastery",
  //     "friendlySubtypeName": "Sap (Longsword)",
  //     "isGranted": true,
  //     "bonusTypes": [],
  //     "value": null,
  //     "availableToMulticlass": true,
  //     "modifierTypeId": 43,
  //     "modifierSubTypeId": 1942,
  //     "componentId": 1789142,
  //     "componentTypeId": 1088085227,
  //     "tagConstraints": []
  // },

  getWeaponMasteryAdvancement(mods, feature, level) {
    const proficiencyMods = DDBModifiers.filterModifiers(mods, "weapon-mastery");
    // DDB labels a mastery "Topple (Quarterstaff)"; ammunition variants and catalogue weapons
    // missing from the dictionary are resolved by the shared parser
    const parsedMasteries = proficiencyMods.map((mod) => parseWeaponMastery(mod.friendlySubtypeName))
      .filter((mastery) => mastery !== null);
    const weaponsFromMods = [...new Set(parsedMasteries.map((mastery) => mastery.advancement))];

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedWeapons = AdvancementHelper.parseHTMLWeaponMasteryProficiencies(feature.description);
    const chosenWeapons = this.getChoicesFromOptions(feature, "Weapon", level);

    const count = parsedWeapons.number > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.number > 0
        ? parsedWeapons.number
        : 1
      : weaponsFromMods.length;

    // console.warn(`Weapon Mastery`, {
    //   level,
    //   feature,
    //   mods,
    //   proficiencyMods,
    //   parsedMasteries,
    //   parsedWeapons,
    //   chosenWeapons,
    //   weaponsFromMods,
    //   count,
    // });

    if (count === 0 && parsedWeapons.grants.length === 0) return null;

    const pool = parsedWeapons.choices.length > 0 || parsedWeapons.grants.length > 0
      ? parsedWeapons.choices.map((choice) => `weapon:${choice}`)
      : weaponsFromMods.map((choice) => `weapon:${choice}`);


    const chosen = this.isMuncher || chosenWeapons.chosen.length > 0
      ? chosenWeapons.chosen.map((choice) => `weapon:${choice}`)
        .concat(parsedWeapons.grants.map((grant) => `weapon:${grant}`))
      : weaponsFromMods.map((choice) => `weapon:${choice}`);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
        ? feature.name
        : "Weapon Masteries",
      configuration: {
        mode: "mastery",
        allowReplacements: true,
      },
      level: level,
    });

    // console.warn("weapons", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedWeapons.grants.map((grant) => `weapon:${grant}`),
    });

    return advancement;
  }

  /**
   * Expertise from a feature. With `mods` (the feature's DDB expertise modifiers) the
   * advancement is driven by them: named skills and tools are grants, "choose" modifiers
   * set the count, and a feature with no expertise modifier yields nothing, which is what
   * lets subclass features share a name with a feature that grants none. Without `mods`
   * the classic pick-two shape is kept.
   */
  getExpertiseAdvancement(feature, level, mods: IModifiersMod[] | null = null) {
    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();
    const expertiseOptions = this.getExpertiseChoicesFromOptions(feature, level);
    const isExpertise = AdvancementHelper.isExpertiseFeature(feature.name);
    const fixedShape = isExpertise || ["Survivalist", "Scholar"].includes(feature.name);

    const expertiseMods = (mods ?? []).filter((mod) => mod.type === "expertise");
    if (mods && expertiseMods.length === 0 && !fixedShape) return null;

    const modGrants: string[] = [];
    let chooseCount = 0;
    for (const mod of expertiseMods) {
      const skill = DICTIONARY.actor.skills.find((s) => s.label === mod.friendlySubtypeName || s.subType === mod.subType);
      const tool = DICTIONARY.actor.proficiencies.find((p) => p.type === "Tool" && p.name === mod.friendlySubtypeName && p.baseTool);
      if (skill) modGrants.push(`skills:${skill.name}`);
      else if (tool) modGrants.push(`tool:${tool.baseTool}`);
      else chooseCount++;
    }

    const basePool = feature.name === "Survivalist"
      ? ["skills:prc", "skills:nat"]
      : isExpertise
        ? ["skills:*", "tool:thief"]
        : ["skills:*"];

    const grants = feature.name === "Survivalist"
      ? basePool
      : [...new Set(modGrants)];

    const expertiseOptionCount = expertiseOptions.skills.chosen.length + expertiseOptions.tools.chosen.length;
    let count = 2;

    if (feature.name === "Survivalist") count = 0;
    else if (feature.name === "Scholar") count = 1;
    else if (expertiseOptionCount > 0) count = expertiseOptionCount;
    else if (mods && !isExpertise) count = chooseCount;

    // a feature whose expertise is fully granted offers no pick
    const pool = count === 0 && grants.length > 0 && feature.name !== "Survivalist" ? [] : basePool;

    advancement.updateSource({
      title: feature.name === "Survivalist"
        ? `${feature.name} (Expertise)`
        : isExpertise ? "Expertise" : `${feature.name}`,
      configuration: {
        allowReplacements: false,
        mode: "expertise",
      },
      level: level,
    });

    const chosenSkills = expertiseOptions.skills.chosen.map((skill) => `skills:${skill}`);
    const chosenTools = expertiseOptions.tools.chosen.map((tool) => `tool:${tool}`);
    const chosen = [...new Set([...chosenSkills, ...chosenTools, ...grants])];

    AdvancementHelper.advancementUpdate(advancement, {
      chosen,
      pool,
      count,
      grants,
    });

    // console.warn("Generated expertise advancement", advancement)

    return advancement;

  }

  static CONDITION_ID_MAPPING = {
    1: "dr",
    2: "di",
    3: "dv",
    4: "ci",
  };

  getConditionAdvancement(mods, feature, level) {
    const conditionsFromMods = [];
    ["resistance", "immunity", "vulnerability", "immunity"].forEach((condition, i) => {
      const proficiencyMods = DDBModifiers.filterModifiers(mods, condition, { restriction: null });
      const conditionId = i + 1;
      const conditionData = AutoEffects.getGenericConditionAffectData(proficiencyMods, condition, conditionId, true);
      const conditionValues = new Set(conditionData.map((result) => `${AdvancementHelper.CONDITION_ID_MAPPING[conditionId]}:${result.value}`));
      // console.warn("Individual Parse", {
      //   proficiencyMods,
      //   condition,
      //   conditionId,
      //   conditionData,
      //   conditionValues,
      // });
      conditionsFromMods.push(...conditionValues);
    });

    const advancement = new game.dnd5e.documents.advancement.TraitAdvancement();

    const parsedConditions = AdvancementHelper.parseHTMLConditions(feature.description);

    const count = parsedConditions.number > 0 || parsedConditions.grants.length > 0
      ? parsedConditions.number > 0
        ? parsedConditions.number
        : 1
      : conditionsFromMods.length;

    if (count === 0 && parsedConditions.grants.length === 0) return null;

    const pool = this.isMuncher || parsedConditions.choices.length > 0 || parsedConditions.grants.length > 0
      ? parsedConditions.choices.map((choice) => choice)
      : conditionsFromMods.map((choice) => choice);

    const chosen = this.isMuncher
      ? parsedConditions.grants.map((grant) => grant)
      : conditionsFromMods.map((choice) => choice);

    advancement.updateSource({
      title: feature.name && !feature.name.startsWith("Background:") && !feature.name.startsWith("Core ") && !feature.name.startsWith("Proficiencies")
        ? feature.name
        : "",
      configuration: {
        allowReplacements: false,
        hint: parsedConditions.hint,
      },
      level: level,
    });

    // console.warn("conditions", {
    //   pool,
    //   chosen,
    //   count,
    //   grants: parsedConditions.grants.map((grant) => grant),
    // });

    AdvancementHelper.advancementUpdate(advancement, {
      pool,
      chosen,
      count,
      grants: parsedConditions.grants.map((grant) => grant),
    });

    return advancement;
  }

  // Feats with multichoices
  // You gain proficiency in any combination of three skills or tools of your choice.

  static convertToSingularDie(advancement) {
    advancement.title += ` (Die)`;
    for (const key of Object.keys(advancement.configuration.scale)) {
      advancement.configuration.scale[key].n = 1;
    }
    return advancement;
  }

  static renameTotal(advancement) {
    advancement.title += ` (Total)`;
    return advancement;
  }

  static rename(advancement, { newName = null, identifier = null } = {}) {
    if (newName) advancement.title = newName;
    if (identifier) advancement.configuration.identifier = identifier;
    return advancement;
  }

  /**
   * Builds an additional-advancement function producing a numeric scale value that DDB has no
   * levelScale for, so the values come from the rules text (e.g. a point pool whose DDB scale
   * tracks something else). The generated source advancement is ignored.
   */
  static fixedNumberScale({ title, identifier, scale }: {
    title: string;
    identifier: string;
    scale: Record<string, number>;
  }): TDDBScaleValueFixFunction {
    return (_advancement: I5eAdvancementScaleValue): I5eAdvancement => {
      const adv = new game.dnd5e.documents.advancement.ScaleValueAdvancement();
      const update = {
        configuration: {
          identifier,
          type: "number",
          scale: {} as Record<string, I5eAdvScaleValueNumericEntry>,
        },
        title,
      };
      for (const [level, value] of Object.entries(scale)) {
        update.configuration.scale[level] = { value };
      }
      adv.updateSource(update as any);
      return adv.toObject() as unknown as I5eAdvancement;
    };
  }

  /**
   * Adds level entries missing from a generated scale, for DDB levelScales that only record the
   * value at the level it changes (a scale with no entry at or below the current level resolves
   * to nothing in dnd5e). Existing entries win.
   */
  static addScaleEntries(advancement: I5eAdvancement, { scale = undefined }: IDDBFixFunctionArgs = {}): I5eAdvancement {
    if (!scale) return advancement;
    if (!("configuration" in advancement) || !advancement.configuration) return advancement;
    const configuration = advancement.configuration as I5eAdvScaleValueConfig;
    configuration.scale ??= {};
    for (const [level, entry] of Object.entries(scale)) {
      configuration.scale[level] ??= foundry.utils.deepClone(entry);
    }
    return advancement;
  }

  static addAdditionalUses(advancement: I5eAdvancement) {
    const adv = new game.dnd5e.documents.advancement.ScaleValueAdvancement();
    const update = {
      configuration: {
        identifier: `${(advancement.configuration as I5eAdvScaleValueConfig).identifier}-uses`,
        type: "number",
        scale: {},
      },
      title: `${advancement.title} (Uses)`,
    };

    for (const [key, value] of Object.entries((advancement.configuration as I5eAdvScaleValueConfig).scale ?? {})) {
      // console.warn("key", {key, value});
      update.configuration.scale[key] = {
        value: (value as I5eAdvScaleValueDiceEntry).number,
      };
    }
    adv.updateSource(update);

    return adv.toObject();
  }

  static addSingularDie(advancement) {
    const scaleValue = AdvancementHelper.convertToSingularDie(foundry.utils.duplicate(advancement));

    scaleValue._id = foundry.utils.randomID();
    scaleValue.configuration.identifier = `${advancement.configuration.identifier}-die`;

    return scaleValue;
  }

  static generateScaleValueAdvancement(feature) {
    // distance, number, dice, anything
    let type = "string";
    const die = feature.levelScales[0]?.dice
      ? feature.levelScales[0]?.dice
      : feature.levelScales[0]?.die
        ? feature.levelScales[0]?.die
        : undefined;

    if (die?.diceString && (!die.fixedValue || die.fixedValue === "")) {
      type = "dice";
    } else if (feature.levelScales[0].fixedValue
      && feature.levelScales[0].fixedValue !== ""
      && Number.isInteger(feature.levelScales[0].fixedValue)
    ) {
      type = "number";
    }

    const advancement = new game.dnd5e.documents.advancement.ScaleValueAdvancement();

    const name = utils.nameString(feature.name);

    const update = {
      configuration: {
        identifier: utils.referenceNameString(name).toLowerCase(),
        type,
        scale: {},
      },
      value: {},
      title: name,
    };

    feature.levelScales.forEach((scale) => {
      const level = Math.max(scale.level, feature.requiredLevel ?? 1);
      const die = scale.dice ? scale.dice : scale.die ? scale.die : undefined;
      if (type === "dice") {
        update.configuration.scale[level] = {
          n: die.diceCount,
          die: die.diceValue,
        };
      } else if (type === "number") {
        update.configuration.scale[level] = {
          value: scale.fixedValue,
        };
      } else {
        let value = (die.diceString && die.diceString !== "")
          ? die.diceString
          : "";
        if (die.fixedValue && die.fixedValue !== "") {
          value += ` + ${die.fixedValue}`;
        }
        if (value === "") {
          value = scale.description;
        }
        update.configuration.scale[level] = {
          value,
        };
      }
    });

    advancement.updateSource(update);

    return advancement.toObject();
  }

  static parseHTMLSaves(description) {
    const results = [];

    const textDescription = AdvancementHelper.stripDescription(description);

    // get class saves
    const savingText = textDescription.toLowerCase().split("saving throws:").pop().split("\n")[0].split("The")[0].split(".")[0].split("skills:")[0].trim();
    const saveRegex = /(.*)(?:$|The|\.$|\w+:)/im;
    const saveMatch = savingText.match(saveRegex);

    if (saveMatch) {
      const saveNames = saveMatch[1].replace(" and ", ",").split(",").map((ab) => ab.trim());
      const saves = saveNames
        .filter((name) => DICTIONARY.actor.abilities.some((ab) => ab.long.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictAbility = DICTIONARY.actor.abilities.find((ab) => ab.long.toLowerCase() === name.toLowerCase());
          return dictAbility.value;
        });
      results.push(...saves);
    }
    return results;
  }

  /**
   * Parses an HTML table and retrieves the td value for a given th key
   * @param {string} html The HTML string containing the table
   * @param {string} key The th value to look up
   * @returns {string|null} The corresponding td value, or null if not found
   */
  static getTableValue(html, key) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const rows = doc.querySelectorAll("tr");

    for (const row of rows) {
      const th = row.querySelector("th");
      const td = row.querySelector("td");

      if (th && td && th.textContent.trim() === key) {
        return td.textContent.trim();
      }
    }

    return null;
  }

  static parseHTMLSkills(description) {
    const parsedSkills = {
      choices: [],
      grants: [],
      number: 0,
      allowReplacements: true,
    };

    const tableAdvancements = AdvancementHelper.getTableValue(description, "Skill Proficiencies");
    if (tableAdvancements) {
      const anyChoiceRegex = /choose any (\d+) /i;
      const anyChoiceMatch = tableAdvancements.match(anyChoiceRegex);
      if (anyChoiceMatch) {
        parsedSkills.choices = ["*"];
        parsedSkills.number = parseInt(anyChoiceMatch[1]);
        return parsedSkills;
      }

      const chooseRegex = /Choose (\d+)(?:[ :])/i;
      const chooseMatch = tableAdvancements.match(chooseRegex);
      if (chooseMatch) {
        parsedSkills.number = parseInt(chooseMatch[1]);
      }

      const skillNames = tableAdvancements.split(":").pop()
        .replaceAll(" and ", ",")
        .replaceAll(" or ", ",")
        .split(",")
        .map((name) => name.trim());

      const skills = skillNames
        .filter((name) => DICTIONARY.actor.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictSkill = DICTIONARY.actor.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
          return dictSkill.name;
        });
      parsedSkills.choices = skills;

      return parsedSkills;
    }

    const textDescription = AdvancementHelper.stripDescription(description).replace(/\s/g, " ");

    // Choose any three e.g. bard
    const anySkillRegex = /Skills:\sChoose any (\w+)(.*)($|\.$|\w+:)/im;
    const anyMatch = textDescription.match(anySkillRegex);

    if (anyMatch) {
      // const skills = DICTIONARY.actor.skills.map((skill) => skill.name);
      const numberSkills = DICTIONARY.numbers.find((num) => anyMatch[1].toLowerCase() === num.natural);
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = ["*"];
      return parsedSkills;
    }

    // Skill Proficiencies: Nature, Survival
    const backgroundSkillRegex = /Skill Proficiencies:\s(.*?)($|\.$|\w+:)/im;
    const backgroundMatch = textDescription.match(backgroundSkillRegex);

    if (backgroundMatch) {
      const skills = backgroundMatch[1].replace(" and ", ",").split(",").map((skill) => skill.trim());
      skills.forEach((grant) => {
        const dictSkill = DICTIONARY.actor.skills
          .find((skill) =>
            skill.label.toLowerCase() === grant.toLowerCase().split(" ")[0]
            || grant.toLowerCase().includes(skill.label.toLowerCase()),
          );
        if (dictSkill) parsedSkills.grants.push(dictSkill.name);
      });
      return parsedSkills;
    }

    // most other class profs
    // Skills: Choose two from Arcana, Animal Handling, Insight, Medicine, Nature, Perception, Religion, and Survival
    const skillText = textDescription.toLowerCase().split("skills:").pop().split("\n")[0].split("the")[0].split(".")[0].trim();
    const skillRegex = /choose (\w+)(?:\sskills)* from (.*)($|The|\.|\w+:)/im;
    const skillMatch = skillText.match(skillRegex);

    // common feature choice
    // you gain proficiency in one of the following skills of your choice: Deception, Performance, or Persuasion.
    // you gain proficiency with two of the following skills of your choice: Deception, Insight, Intimidation
    const oneOffRegex = /you gain proficiency (?:in|with) (\w+) of the following skills of your choice:\s(.*?)(\.|$)/im;
    const oneOffMatch = textDescription.match(oneOffRegex);

    // You also become proficient in your choice of two of the following skills: Arcana, History, Nature, or Religion.
    const twoRegex = /also become proficient in your choice of (\w+) of the following skills:\s(.*?)(\.|$)/im;
    const twoMatch = textDescription.match(twoRegex);

    // You gain proficiency in two skills of your choice from the following list: Deception, History, Insight, ... or Stealth.
    const listRegex = /you gain proficiency (?:in|with) (\w+) skills? of your choice from the following list:\s(.*?)(\.|$)/im;
    const listMatch = textDescription.match(listRegex);

    if (skillMatch || oneOffMatch || twoMatch || listMatch) {
      const match = skillMatch ?? oneOffMatch ?? twoMatch ?? listMatch;
      const skillNames = match[2].replace(" and ", ",").replace(" or ", " ").split(",").map((skill) => skill.trim());
      const skills = skillNames
        .filter((name) => DICTIONARY.actor.skills.some((skill) => skill.label.toLowerCase() === name.toLowerCase()))
        .map((name) => {
          const dictSkill = DICTIONARY.actor.skills.find((skill) => skill.label.toLowerCase() === name.toLowerCase());
          return dictSkill.name;
        });
      const numberSkills = DICTIONARY.numbers.find((num) => match[1].toLowerCase() === num.natural);
      parsedSkills.number = numberSkills ? numberSkills.num : 2;
      parsedSkills.choices = skills;
      return parsedSkills;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedSkills;

    // You gain proficiency in one skill of your choice.
    // You gain proficiency in an additional skill or learn a new language of your choice.
    // You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.
    const additionalMatchRegex = /You gain (?:one skill proficiency of your choice|proficiency in (?:an additional skill|one skill of your choice))/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      parsedSkills.number = 1;
      parsedSkills.choices = ["*"];
      return parsedSkills;
    }

    // You gain proficiency in the Intimidation skill.
    // You gain proficiency in the Insight and Medicine skills, and you
    // you gain proficiency in the Performance skill if you don’t already have it.
    const explicitSkillGrantRegex = /You gain proficiency in the (.*) skill( if you don’t already have it)?/i;
    const explicitSkillGrantMatch = textDescription.match(explicitSkillGrantRegex);

    if (explicitSkillGrantMatch) {
      const skills = explicitSkillGrantMatch[1].replace(" and ", ",").split(",").map((skill) => skill.trim());
      skills.forEach((grant) => {
        const dictSkill = DICTIONARY.actor.skills
          .find((skill) => skill.label.toLowerCase() === grant.toLowerCase());
        if (dictSkill) parsedSkills.grants.push(dictSkill.name);
      });
      return parsedSkills;
    }

    // not matches, so return empty parsed set
    return parsedSkills;
  }

  static parseHTMLLanguages(description) {
    const parsedLanguages = {
      grants: [],
      choices: [],
      number: 0,
    };
    const textDescription = AdvancementHelper.stripDescription(description);

    // Background languages
    const languagesRegex = /Languages:\s(.*?)($|\.$|\w+:)/im;
    const languagesMatch = textDescription.match(languagesRegex);

    // Your character knows at least three languages: Common plus two languages you roll or choose from the Standard Languages table
    const standardLanguagesRegex = /Your character knows at least three languages:\sCommon plus two languages you roll or choose from the Standard Languages table/im;
    const standardLanguagesMatch = textDescription.match(standardLanguagesRegex);
    if (standardLanguagesMatch) {
      parsedLanguages.grants = ["standard:common"];
      parsedLanguages.number = 2;
      parsedLanguages.choices = ["standard:*"];
      return parsedLanguages;
    }

    // Languages: Giant and one other language of your choice
    // Languages: Any one of your choice
    // Languages: one of your choice
    // Languages: One of your choice of Elvish, Gnomish, Goblin, or Sylvan
    // Languages: Two of your choice
    if (languagesMatch) {
      const choiceRegexComplex = /(?:(\w+)?(?: and))?\s?(?:(\w+)(?: other language)*)\sof\syour\schoice(?: of (.*))*/im;
      const complexMatch = languagesMatch[1].match(choiceRegexComplex);
      if (complexMatch) {
        if (complexMatch[1]) {
          const dictMatch = DICTIONARY.actor.languages.find((l) =>
            l.name.toLowerCase() === complexMatch[1].split(" ")[0].toLowerCase().trim()
            || complexMatch[1].toLowerCase().includes(l.name.toLowerCase()),
          );
          if (dictMatch) {
            const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
            parsedLanguages.grants.push(language);
          }
        }
        if (complexMatch[2]) {
          const number = DICTIONARY.numbers.find((num) => complexMatch[2].toLowerCase().trim() === num.natural);
          parsedLanguages.number = number ? number.num : 1;
          if (complexMatch[3]) {
            const languages = complexMatch[3].replace(" or ", ",").split(",").map((skill) => skill.trim());
            languages.forEach((choice) => {
              const dictMatch = DICTIONARY.actor.languages.find((l) =>
                l.name.toLowerCase() === choice.toLowerCase().split(" ")[0]
                || choice.toLowerCase().includes(l.name.toLowerCase()),
              );
              if (dictMatch) {
                const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
                parsedLanguages.choices.push(language);
              }
            });
          } else {
            parsedLanguages.choices = ["*"];
          }
        }
        return parsedLanguages;
      }

      // Languages: Choose one of Draconic, Goblin, or Vedalken
      const choiceOfRegex = /choose (\w+)(?: of (.*))*/im;
      const simpleChoice = textDescription.match(choiceOfRegex);
      if (simpleChoice) {
        const number = DICTIONARY.numbers.find((num) => simpleChoice[1].toLowerCase().trim() === num.natural);
        parsedLanguages.number = number ? number.num : 1;
        if (simpleChoice[2]) {
          const languages = simpleChoice[2].replace(" or ", ",").split(",").map((skill) => skill.trim());
          languages.forEach((choice) => {
            const dictMatch = DICTIONARY.actor.languages.find((l) =>
              l.name.toLowerCase() === choice.toLowerCase().split(" ")[0]
              || choice.toLowerCase().includes(l.name.toLowerCase()),
            );
            // console.warn("lang check", {
            //   simple: simpleChoice[2],
            //   choice,
            //   languages,
            //   matchVal: choice.toLowerCase().split(" ")[0],
            //   dictMatch,
            // });
            if (dictMatch) {
              const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
              parsedLanguages.choices.push(language);
            }
          });
        } else {
          parsedLanguages.choices = ["*"];
        }

        return parsedLanguages;
      }

      // Languages: Draconic or Elven
      parsedLanguages.number = 1;
      if (languagesMatch[1]) {
        const languages = languagesMatch[1].replace(" or ", ",").split(",").map((skill) => skill.trim());
        languages.forEach((choice) => {
          const dictMatch = DICTIONARY.actor.languages.find((l) => l.name.toLowerCase() === choice.toLowerCase());
          if (dictMatch) {
            const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
            parsedLanguages.choices.push(language);
          }
        });
        return parsedLanguages;
      }
    }

    // you learn one language of your choice.
    // You also learn two languages of your choice.
    // You gain proficiency in an additional skill or learn a new language of your choice.
    // learn one language of your choice that is spoken by your
    const ofYourChoiceRegex = /learn (\w+?|a new) language(?:s)? of your choice/im;
    const ofYourChoiceMatch = textDescription.match(ofYourChoiceRegex);

    if (ofYourChoiceMatch) {
      const number = DICTIONARY.numbers.find((num) => ofYourChoiceMatch[1].toLowerCase() === num.natural);
      parsedLanguages.number = number ? number.num : 2;
      parsedLanguages.choices = ["*"];
      return parsedLanguages;
    }

    // You can speak, read, and write Common and Dwarvish.
    // You can speak, read, and write Common and Elvish.
    // You can speak, read, and write Common and one extra language of your choice
    // Your character can speak, read, and write Common and one other language that
    // You learn to speak, read, and write Sylvan.
    // You gain proficiency with smith’s tools, and you learn to speak, read, and write Giant.
    const speakReadAndWriteRegex = /speak, read, and write (.*?)(?:\.|$)/im;
    const speakReadAndWriteMatch = textDescription.match(speakReadAndWriteRegex);

    if (speakReadAndWriteMatch) {
      const languages = speakReadAndWriteMatch[1].replace(" and ", ",").split(",").map((skill) => skill.trim());
      parsedLanguages.number = 0;
      languages.forEach((grant) => {
        if (grant.includes("other language") || grant.includes("of your choice")) {
          parsedLanguages.number++;
          parsedLanguages.choices = ["*"];
        } else {
          const dictMatch = DICTIONARY.actor.languages.find((l) => l.name.toLowerCase() === grant.toLowerCase());
          if (dictMatch) {
            const language = dictMatch.advancement ? `${dictMatch.advancement}:${dictMatch.value}` : dictMatch.value;
            parsedLanguages.grants = [language];
          }
        }

      });
      return parsedLanguages;
    }

    // You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.
    const featMatchRegex = /fluency in (\w+) language(?:s)? of your choice/i;
    const featMatch = textDescription.match(featMatchRegex);

    if (featMatch) {
      const number = DICTIONARY.numbers.find((num) => featMatch[1].toLowerCase() === num.natural);
      parsedLanguages.number = number ? number.num : 1;
      parsedLanguages.number = 1;
      parsedLanguages.choices = ["*"];
      return parsedLanguages;
    }

    return parsedLanguages;
  }

  static TOOL_GROUPS = {
    "musical instrument": "music",
    "gaming set": "game",
    "artisan's tools": "art",
    "vehicle": "vehicle",
  };

  static getToolGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.TOOL_GROUPS)) {
      if (utils.nameString(text).toLowerCase().includes(key)) return value;
    }
    return null;
  }

  static getDictionaryTool(name) {
    const directMatch = DICTIONARY.actor.proficiencies.find((tool) =>
      tool.type === "Tool"
      && tool.name.toLowerCase() === utils.nameString(name).toLowerCase(),
    );
    if (directMatch) return directMatch;

    const dictionaryTools = DICTIONARY.actor.proficiencies.filter((tool) => tool.type === "Tool");
    for (const tool of dictionaryTools) {
      if (utils.nameString(name).toLowerCase().includes(tool.name.toLowerCase())) return tool;
    }
    return null;
  }

  static getToolAdvancementValue(text) {
    const match = AdvancementHelper.getDictionaryTool(text);
    if (match) {
      // tools dnd5e has no id for are keyed off their name, the same as they are on the actor
      const key = DDBToolProficiencies.getToolKey(match);
      const stub = match.toolType === ""
        ? key
        : `${match.toolType}:${key}`;
      return stub;
    }
    return null;
  }


  static parseHTMLTools(description) {
    const parsedTools = {
      choices: [],
      grants: [],
      number: 0,
    };

    const tableAdvancements = AdvancementHelper.getTableValue(description, "Tool Proficiencies");
    if (tableAdvancements) {
      const anyChoiceRegex = /choose any (\d+) /i;
      const anyChoiceMatch = tableAdvancements.match(anyChoiceRegex);
      if (anyChoiceMatch) {
        parsedTools.choices = ["*"];
        parsedTools.number = parseInt(anyChoiceMatch[1]);
        return parsedTools;
      }

      const proficiencies = new Set();

      const toolNames = tableAdvancements
        .split("(")[0]
        .split(":").pop()
        .replaceAll(" and ", ",")
        .replaceAll(" or ", ",")
        .split(",")
        .map((name) => name.trim());

      let isChoice = false;

      const toolTypeOfRegex = /choose (\w+|\d+) type of (.*)($|\.:)/i;
      const toolChoiceRegex = /choose (\d+|\w+) (.*)($|\.:)/i;
      const finalChoiceRegex = /(\d+|\w+) (.*) of your choice($|\.:)/i;
      for (const toolString of toolNames) {
        const toolChoiceMatch = toolString.match(toolTypeOfRegex)
          ?? toolString.match(toolChoiceRegex)
          ?? toolString.match(finalChoiceRegex);
        if (toolChoiceMatch) {
          isChoice = true;
          const numberTools = DICTIONARY.numbers.find((num) => toolChoiceMatch[1].toLowerCase() === num.natural)
            ?? parseInt(toolChoiceMatch[1]);
          parsedTools.number = numberTools ? numberTools.num : 1;
          toolChoiceMatch[2].split(" or ").forEach((toolGroupMatch) => {
            const toolGroup = AdvancementHelper.getToolGroup(toolGroupMatch.trim());
            if (toolGroup) {
              proficiencies.add(`${toolGroup}:*`);
            }
          });
        } else {
          const stub = AdvancementHelper.getToolAdvancementValue(toolString);
          if (stub) {
            proficiencies.add(stub);
          } else {
            const toolGroup = AdvancementHelper.getToolGroup(toolString.trim());

            if (toolGroup) {
              proficiencies.add(`${toolGroup}:*`);
            }
          }
        }
      }

      const chooseRegex = /Choose (\d+)(?:[ :])/i;
      const chooseMatch = tableAdvancements.match(chooseRegex);
      if (isChoice || chooseMatch) {
        if (chooseMatch) parsedTools.number = parseInt(chooseMatch[1]);
        parsedTools.choices = Array.from(proficiencies);
      } else {
        parsedTools.grants = Array.from(proficiencies);
      }

      return parsedTools;
    }

    const textDescription = AdvancementHelper.stripDescription(description);

    // Tools: None
    if (textDescription.includes("Tools: None")) return parsedTools;

    // Tools: Choose one type of artisan’s tools or one musical instrument
    const anyToolsRegex = /^Tools:\sChoose (\w+) type of (.*)($|\.|\w+:)/im;
    const anyMatch = textDescription.match(anyToolsRegex);
    // Tools: Three musical instruments of your choice
    const anyToolsRegex2 = /^Tools:\s(\w+)\s(.*) of your choice($|\.|\w+:)/im;
    const anyMatch2 = textDescription.match(anyToolsRegex2);

    if (anyMatch || anyMatch2) {
      const match = anyMatch ?? anyMatch2;
      // const skills = DICTIONARY.actor.skills.map((skill) => skill.name);
      const numberTools = DICTIONARY.numbers.find((num) => match[1].toLowerCase() === num.natural);
      parsedTools.number = numberTools ? numberTools.num : 2;
      const toolArray = match[2].split(" or ");
      for (const toolString of toolArray) {
        const toolGroup = AdvancementHelper.getToolGroup(toolString);
        if (toolGroup) {
          parsedTools.choices.push(`${toolGroup}:*`);
        } else {
          logger.error(`Could not find tool group for ${toolString}, please log an issue`);
        }
      }
      return parsedTools;
    }

    // Tools: Thieves' tools, tinker's tools, one type of artisan's tools of your choice
    // Tools: Herbalism kit
    // Tool Proficiencies: Disguise Kit, one type of Gaming Set or Musical Instrument
    const toolGrantsRegex = /^(?:Tools|Tool Proficiencies):\s(.*?)($|\.|\w+:)/im;
    const toolGrantsMatch = textDescription.match(toolGrantsRegex);

    const toolChoiceRegex = /(\w+) type of (.*)($|\.|\w+:)/i;
    if (toolGrantsMatch) {
      const grantsArray = toolGrantsMatch[1].split(",").map((grant) => grant.trim());
      for (const toolString of grantsArray) {
        const toolChoiceMatch = toolString.match(toolChoiceRegex);
        if (toolChoiceMatch) {
          const numberTools = DICTIONARY.numbers.find((num) => toolChoiceMatch[1].toLowerCase() === num.natural);
          parsedTools.number = numberTools ? numberTools.num : 1;
          toolChoiceMatch[2].split(" or ").forEach((toolGroupMatch) => {
            const toolGroup = AdvancementHelper.getToolGroup(toolGroupMatch.trim());
            if (toolGroup) {
              parsedTools.choices.push(`${toolGroup}:*`);
            }
          });
        } else {
          const stub = AdvancementHelper.getToolAdvancementValue(toolString);
          if (stub) {
            parsedTools.grants.push(stub);
          }
        }
      }
      return parsedTools;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedTools;


    // You gain proficiency with alchemist’s supplies. If you already have this proficiency, you gain proficiency with one other type of artisan’s tools of your choice.
    // You also gain proficiency with smith’s tools.
    // You gain proficiency with woodcarver’s tools.
    // you gain proficiency with heavy armor and smith’s tools
    // you gain proficiency with one type of artisan’s tools of your choice.
    // You gain proficiency with smith’s tools, and you learn to speak, read, and write Giant.
    // and you gain proficiency with the herbalism kit.
    // You also gain proficiency with brewer’s supplies if you don’t already have it.
    // you gain proficiency with the disguise kit and the poisoner’s kit.
    // you gain proficiency with the disguise kit, the forgery kit, and one gaming set of your choice.
    // you gain proficiency with Tinker’s Tools
    // You gain proficiency with Alchemist’s Supplies and the Herbalism Kit.

    const additionalMatchRegex = /You gain proficiency with (.*?)(?:$|\.|\w+:)/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      const additionalMatches = additionalMatch[1]
        .replace(" and the ", ",")
        .replace(" and ", ",")
        .split(",").map((skill) => skill.trim().replace(/^the /i, ""));
      for (const match of additionalMatches) {
        const toolChoiceRegex = /(\w+) (.*?) of your choice($|\.|\w+:)/i;
        const choiceMatch = match.match(toolChoiceRegex);
        if (choiceMatch) {
          const numberTools = DICTIONARY.numbers.find((num) => choiceMatch[1].toLowerCase() === num.natural);
          parsedTools.number = numberTools ? numberTools.num : 1;
          const toolGroup = AdvancementHelper.getToolGroup(choiceMatch[2]);
          if (toolGroup) {
            parsedTools.choices.push(`${toolGroup}:*`);
          }
        } else {
          const stub = AdvancementHelper.getToolAdvancementValue(match);
          if (stub) {
            parsedTools.grants.push(stub);
          }
        }
      }

      return parsedTools;
    }

    // You gain one skill proficiency of your choice, one tool proficiency of your choice, and fluency in one language of your choice.
    const featMatchRegex = /(\w*) tool proficiency of your choice/i;
    const featMatch = textDescription.match(featMatchRegex);

    if (featMatch) {
      parsedTools.number = 1;
      parsedTools.choices = ["*"];
      return parsedTools;
    }

    return parsedTools;
  }

  static ARMOR_GROUPS = DICTIONARY.actor.proficiencies
    .filter((prof) => prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue") && prof.advancement === "")
    .reduce((acc, prof) => {
      acc[prof.name.toLowerCase()] = prof.foundryValue;
      return acc;
    }, {});

  static getArmorGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.ARMOR_GROUPS)) {
      if (utils.nameString(text).toLowerCase().includes(key)) return value;
    }
    return null;
  }

  static getDictionaryArmor(name) {
    const directMatch = DICTIONARY.actor.proficiencies.find((prof) =>
      prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue")
      && prof.name.toLowerCase() === utils.nameString(name).toLowerCase(),
    );
    if (directMatch) return directMatch;

    const dictionaryProfs = DICTIONARY.actor.proficiencies.filter((prof) =>
      prof.type === "Armor" && foundry.utils.hasProperty(prof, "foundryValue"),
    );
    for (const prof of dictionaryProfs) {
      if (utils.nameString(name).toLowerCase().includes(prof.name.toLowerCase())) return prof;
    }
    return null;
  }

  static getArmorAdvancementValue(text) {
    const match = AdvancementHelper.getDictionaryArmor(text);
    if (match) {
      const stub = match.advancement === ""
        ? match.foundryValue
        : `${match.advancement}:${match.foundryValue}`;
      return stub;
    }
    return null;
  }

  static parseHTMLArmorProficiencies(description) {
    const parsedArmorProficiencies = {
      choices: [],
      grants: [],
      number: 0,
    };

    const tableAdvancements = AdvancementHelper.getTableValue(description, "Armor Training");
    if (tableAdvancements) {
      const names = tableAdvancements.split(":").pop()
        .replaceAll(" and ", ",")
        .replaceAll(" or ", ",")
        .split(",")
        .map((name) => name.trim());

      names.forEach((name) => {
        const stub = AdvancementHelper.getArmorAdvancementValue(name);
        if (stub) {
          parsedArmorProficiencies.grants.push(stub);
        }
      });

      return parsedArmorProficiencies;
    }

    const textDescription = AdvancementHelper.stripDescription(description);

    // Armor: None
    if (textDescription.includes("Armor: None")) return parsedArmorProficiencies;

    // Armor: Light armor, medium armor, shields
    // Armor: Light armor, medium armor, shields
    // Armor: All armor, shields
    const grantsRegex = /^Armor:\s(.*?)($|\.|\w+:)/im;
    const grantsMatch = textDescription.match(grantsRegex);

    if (grantsMatch) {
      const grantsArray = grantsMatch[1].split(",").map((grant) => grant.trim());
      for (const grant of grantsArray) {
        const stub = AdvancementHelper.getArmorAdvancementValue(grant);
        if (stub === "all") {
          parsedArmorProficiencies.grants.push("lgt", "med", "hvy");
        } else if (stub) {
          parsedArmorProficiencies.grants.push(stub);
        }
      }
      return parsedArmorProficiencies;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedArmorProficiencies;

    // You gain proficiency with heavy armor.
    // you gain proficiency with heavy armor and smith’s tools
    // You gain proficiency with light armor, and you gain proficiency with one type of one-handed melee weapon of your choice.

    const additionalMatchRegex = /You gain proficiency with (.*?)($|\.|\w+:)/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      const additionalMatches = additionalMatch[2].replace(" and ", ",").split(",").map((m) => m.trim());
      for (const grant of additionalMatches) {
        const stub = AdvancementHelper.getArmorAdvancementValue(grant);
        if (stub) {
          parsedArmorProficiencies.grants.push(stub);
        }
      }
    }

    return parsedArmorProficiencies;
  }

  static WEAPON_GROUPS = DICTIONARY.actor.proficiencies
    .filter((prof) =>
      prof.type === "Weapon"
      && foundry.utils.getProperty(prof, "foundryValue") !== ""
      && prof.advancement === "",
    )
    .reduce((acc, prof) => {
      acc[prof.name.toLowerCase()] = prof.foundryValue;
      return acc;
    }, {});

  static getWeaponGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.WEAPON_GROUPS)) {
      if (utils.nameString(text).toLowerCase().includes(key)) return value;
    }
    return null;
  }

  static getStrictWeaponGroup(text) {
    for (const [key, value] of Object.entries(AdvancementHelper.WEAPON_GROUPS)) {
      if (utils.nameString(text).toLowerCase() === utils.nameString(key).toLowerCase()) return value;
    }
    return null;
  }

  static getDictionaryWeapon(name) {
    const match = DICTIONARY.actor.proficiencies.find((prof) =>
      prof.type === "Weapon"
      && foundry.utils.getProperty(prof, "foundryValue") !== ""
      && (prof.name.toLowerCase() === utils.nameString(name).toLowerCase()
        || `${prof.name.toLowerCase()}s` === utils.nameString(name).toLowerCase()
        || `the ${prof.name.toLowerCase()}` === utils.nameString(name).toLowerCase()),
    );
    if (match) return match;
    return null;
  }

  static getWeaponAdvancementValue(text) {
    const match = AdvancementHelper.getDictionaryWeapon(text);
    if (match) {
      const stub = match.advancement === ""
        ? match.foundryValue
        : `${match.advancement}:${match.foundryValue}`;
      return stub;
    }
    return null;
  }

  // KNOWN_ISSUE_4_0

  static parseHTMLWeaponMasteryProficiencies(_description: string) {
    const parsedWeaponsProficiencies = {
      // choices: DICTIONARY.actor.proficiencies
      //   .filter((prof) => prof.type === "Weapon" && prof.foundryValue && prof.foundryValue !== "")
      //   .map((prof) => prof.foundryValue),
      choices: ["*"],
      grants: [],
      number: 0,
    };
    return parsedWeaponsProficiencies;
  }


  static parseHTMLWeaponProficiencies(description: string) {
    const parsedWeaponsProficiencies = {
      choices: [],
      grants: [],
      number: 0,
    };

    const tableAdvancements = AdvancementHelper.getTableValue(description, "Weapon Proficiencies");
    if (tableAdvancements) {
      const nameString = tableAdvancements.split(":").pop();
      const names = nameString
        .replaceAll(" and ", ",")
        .replaceAll(" or ", ",")
        .split(",")
        .map((name) => name.trim());

      const proficiencies = new Set();

      for (const name of names) {
        const weaponGroup = AdvancementHelper.getStrictWeaponGroup(name);
        if (weaponGroup) {
          proficiencies.add(`${weaponGroup}`);
        } else if (nameString.toLowerCase().includes("martial weapons that have the")) {
          const propertyRegex = /martial weapons that have the (.*) property/i;
          const propertyMatch = nameString.match(propertyRegex);
          if (!propertyMatch) continue;

          const properties = propertyMatch[1]
            .replace(" and ", ",")
            .replace(" or ", ",")
            .split(",")
            .map((prop) => prop.trim())
            .map((prop) => {
              const dictProp = DICTIONARY.weapon.properties
                .find((p) => p.name.toLowerCase() === prop.toLowerCase());
              return dictProp ? dictProp.value : null;
            })
            .filter((prop) => prop !== null);

          const weapons = DICTIONARY.actor.proficiencies.filter((prof) => {
            const basic = prof.type === "Weapon"
              && prof.subType === "Martial Weapon"
              && foundry.utils.getProperty(prof, "foundryValue") !== "";
            if (!basic) return false;
            for (const prop of properties) {
              if (foundry.utils.getProperty(prof, `properties.${prop}`)) return true;
            }
            return false;
          }).map((prof) => {
            const stub = prof.advancement === ""
              ? prof.foundryValue
              : `${prof.advancement}:${prof.foundryValue}`;
            return stub;
          });
          for (const weapon of weapons) {
            proficiencies.add(weapon);
          }
        } else {
          logger.warn(`unknown weapon group choices ${name}`);
        }
      }

      const chooseRegex = /Choose (\d+)(?:[ :])/i;
      const chooseMatch = tableAdvancements.match(chooseRegex);

      if (chooseMatch) {
        parsedWeaponsProficiencies.number = parseInt(chooseMatch[1]);
        parsedWeaponsProficiencies.choices = Array.from(proficiencies);
      } else {
        parsedWeaponsProficiencies.grants = Array.from(proficiencies);
      }
      return parsedWeaponsProficiencies;
    }


    const textDescription = AdvancementHelper.stripDescription(description);

    // Weapons: None
    if (textDescription.includes("Weapons: None")) return parsedWeaponsProficiencies;

    // Weapons: Simple weapons, martial weapons
    // Weapons: Simple weapons
    // Weapons: Simple weapons, hand crossbows, longswords, rapiers, shortswords
    const weaponGrantsRegex = /^Weapons:\s(.*?)($|\.|\w+:)/im;
    const weaponGrantsMatch = textDescription.match(weaponGrantsRegex);

    const weaponChoiceRegex = /(\w+) type of (.*)($|\.|\w+:)/i;
    if (weaponGrantsMatch) {
      const grantsArray = weaponGrantsMatch[1].split(",").map((grant) => grant.trim());
      for (const weaponString of grantsArray) {
        const weaponChoiceMatch = weaponString.match(weaponChoiceRegex);
        if (weaponChoiceMatch) {
          const number = DICTIONARY.numbers.find((num) => weaponChoiceMatch[1].toLowerCase() === num.natural);
          parsedWeaponsProficiencies.number = number ? number.num : 1;
          const group = AdvancementHelper.getWeaponGroup(weaponChoiceMatch[2]);
          if (group) {
            parsedWeaponsProficiencies.choices.push(`${group}:*`);
          }
        } else {
          const stub = AdvancementHelper.getWeaponAdvancementValue(weaponString);
          if (stub) {
            parsedWeaponsProficiencies.grants.push(stub);
          }
        }
      }
      return parsedWeaponsProficiencies;
    }

    const bladeSingerRegex = /You gain proficiency with all Melee Martial weapons that don’t have the Two-Handed or Heavy property./i;
    if (bladeSingerRegex.test(textDescription)) {
      const weapons = DICTIONARY.actor.proficiencies.filter((prof) =>
        prof.type === "Weapon"
        && foundry.utils.getProperty(prof, "foundryValue") !== ""
        && foundry.utils.getProperty(prof, "subType") === "Martial Weapon"
        && foundry.utils.getProperty(prof, "melee") === true
        && foundry.utils.getProperty(prof, "properties.two") !== true
        && foundry.utils.getProperty(prof, "properties.hvy") !== true,
      ).map((prof) => {
        const stub = prof.advancement === ""
          ? prof.foundryValue
          : `${prof.advancement}:${prof.foundryValue}`;
        return stub;
      });
      parsedWeaponsProficiencies.grants.push(...weapons);
      return parsedWeaponsProficiencies;
    }

    // no more matches, return.
    if (!textDescription.includes("proficiency")) return parsedWeaponsProficiencies;

    // you gain proficiency with medium armor and the scimitar.
    // You gain proficiency with martial weapons.
    // At 1st level, you gain proficiency with martial weapons and heavy armor.
    // You gain proficiency with light armor, and you gain proficiency with one type of one-handed melee weapon of your choice.
    // You gain proficiency with four weapons of your choice. Each one must be a simple or a martial weapon.
    const additionalMatchRegex = /You gain proficiency with (.*?)($|\.|\w+:)/im;
    const additionalMatch = textDescription.match(additionalMatchRegex);

    if (additionalMatch) {
      const additionalMatches = additionalMatch[2].replace(" and ", ",").split(",").map((skill) => skill.trim());
      for (const match of additionalMatches) {
        const weaponChoiceRegex = /(\w+) (.*?) of your choice($|\.|\w+:)/i;
        const choiceMatch = textDescription.match(weaponChoiceRegex);
        if (choiceMatch) {
          const numberWeapons = DICTIONARY.numbers.find((num) => choiceMatch[1].toLowerCase() === num.natural);
          parsedWeaponsProficiencies.number = numberWeapons ? numberWeapons.num : 1;
          const weaponGroup = AdvancementHelper.getWeaponGroup(choiceMatch[2]);
          if (weaponGroup) {
            parsedWeaponsProficiencies.choices.push(`${weaponGroup}:*`);

          } else if (choiceMatch[2].toLowerCase().includes("one-handed melee weapon")) {
            const weapons = DICTIONARY.actor.proficiencies.filter((prof) =>
              prof.type === "Weapon"
              && foundry.utils.getProperty(prof, "foundryValue") !== ""
              && foundry.utils.getProperty(prof, "properties.two") !== true
              && foundry.utils.getProperty(prof, "melee") === true,
            ).map((prof) => {
              const stub = prof.advancement === ""
                ? prof.foundryValue
                : `${prof.advancement}:${prof.foundryValue}`;
              return stub;
            });
            parsedWeaponsProficiencies.choices.push(...weapons);
          } else {
            logger.warn(`unknown weapon group choices ${choiceMatch[2]}`);
          }
        } else {
          const stub = AdvancementHelper.getWeaponAdvancementValue(match);
          if (stub) {
            parsedWeaponsProficiencies.grants.push(stub);
          }
        }
      }

      return parsedWeaponsProficiencies;
    }

    // Choose two types of weapons to be your kensei weapons: one melee weapon and one ranged weapon.
    const kenseiRegex = /Choose two types of weapons to be your kensei weapons/im;
    if (kenseiRegex.test(textDescription)) {
      parsedWeaponsProficiencies.number = 2;
      const weapons = DICTIONARY.actor.proficiencies.filter((prof) =>
        prof.type === "Weapon"
        && foundry.utils.getProperty(prof, "foundryValue") !== ""
        && foundry.utils.getProperty(prof, "properties.spc") !== true
        && (foundry.utils.getProperty(prof, "properties.hvy") !== true || prof.name === "Longbow"),
      ).map((prof) => {
        const stub = prof.advancement === ""
          ? prof.foundryValue
          : `${prof.advancement}:${prof.foundryValue}`;
        return stub;
      });
      parsedWeaponsProficiencies.choices.push(...weapons);
    }

    return parsedWeaponsProficiencies;
  }

  // static parseHTMLExpertises(description) {
  //   const parsedExpertises = {
  //     choices: [],
  //     grants: [],
  //     number: 2,
  //   };

  //   const dom = utils.htmlToDocumentFragment(description);

  //   // At 1st level, choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves’ tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.
  //   // At 6th level, you can choose two more of your proficiencies (in skills or with thieves’ tools) to gain this benefit.
  //   // At 3rd level, choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.
  //   // At 6th level, choose two more of your skill proficiencies, or one more of your skill proficiencies and your proficiency with thieves’ tools. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.
  // // Choose one skill in which you have proficiency. You gain expertise with that skill,
  // Your proficiency bonus is doubled for any check you make with the chosen skills.

  // parse expertises

  //   return parsedExpertises;
  // }


  static parseHTMLSpellCastingAbilities(description) {
    const result = {
      hint: "",
      abilities: [],
      properties: [],
      concentration: true,
    };

    const properties = new Set();

    // Wisdom is your spellcasting ability for these spells.
    // Intelligence, Wisdom, or Charisma is your spellcasting ability for it
    // Intelligence, Wisdom, or Charisma is your spellcasting ability for the spells you cast with this trait
    // Intelligence, Wisdom, or Charisma is your spellcasting ability for these spells when you cast them with this trait
    // Constitution is your spellcasting ability for this spell.
    const abilityRegex = /(Intelligence, Wisdom, or Charisma|Intelligence|Wisdom|Charisma|Constitution) is your spellcasting ability for/i;
    const abilityMatches = abilityRegex.exec(description);
    if (abilityMatches) {
      if (abilityMatches[1].includes("Intelligence, Wisdom, or Charisma")) {
        result.hint = "You can choose Intelligence, Wisdom, or Charisma as your spellcasting ability for these spells.";
      }
      result.abilities = abilityMatches[1].replace(" or ", ",").replaceAll(",,", ",").split(",").map((ability) =>
        ability.trim().toLowerCase().substring(0, 3),
      );
    } else {
      // the spell uses the same spellcasting ability
      const otherTraitRegex = /When you cast it with this trait, the spell uses the same spellcasting ability.|The spell’s spellcasting ability is the ability increased by this feat./i;
      const otherTraitMatch = description.match(otherTraitRegex);
      if (otherTraitMatch) {
        result.hint = otherTraitMatch[0];
        result.abilities = ["int", "wis", "cha"];
      }
    }

    const noComponentsRegex = /None of these spells require spell components|no component|no spell components/i;
    if (noComponentsRegex.test(description)) {
      properties.add("material");
      properties.add("vocal");
      properties.add("somatic");
    }

    const noMaterialSearch = new RegExp(/no material component|without requiring material component/);
    const noMaterialMatch = noMaterialSearch.test(this.strippedHtml);
    if (noMaterialMatch) {
      properties.add("material");
    }

    const noConcentrationSearch = new RegExp(/no concentration|no material components or concentration|no spell components or concentration/);
    const noConcentrationMatch = noConcentrationSearch.test(this.strippedHtml);
    if (noConcentrationMatch) {
      result.concentration = false;
      properties.add("concentration");
    }

    result.properties = Array.from(properties);

    return result;
  }


  // words that never appear in a spell name, so a capture holding one is prose that ran past the name
  static #NOT_A_SPELL_NAME = /\b(?:you|your|yourself|with this|trait|feature|feat|level|times|rest|slot|slots|spell list|choice|school|other|which|when|while|until|if|using|without(?! trace)|each|these|this|them|it|that|those|either|both|one of|associated|following|once|again|any|additional|more|new|prepared|rituals?|whether|except|bard|cleric|druid|paladin|ranger|sorcerer|warlock|wizard|artificer)\b|\d|^(?:to|in|but|and|or|of|for|as|on|at|by|from|with|what)\b|^(?:the|a|an|spells?|cantrips?)$/i;

  /** Text the spell parsers read: reference links, DDB [spell] tags and non-breaking spaces removed. */
  static spellParseText(description: string): string {
    return AdvancementHelper.stripDescription(description)
      .replace(/\[\/?spells?\]/gi, "")
      .replace(/&nbsp;|\u00a0/g, " ")
      .replaceAll("*", "")
      .replace(/[ \t]+/g, " ");
  }

  static #sentences(text: string): string[] {
    // no spell name contains a full stop, so sentence boundaries bound every spell capture
    return text
      .split(/(?<=[.!?;])\s+|\n+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence !== "");
  }

  /** Character level a sentence gates its spells behind ("Starting at 3rd level", "When you reach character level 5"). */
  static #sentenceLevel(sentence: string): number | null {
    const match = sentence.match(/\b(?:(?:starting at|when you reach|beginning at|once you reach) (?:character )?(?:level (\d+)|(\d+)(?:st|nd|rd|th) level)|at character level (\d+))\b/i);
    if (!match) return null;
    return parseInt(match[1] ?? match[2] ?? match[3]);
  }

  /** Uses a sentence gives its spells, or null when it says nothing about how often they can be cast. */
  static #sentenceAmount(sentence: string): string | null {
    if ((/an unlimited number of times|\bat will\b/i).test(sentence)) return "";
    if ((/a number of times equal to half your proficiency bonus/i).test(sentence)) return "floor(@prof / 2)";
    if ((/a number of times equal to your proficiency bonus/i).test(sentence)) return "@prof";
    const modifier = sentence.match(/a number of times equal to your (strength|dexterity|constitution|intelligence|wisdom|charisma) modifier/i);
    if (modifier) {
      const ability = DICTIONARY.actor.abilities.find((a) => a.long === modifier[1].toLowerCase());
      if (ability) return `max(1, @abilities.${ability.value}.mod)`;
    }
    if (AdvancementHelper.#statesCastLimit(sentence)) return "1";
    return null;
  }

  /**
   * True when text limits a cast to once or to once per rest. "(minimum of once)" is a floor on an ability
   * modifier count and "once per turn" a rate, so neither counts; "must finish a long rest before you can
   * cast" and "until you finish a Short or Long Rest" both do.
   */
  static #statesCastLimit(text: string): boolean {
    const cleaned = text
      .replace(/\(minimum of once\)/gi, "")
      .replace(/\bonce (?:per turn|on each of your turns|during each of your turns)\b/gi, "");
    return (/\bonce\b|finish a (?:long|short)(?: or long)? rest/i).test(cleaned);
  }

  /** "sr" when a sentence restores its casts on a short (or long) rest; a long rest is the default. */
  static #sentencePeriod(sentence: string): "sr" | null {
    return (/short or long rest|finish a short rest/i).test(sentence) ? "sr" : null;
  }

  static #cleanSpellName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, "")
      .replace(/^(?:either |both )?(?:the |a |an )?(?:spells? )?/, "")
      .replace(/\s+(?:spells?|cantrips?)$/, "")
      .replace(/[.,;:]+$/, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Splits "detect magic and disguise self" or "animal friendship, animal messenger, and speak with
   * animals" into spell names, keeping names such as purify food and drink whole.
   */
  static splitSpellNames(text: string): string[] {
    let working = text.toLowerCase();
    const kept: string[] = [];
    for (const name of DICTIONARY.parsing.spellNamesWithConjunctions) {
      if (!working.includes(name)) continue;
      working = working.replaceAll(name, `@@${kept.length}@@`);
      kept.push(name);
    }
    return working
      .split(/\s*,\s*(?:and\s+|or\s+)?|\s+(?:and|or)\s+/)
      .map((part) => part.replace(/@@(\d+)@@/g, (_match, index) => kept[parseInt(index)]))
      .map((part) => AdvancementHelper.#cleanSpellName(part))
      .filter((part) => part !== "");
  }

  /** False for captures that are prose rather than a spell name (a sentence that ran on, a pronoun). */
  static isPlausibleSpellName(name: string): boolean {
    const cleaned = name.trim();
    if (cleaned === "") return false;
    if (cleaned.split(/\s+/).length > 6) return false;
    return !AdvancementHelper.#NOT_A_SPELL_NAME.test(cleaned);
  }

  /**
   * Spells a description grants by casting: "you can cast the jump spell with this trait",
   * "Starting at 5th level, you can also cast misty step with it", "you can cast each of these spells
   * once". Each sentence is read on its own, so one grant cannot swallow the next. Sentences that only
   * refer back to spells already named ("Once you cast jump or misty step with this trait…", "You can
   * cast each of these spells once…") set the uses of those spells instead of adding grants.
   * A free cast the text never limits is unlimited (`amount` ""), unless `defaultAmount` says otherwise.
   */
  static parseSpellCastGrants(text: string, { defaultAmount = "" }: { defaultAmount?: string | null } = {}): ISpellAdvancementGrant[] {
    const grants: ISpellAdvancementGrant[] = [];
    // names from "cast X" that no sentence has yet marked as a free or innate cast
    const unconfirmed = new Set<string>();
    // names whose own sentence gives a free cast and says nothing more; a limit elsewhere in the text
    // belongs to another benefit (Hidden in Plain Sight's Vanish), so it must not reach them
    const selfContained = new Set<string>();
    // "pass without trace" is the one spell name holding a terminator word
    const castRegex = /\byou (?:also )?(?:can|gain the ability to|have the ability to|learn to) (?:also )?cast (?:the spells? |spells? )?(.+?)(?= spells?\b| cantrips?\b| once\b| an unlimited number| on (?:yourself|itself|a|an|one|any)\b| as an? \d| as a bonus| as (?:a )?rituals?\b| but\b| with this (?:trait|feat|feature)| with it\b| with a spell slot\b| by spending\b| using\b| without\b(?! trace)| a number of times| at will|;|\.|$)/gi;
    const learnRegex = /\byou (?:also )?learn the ([^.,;]+?) spells?\b/gi;
    // "you can cast X" alone is often a reminder of normal casting (Divine Smite "without using a bonus
    // action"); only a free, limited, innate or sorcery point cast is a grant
    const freeCastRegex = /without (?:expending |using )?a spell slot|\bonce\b|a number of times|an unlimited number of times|\bat will\b|(?:until|when) you finish a (?:long|short)(?: or long)? rest|with this trait|\bwith it\b|by spending \d+ sorcery points?/i;

    for (const sentence of AdvancementHelper.#sentences(text)) {
      const level = AdvancementHelper.#sentenceLevel(sentence) ?? 1;
      const amount = AdvancementHelper.#sentenceAmount(sentence);
      const period = amount ? AdvancementHelper.#sentencePeriod(sentence) : null;
      // "you can cast it by spending 2 sorcery points or by expending a spell slot" (Eyes of the Dark)
      const sorceryPoints = sentence.match(/\bby spending (\d+) sorcery points?\b/i);
      const applySentence = (grant: ISpellAdvancementGrant) => {
        if (amount !== null) {
          grant.amount = amount;
          if (period) grant.period = period;
          selfContained.delete(grant.name);
        }
        if (sorceryPoints) grant.sorceryPoints = parseInt(sorceryPoints[1]);
      };
      // "You expend a spell slot as normal, and you can cast this spell in this way only once per turn"
      const freeCast = freeCastRegex.test(sentence) && !(/spell slot as normal/i).test(sentence);
      const captures = [
        ...[...sentence.matchAll(castRegex)].map((match) => ({ capture: match[1], learned: false })),
        // "levels 3 and 5, you learn the X spell and the Y spell" is read by the level pair parser
        ...[...((/levels?\s+\d+\s+and\s+\d+/i).test(sentence) ? [] : sentence.matchAll(learnRegex))]
          .map((match) => ({ capture: match[1], learned: true }))
          .filter(({ capture }) => !(/cantrip/i).test(capture)),
      ];
      for (const { capture, learned } of captures) {
        // "hex, and you regain the ability…": keep the listed names up to the first piece of prose
        const names: string[] = [];
        for (const name of AdvancementHelper.splitSpellNames(capture)) {
          if (!AdvancementHelper.isPlausibleSpellName(name)) break;
          names.push(name);
        }
        if (names.length === 0) {
          // a pronoun such as "each of these" or "it": the sentence sets the uses of what came before
          const targets = AdvancementHelper.#backReferenceTargets(capture, grants);
          for (const grant of targets) {
            applySentence(grant);
            if (freeCast) unconfirmed.delete(grant.name);
          }
          continue;
        }
        // "You learn the sacred flame spell, which doesn't count against the number of cantrips you know"
        const learnedCantrip = learned && (/cantrip/i).test(sentence);
        for (const name of names) {
          if (grants.some((grant) => grant.name === name)) continue;
          const grant: ISpellAdvancementGrant = { level, name, amount: learnedCantrip ? "" : undefined };
          applySentence(grant);
          grants.push(grant);
          if (!learned && !freeCast) unconfirmed.add(name);
          // "with this trait" is an innate cast whose limit usually follows; only "without a spell slot" stands alone
          if (amount === null && (/without (?:expending |using )?a spell slot/i).test(sentence)) selfContained.add(name);
        }
      }

      // "Free Casting. You can cast Magic Missile without a spell slot. You can do so a number of times equal
      // to your Intelligence modifier", "If you do so, you can't do so again until you finish a Short or Long Rest"
      const latest = grants.at(-1);
      if (captures.length === 0 && latest && (/\b(?:you can|if you) do so\b/i).test(sentence)) {
        applySentence(latest);
      }
      if (latest && (/regain one expended use when you finish a short rest/i).test(sentence)) {
        latest.shortRestRecovery = "1";
      }

      // Once you cast jump or misty step with this trait, you can't cast that spell with it again until you finish a long rest.
      const onceMatch = sentence.match(/\bonce you (?:have )?cast (.+?)(?= with\b| using\b| in this way| this way|,|\.|$)/i);
      if (onceMatch) {
        const names = AdvancementHelper.splitSpellNames(onceMatch[1]).filter((name) => AdvancementHelper.isPlausibleSpellName(name));
        const targets = names.length > 0
          ? grants.filter((grant) => names.includes(grant.name))
          : AdvancementHelper.#backReferenceTargets(onceMatch[1], grants);
        const oncePeriod = AdvancementHelper.#sentencePeriod(sentence);
        for (const grant of targets) {
          grant.amount = "1";
          if (oncePeriod) grant.period = oncePeriod;
          unconfirmed.delete(grant.name);
          selfContained.delete(grant.name);
        }
      }
    }

    const confirmed = grants.filter((grant) => !unconfirmed.has(grant.name));
    // a description that limits its casts anywhere applies that limit to grants that did not say
    const limitSentence = AdvancementHelper.#sentences(text).find((sentence) => AdvancementHelper.#statesCastLimit(sentence));
    const limitPeriod = limitSentence ? AdvancementHelper.#sentencePeriod(limitSentence) : null;
    // "You can't use this feature again until…" (The Third Eye), "to use your Invoke Hell again", "Once you use
    // this benefit, you can't use it again", "You can use this feature a number of times equal to your Strength
    // modifier" (Dimensional Duel): the cast is what the feature does, so it spends the feature's uses
    const featureUseRegex = /\b(?:once|after) you use this (?:feature|benefit)\b|\buse (?:this (?:feature|benefit)|your [a-z' ]+?) again\b|\buse this (?:feature|benefit) a number of times\b/i;
    const featureSentence = AdvancementHelper.#sentences(text)
      .find((sentence) => featureUseRegex.test(sentence) && AdvancementHelper.#sentenceAmount(sentence));
    const featureAmount = featureSentence ? AdvancementHelper.#sentenceAmount(featureSentence) : null;
    const featurePeriod = featureSentence ? AdvancementHelper.#sentencePeriod(featureSentence) : null;
    for (const grant of confirmed) {
      // a spell paid for with sorcery points has no free casts to count
      if (grant.sorceryPoints !== undefined) {
        grant.amount = "";
        delete grant.period;
        continue;
      }
      if (grant.amount !== undefined) continue;
      if (featureAmount && selfContained.has(grant.name)) {
        grant.amount = featureAmount;
        grant.featureUses = true;
        if (featurePeriod) grant.period = featurePeriod;
      } else if (limitSentence && !selfContained.has(grant.name)) {
        grant.amount = "1";
        if (limitPeriod) grant.period = limitPeriod;
      } else if (defaultAmount !== null) {
        grant.amount = defaultAmount;
      } else {
        delete grant.amount;
      }
    }
    return confirmed;
  }

  /** "1" when the text gives a free cast that comes back on a rest (Fey Touched), otherwise no uses. */
  static #freeCastAmount(text: string): string {
    return (/without (?:expending |using )?a spell slot/i).test(text) && (/\bonce\b|finish a (?:long|short) rest/i).test(text)
      ? "1"
      : "";
  }

  /**
   * Chosen spells restricted to schools or to a spell list named earlier in the text:
   * "one 1st-level spell of your choice. The 1st-level spell must be from the divination or enchantment
   * school of magic", "Choose one level 1 spell from the Illusion or Necromancy school of magic",
   * "you learn one 1st-level spell of your choice from that list".
   */
  static #restrictedSpellChoices(text: string): ISpellAdvancementChoice[] {
    const choices: ISpellAdvancementChoice[] = [];
    const amount = AdvancementHelper.#freeCastAmount(text);
    const schoolRegexes = [
      /one (\d)(?:st|nd|rd|th)-level spell of your choice\. The \d(?:st|nd|rd|th)-level spell must be from the (\w+)(?: or (\w+))? school of magic/gi,
      /choose one level (\d) spell from the (\w+)(?: or (\w+))? school of magic/gi,
    ];
    for (const regex of schoolRegexes) {
      for (const match of text.matchAll(regex)) {
        const schools = [match[2], match[3]]
          .filter((name): name is string => name !== undefined)
          .map((name) => DICTIONARY.spell.schools.find((school) => school.name === name.toLowerCase())?.id)
          .filter((id): id is string => id !== undefined);
        if (schools.length === 0) continue;
        choices.push({ level: parseInt(match[1]), spellList: "", amount, schools });
      }
    }

    // You learn one cantrip of your choice from the artificer spell list, and you learn one 1st-level spell of your choice from that list.
    const listMatch = text.match(/from the (\w+) spell list/i);
    const fromThatList = text.match(/one (\d)(?:st|nd|rd|th)-level spell of your choice from that list/i);
    if (listMatch && fromThatList) {
      choices.push({ level: parseInt(fromThatList[1]), spellList: listMatch[1].toLowerCase(), amount });
    }
    return choices;
  }

  /**
   * "You always have the Disguise Self and Hex spells prepared. You can cast each spell once without a
   * spell slot": always prepared spells with one free cast.
   */
  static #alwaysPreparedGrants(text: string): ISpellAdvancementGrant[] {
    // You always have the Otto’s Irresistible Dance spell prepared. You can cast it once without a spell slot,
    const alwaysPreparedRegex = /(?:When you reach (\d)(?:st|nd|rd|th) level, )?You always have the ([^.]+?) spell(?:s)? prepared\. (?:You can cast (?:it|each spell) (.+?) without a spell slot|cast (.+?) without expending a spell slot|You can cast the spell (.+?) without a spell slot,)/i;
    const match = text.match(alwaysPreparedRegex);
    if (match) {
      const level = match[1] ? parseInt(match[1]) : 1;
      return AdvancementHelper.splitSpellNames(match[2] ?? match[3])
        .filter((name) => AdvancementHelper.isPlausibleSpellName(name))
        .map((name) => ({ level, name, amount: "1" }));
    }

    // Choose one level 1 spell from the Illusion or Necromancy school of magic. You always have that spell and the Invisibility spell prepared.
    const withChoiceMatch = text.match(/You always have that spell and the ([^.]+?) spells? prepared\./i);
    if (!withChoiceMatch) return [];
    const amount = AdvancementHelper.#freeCastAmount(text);
    return AdvancementHelper.splitSpellNames(withChoiceMatch[1])
      .filter((name) => AdvancementHelper.isPlausibleSpellName(name))
      .map((name) => ({ level: 1, name, amount }));
  }

  /** "When you reach character levels 3 and 5, you learn the Ice Knife spell and the Flame Blade spell, respectively." */
  static #levelPairGrants(text: string): ISpellAdvancementGrant[] {
    const grants: ISpellAdvancementGrant[] = [];
    const levelPairRegex = /levels?\s+(\d+)\s+and\s+(\d+)[^.]*?the\s+([^.]+?)\s+spell\s+and\s+the\s+([^.]+?)\s+spell/gi;
    for (const match of text.matchAll(levelPairRegex)) {
      for (const [level, name] of [[match[1], match[3]], [match[2], match[4]]]) {
        const spell = AdvancementHelper.#cleanSpellName(name);
        if (!AdvancementHelper.isPlausibleSpellName(spell) || grants.some((grant) => grant.name === spell)) continue;
        grants.push({ level: parseInt(level), name: spell, amount: "1" });
      }
    }
    return grants;
  }

  /** The grants a pronoun refers to: "it" or "that spell" is the latest one, "these" or "either" all of them. */
  static #backReferenceTargets(reference: string, grants: ISpellAdvancementGrant[]): ISpellAdvancementGrant[] {
    if (grants.length === 0) return [];
    const singular = (/^(?:it|this|that|the)(?: spell)?$/i).test(reference.trim());
    return singular ? [grants[grants.length - 1]] : grants;
  }

  /** Drops parsed names that are prose rather than spells, warning so a missed spell is visible. */
  static #dropImplausibleSpellNames(result: IParsedSpellAdvancementData, description: string) {
    const keep = (name: string) => {
      if (AdvancementHelper.isPlausibleSpellName(name)) return true;
      logger.warn(`Ignoring "${name}" parsed as a spell name`, { description });
      return false;
    };
    const clean = (name: string) => AdvancementHelper.#cleanSpellName(name);
    result.cantripGrants = result.cantripGrants.map(clean).filter(keep);
    result.cantripChoices = result.cantripChoices.map(clean).filter(keep);
    result.spellGrants = result.spellGrants
      .map((grant) => ({ ...grant, name: clean(grant.name) }))
      .filter((grant) => keep(grant.name));
  }


  static parseHTMLSpellAdvancementDataForTraits(description: string) {
    const result: IParsedSpellAdvancementData = {
      spellListCantripChoice: null,
      spellListCantripChoiceNum: null,
      spellListChoiceReplace: false,
      cantripChoices: [],
      cantripGrants: [],
      spellGrants: [],
      spellChoices: [],
      hint: "",
    };
    const spellsAdded = new Set();
    const strippedDescription = AdvancementHelper.spellParseText(description);

    // You also know the Poison Spray cantrip.
    // You know the shocking grasp cantrip.
    // You know the druidcraft cantrip.
    // You know the mage hand cantrip, and the hand is invisible when you cast the cantrip with this trait.
    // You learn the mend plants* and shillelagh cantrips.
    // You learn the spare the dying cantrip and can cast it as a bonus action.
    // You learn the guidance cantrip, which doesn’t
    const cantripGrantKnowRegex = /You (?:also )?(?:learn|know) the ([\w /]+) cantrip/ig;
    const cantripKnowGrants = strippedDescription.matchAll(cantripGrantKnowRegex);
    for (const match of cantripKnowGrants) {
      const cantrips = match[1]
        .replace(" and ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const cantrip of cantrips) {
        if (["it"].includes(cantrip)) continue;
        if (spellsAdded.has(cantrip)) continue;
        result.cantripGrants.push(cantrip);
        spellsAdded.add(cantrip);
      }
    }

    // You know one cantrip of your choice from the Sorcerer spell list.
    // you gain two cantrips of your choice from the wizard spell list
    const spellListRegex = /You (?:know|learn|gain) (\w+) cantrip(?:s)? of your choice from the (\w+) spell list/i;
    const spellListMatch = strippedDescription.match(spellListRegex);

    if (spellListMatch) {
      result.hint = `${spellListMatch[0]}.`;
      result.spellListCantripChoice = spellListMatch[2].toLowerCase();
      const numberMatch = DICTIONARY.numbers.find((num) => spellListMatch[1].toLowerCase() === num.natural);
      result.spellListCantripChoiceNum = numberMatch ? numberMatch.num : 1;
    }

    // You know one of the following cantrips of your choice: dancing lights, light, or sacred flame.
    // Homebrew traits sometimes use a semicolon or other punctuation after "choice".
    if (strippedDescription.includes("one of the following cantrips of your choice")) {
      const choices = strippedDescription.split(/one of the following cantrips of your choice[:;]?/)
        .slice(1)[0]
        .split(".")[0]
        .replace(" or ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const choice of choices) {
        if (spellsAdded.has(choice)) continue;
        result.cantripChoices.push(choice);
        spellsAdded.add(choice);
      }
    }

    // learn a cantrip of your choice: either druidcraft or thaumaturgy.
    if (strippedDescription.includes("learn a cantrip of your choice")) {
      const choices = strippedDescription.split("learn a cantrip of your choice")[1]
        .split(".")[0]
        .replace(":", "")
        .replace(" either ", "")
        .replace(" or ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const choice of choices) {
        if (spellsAdded.has(choice)) continue;
        result.cantripChoices.push(choice);
        spellsAdded.add(choice);
      }
    }

    // You can cast either the barkskin or spike growth spell once, and you must complete a long rest before you can cast either spell again
    // You gain the ability to cast the spell cure wounds without using a spell slot, up to a number of times equal to half your proficiency bonus
    // You also have the ability to cast Faerie Fire once per long rest. (homebrew)
    // Starting at 3rd level, you can cast the jump spell with this trait. Starting at 5th level, you can also cast the misty step spell with it.
    // You learn the misty step spell and one level 1 spell of your choice.
    // When you reach character levels 3 and 5, you learn the Ice Knife spell and the Flame Blade spell, respectively.
    const spellCastGrants = [
      ...AdvancementHelper.#levelPairGrants(strippedDescription),
      ...AdvancementHelper.parseSpellCastGrants(strippedDescription),
    ];
    for (const grant of spellCastGrants) {
      if (spellsAdded.has(grant.name)) continue;
      spellsAdded.add(grant.name);
      result.spellGrants.push(grant);
    }

    // from the Sorcerer spell list. Also, choose a level 1 spell from that spell list. You always have that spell prepared. You can cast it once without a spell slot,
    const spellListSpellRegex = /from the (\w+) spell list.*?choose a level (\d+) spell from that spell list/i;
    const spellListSpellMatch = strippedDescription.match(spellListSpellRegex);
    if (spellListSpellMatch) {
      const level = parseInt(spellListSpellMatch[2]);
      result.spellChoices.push({
        level: level,
        spellList: spellListSpellMatch[1].toLowerCase(),
        amount: "1",
      });
    }

    for (const grant of AdvancementHelper.#alwaysPreparedGrants(strippedDescription)) {
      if (spellsAdded.has(grant.name)) continue;
      spellsAdded.add(grant.name);
      result.spellGrants.push(grant);
    }

    const chooseSpellListRegex2 = /Choose a level (\d) spell from the (\w+) spell list. You always have that spell prepared. You can cast it once without a spell slo/i;
    const chooseSpellListMatch2 = strippedDescription.match(chooseSpellListRegex2);
    if (chooseSpellListMatch2) {
      result.spellChoices.push({
        level: parseInt(chooseSpellListMatch2[1]),
        spellList: chooseSpellListMatch2[2].toLowerCase(),
        amount: "1",
      });
    }

    result.spellChoices.push(...AdvancementHelper.#restrictedSpellChoices(strippedDescription));

    const spellListChoiceReplace = /you can replace one of the spells you chose with this feature/i;
    if (spellListChoiceReplace.test(strippedDescription)) {
      result.spellListChoiceReplace = true;
    }

    AdvancementHelper.#dropImplausibleSpellNames(result, description);
    return result;
  }

  static parseHTMLSpellAdvancementData(description: string): IParsedSpellAdvancementData {
    const result: IParsedSpellAdvancementData = {
      spellListCantripChoice: null,
      cantripChoices: [],
      cantripGrants: [],
      spellGrants: [],
      spellChoices: [],
      hint: "",
    };
    const spellsAdded = new Set();
    const strippedDescription = AdvancementHelper.spellParseText(description);

    const spellListRegex = /You know one cantrip of your choice from the (\w+) spell list/i;
    const spellListMatch = strippedDescription.match(spellListRegex);

    if (spellListMatch) {
      result.hint = `You know one cantrip of your choice from the ${spellListMatch[1]} spell list.`;
      result.spellListCantripChoice = spellListMatch[1].toLowerCase();
    }

    // You know one of the following cantrips of your choice: dancing lights, light, or sacred flame.
    // Homebrew traits sometimes use a semicolon or other punctuation after "choice".
    if (strippedDescription.includes("one of the following cantrips of your choice")) {
      const choices = strippedDescription.split(/one of the following cantrips of your choice[:;]?/)
        .slice(1)[0]
        .split(".")[0]
        .replace(" or ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const choice of choices) {
        if (spellsAdded.has(choice)) continue;
        result.cantripChoices.push(choice);
        spellsAdded.add(choice);
      }
    }

    // You also know the Poison Spray cantrip.
    // You know the shocking grasp cantrip.
    // You know the druidcraft cantrip.
    // You know the mage hand cantrip, and the hand is invisible when you cast the cantrip with this trait.
    const cantripGrantRegex = /You (?:also )?(?:learn|know) the ([\w /]+) cantrip/ig;
    const cantripGrants = strippedDescription.matchAll(cantripGrantRegex);
    for (const match of cantripGrants) {
      const cantrips = match[1]
        .replace(" and ", ",")
        .replaceAll(",,", ",")
        .split(",")
        .map((cantrip) => cantrip.toLowerCase().trim());
      for (const cantrip of cantrips) {
        if (spellsAdded.has(cantrip)) continue;
        result.cantripGrants.push(cantrip);
        spellsAdded.add(cantrip);
      }
    }

    // When you reach character levels 3 and 5, you learn the Ice Knife spell and the Flame Blade spell, respectively.
    for (const grant of AdvancementHelper.#levelPairGrants(strippedDescription)) {
      if (spellsAdded.has(grant.name)) continue;
      spellsAdded.add(grant.name);
      result.spellGrants.push(grant);
    }

    // Starting at 3rd level, you can cast the feather fall spell with this trait, without requiring a material component. Starting at 5th level, you can also cast the levitate spell with this trait, without requiring a material component.
    // When you reach 3rd level, you can cast the create or destroy water spell as a 2nd-level spell once with this trait, and you regain the ability to cast it this way when you finish a long rest
    // You can cast the detect magic and disguise self spells with this trait. Once you cast either of these spells with this trait, you can’t cast that spell with it again until you finish a long rest.
    // You can cast animal friendship an unlimited number of times with this trait, but you can target only snakes with it.
    // grants that state no limit keep no uses (lineage tables add theirs afterwards)
    for (const grant of AdvancementHelper.parseSpellCastGrants(strippedDescription, { defaultAmount: null })) {
      if (spellsAdded.has(grant.name)) continue;
      spellsAdded.add(grant.name);
      result.spellGrants.push(grant);
    }

    for (const grant of AdvancementHelper.#alwaysPreparedGrants(strippedDescription)) {
      if (spellsAdded.has(grant.name)) continue;
      spellsAdded.add(grant.name);
      result.spellGrants.push(grant);
    }

    // You also always have the Speak with Animals spell prepared. You can cast it without a spell slot a number of times equal to your Proficiency Bonus
    const alwaysPreparedProfRegex = /You (?:also )?always have the (.+?) spell prepared\. You can cast it without a spell slot a number of times equal to your Proficiency Bonus/ig;
    for (const match of strippedDescription.matchAll(alwaysPreparedProfRegex)) {
      const spell = match[1].toLowerCase().trim();
      if (spellsAdded.has(spell)) continue;
      spellsAdded.add(spell);
      result.spellGrants.push({
        level: 1,
        name: spell,
        amount: "@prof",
      });
    }

    result.spellChoices.push(...AdvancementHelper.#restrictedSpellChoices(strippedDescription));

    AdvancementHelper.#dropImplausibleSpellNames(result, description);
    return result;
  }

  static parseHTMLPTagSpellAdvancementData({ description, species } = {}) {

    const dom = utils.htmlToDocumentFragment(description);

    const pTags = dom.querySelectorAll("p strong");

    let result;

    pTags.forEach((pTag) => {
      const textContent = pTag.textContent.trim().replace(".", "");
      if (textContent.toLowerCase() === species.toLowerCase()) {
        result = AdvancementHelper.parseHTMLSpellAdvancementData(pTag.parentNode.innerHTML); ;
      }
    });
    return result || AdvancementHelper.parseHTMLSpellAdvancementData(description);

  }

  static parseHTMLTableSpellAdvancementData({ description, species } = {}) {
    const dom = utils.htmlToDocumentFragment(description);

    const rows = dom.querySelectorAll("table tbody tr");
    const lineages = [];

    rows.forEach((row) => {
      const cells = row.querySelectorAll("td");
      if (cells.length >= 4) {
        const lineage = {
          name: cells[0].textContent.trim(),
          one: cells[1].textContent.trim(),
          three: cells[2].textContent.trim(),
          five: cells[3].textContent.trim(),
        };
        lineages.push(lineage);
      }
    });

    const speciesWords = species.toLowerCase().split(/[^a-z]+/).filter((word) => word !== "");
    const lineageMatch = lineages.find((l) => l.name.toLowerCase() === species.toLowerCase())
      ?? lineages.find((l) => species.toLowerCase().includes(l.name.toLowerCase()))
      // DDB spells some option names differently from the table row (Cthonic vs Chthonic)
      ?? lineages.find((l) => !l.name.includes(" ")
        && speciesWords.some((word) => AdvancementHelper.#withinOneEdit(word, l.name.toLowerCase())));

    if (!lineageMatch) {
      // parsing the whole table would grant every lineage's spells
      logger.warn(`No lineage table row found for ${species}, no lineage spells will be granted`, { lineages });
      return AdvancementHelper.parseHTMLSpellAdvancementData("");
    }

    const adjustedDescription = `${lineageMatch.one}
Starting at 3rd level, you can cast the ${lineageMatch.three} spell with this trait.
Starting at 5th level, you can cast the ${lineageMatch.five} spell with this trait.`;

    const result = AdvancementHelper.parseHTMLSpellAdvancementData(adjustedDescription);

    // 2024 lineages: "You can cast it once without a spell slot" for the level 3 and 5 spells
    if ((/cast it once without a spell slot/i).test(AdvancementHelper.stripDescription(description))) {
      for (const grant of result.spellGrants) {
        if (grant.level > 1) grant.amount = "1";
      }
    }

    return result;
  }

  /** True when the two strings differ by at most one inserted, deleted or substituted character. */
  static #withinOneEdit(a: string, b: string): boolean {
    if (Math.abs(a.length - b.length) > 1) return false;
    let i = 0;
    let j = 0;
    let edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        i++;
        j++;
        continue;
      }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (b.length > a.length) j++;
      else {
        i++;
        j++;
      }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }


  static CONDITION_MAPPING = {
    "resistance": "dr",
    "immunity": "di",
    "immune": "di",
    "vulnerability": "dv",
    // "condition": "ci",
  };


  static parseHTMLConditions(description) {
    const grants = new Set();
    const choices = new Set();
    const parsedConditions = {
      choices: [],
      grants: [],
      number: 0,
      hint: "",
    };

    const textDescription = AdvancementHelper.stripDescription(description).toLowerCase();

    // quick and dirty damage matches, 90 % of use cases
    const isObviousDamage = textDescription.includes("damage");
    const adjustedText = textDescription.replaceAll(" damage", "");

    if (isObviousDamage) {
      // You have resistance to psychic damage
      // You have resistance to necrotic damage and radiant damage.
      // you gain resistance to lightning and thunder damage
      // You gain immunity to fire damage.
      // you gain immunity to lightning and thunder damage.
      // You also have resistance to psychic damage
      // and you have resistance to poison damage.
      // You have resistance to poison damage and immunity to disease, and you have advantage on saving throws against being paralyzed or poisoned.
      // you gain resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.
      // the paladin gains resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons.
      // You gain resistance to acid damage and poison damage,
      // You also have resistance to poison damage.
      // You are immune to poison damage and the poisoned condition.
      // You have resistance to acid and poison damage, and you have advantage on saving throws against being poisoned.
      const damageRegexs = [
        /(?:you|the paladin) (?:also have|have|gains*|are) ([^advantage].*) to (.*?)($|\.|and you have advantage|\w+:)/im,
        /(?:you gain) (.*?) to (.*?)($|\.|\w+:)/im,
      ];
      for (const damageRegex of damageRegexs) {
        const damageMatch = adjustedText.match(damageRegex);
        if (damageMatch) {
          const additionalMatches = damageMatch[2]
            .replaceAll(" and ", ",")
            .split(",")
            .map((dmg) => dmg.toLowerCase().replace(" damage", "").trim());
          for (const match of additionalMatches) {
            const conditionKind = damageMatch[1].toLowerCase().trim();
            const damageMapping = DICTIONARY.actor.damageAdjustments.find((a) =>
              a.kind === conditionKind // only match the kind
              && a.type !== 4 // don't include conditions
              && match === a.name.toLowerCase(),
            );

            if (damageMapping) {
              const type = AdvancementHelper.CONDITION_MAPPING[conditionKind];
              const valueData = foundry.utils.hasProperty(damageMapping, "foundryValues")
                ? foundry.utils.getProperty(damageMapping, "foundryValues")
                : foundry.utils.hasProperty(damageMapping, "foundryValue")
                  ? { value: damageMapping.foundryValue }
                  : undefined;

              if (!valueData) continue;
              const midiValues = game.modules.get("midi-qol")?.active && valueData.midiValues
                ? valueData.midiValues
                : [];
              const mappingValueArray = midiValues.concat(valueData.value).map((value) => value.toLowerCase());

              mappingValueArray.forEach((value) => {
                if (type) grants.add(`${type}:${value}`);
                if (type === "di" && value === "poison") {
                  grants.add("ci:poisoned");
                }
              });
            }
          }
        }
      }
    }

    const isImmunity = textDescription.includes("immunity") || textDescription.includes("immune");
    // You have resistance to poison damage and immunity to disease,
    // You are immune to being charmed,
    // you makes you immune to disease.
    // you makes you immune to disease and poison.
    // and you are immune to the poisoned condition.
    // You are immune to poison damage and the poisoned condition.
    // You are immune to disease.
    if (isImmunity) {
      const immuneRegex = /(?:you have|and|you are|makes you|you (?:also )gain) (?:immune|immunity) to (?:the )?(.*?)($|\.|and you have advantage|\w+:)/im;
      const immuneMatch = textDescription.match(immuneRegex);
      if (immuneMatch) {
        let addPoisonDI = false;
        const additionalMatches = immuneMatch[1]
          .replace(" and ", ",")
          .split(",")
          .map((dmg) => {
            const result = dmg.toLowerCase().replace(" condition", "").trim();
            if (dmg === "poison") {
              addPoisonDI = true;
              return "poisoned";
            } else if (dmg === "disease") return "diseased";
            else return result;
          });
        for (const match of additionalMatches) {
          const conditionMapping = DICTIONARY.actor.damageAdjustments.find((a) =>
            a.kind === "immunity" // only match the immunity kind
            && a.type === 4 // dont include damage adjustments
            && match === a.name.toLowerCase(),
          );
          if (conditionMapping) {
            grants.add(`ci:${conditionMapping.foundryValue}`);

            if (addPoisonDI && conditionMapping.foundryValue === "poisoned") grants.add("di:poison");
          }
        }
      }

    }

    // These are special types
    // You have resistance to the damage type associated with your * Ancestry.
    const dragonMatch = textDescription.match(/resistance to the damage type associated with your (\w*) Ancestry/mi);
    if (dragonMatch) {
      parsedConditions.count = 1;
      parsedConditions.hint = textDescription;
      switch (dragonMatch[1].toLowerCase()) {
        case "metallic": {
          ["fire", "lightning", "acid", "cold"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
        case "chromatic": {
          ["acid", "lightning", "poison", "fire", "cold"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
        case "gem": {
          ["force", "radiant", "psychic", "thunder", "necrotic"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
        default: {
          ["acid", "lightning", "poison", "fire", "acid", "cold"].forEach((dr) => {
            if (textDescription.includes(dr)) {
              choices.add(`dr:${dr}`);
            }
          });
          break;
        }
      }
    }

    // You now have resistance to a damage type determined by your patron’s kind:
    if (textDescription.includes("resistance to a damage type determined by your patron’s kind:")) {
      parsedConditions.count = 1;
      parsedConditions.hint = textDescription;
      ["bludgeoning", "thunder", "fire", "cold"].forEach((dr) => {
        if (textDescription.includes(dr)) {
          choices.add(`dr:${dr}`);
        }
      });
    }

    // You have resistance to all damage dealt by other creatures (their attacks, spells, and other effects).
    if (textDescription.includes("resistance to all damage dealt by other creatures")) {
      Object.keys(CONFIG.DND5E.damageTypes).forEach((dr) => {
        grants.add(`dr:${dr}`);
      });
    }

    // NOT IMPLEMENTED: Foundry doesn't support these kind of things they are not really condition resistances etc
    // and you have advantage on saving throws against being poisoned.
    // You and friendly creatures within 10 feet of you have resistance to damage from spells.
    // You have advantage on Intelligence, Wisdom, and Charisma saving throws against spells.
    // You have advantage on saving throws you make to avoid or end the poisoned condition on yourself.
    // You have advantage on saving throws against spells and other magical effects.
    // and you have advantage on saving throws against being paralyzed or poisoned.

    parsedConditions.grants = Array.from(grants);
    parsedConditions.choices = Array.from(choices);
    return parsedConditions;
  }

  // static parseHTMLEquipment(description) {
  //   const parsedEquipment = {
  //     choices: [],
  //     grants: [],
  //     number: 0,
  //   };
  //   const textDescription = AdvancementHelper.stripDescription(description);

  //   // You start with the following equipment, in addition to the equipment granted by your background:
  //   // any two simple weapons of your choice
  //   // a light crossbow and 20 bolts
  //   // your choice of studded leather armor or scale mail
  //   // thieves’ tools and a dungeoneer’s pack

  //   // You start with the following equipment, in addition to the equipment granted by your background:

  //   // (a) a greataxe or (b) any martial melee weapon
  //   // (a) two handaxes or (b) any simple weapon
  //   // An explorer’s pack and four javelins

  //   // parse equipment here

  //   return parsedEquipment;
  // }


  // static getEquipmentAdvancement(parts) {

  // }

  static async getCompendiumSpellUuidsFromNames(names, { use2024Spells = false } = {}) {
    const spellChoice = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-force-spell-version");
    const spells = await CompendiumHelper.retrieveCompendiumSpellReferences(names, {
      use2024Spells: spellChoice === "FORCE_2024" || use2024Spells,
    });

    return spells;
  }

  static async _getSpellUuidsFromFeatureSpellData(names, spellData, is2024) {
    const lookupSpellNames = [];
    const uuids = [];
    for (const spell of names) {
      const spellDataMatch = spellData.find((s) => {
        const spellName = foundry.utils.getProperty(s, "flags.ddbimporter.originalName") || s.name;
        return spellName.toLowerCase() === spell.toLowerCase() && foundry.utils.hasProperty(s, "_stats.compendiumSource");
      });
      if (spellDataMatch) {
        const spellName = foundry.utils.getProperty(spellDataMatch, "flags.ddbimporter.originalName") || spellDataMatch.name;
        uuids.push({
          name: spellName,
          uuid: spellDataMatch._stats.compendiumSource,
          level: spellDataMatch.system?.level,
        });
      } else {
        lookupSpellNames.push(spell);
      }
    }
    if (lookupSpellNames.length > 0) {
      const remainingUuids = await AdvancementHelper.getCompendiumSpellUuidsFromNames(lookupSpellNames, { use2024Spells: is2024 });
      uuids.push(...remainingUuids.map((s) => {
        const level = foundry.utils.getProperty(s, "system.level");
        return {
          ...s,
          level: typeof level === "number" ? level : undefined,
        };
      }));
    }
    return uuids;
  }

  static async getCantripChoiceAdvancement({
    choices = [], abilities = [], hint = "", name, spellListChoice = null, spellLinks,
    is2024, choiceLevel = 0, count = 1, allowReplacements = false, spellData = [],
  } = {}) {
    if (choices.length === 0 && !spellListChoice) return undefined;
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();
    const uuids = await AdvancementHelper._getSpellUuidsFromFeatureSpellData(choices, spellData, is2024);

    spellLinks.push({
      type: "choice",
      advancementId: advancement._id,
      choices,
      uuids,
      level: 0,
    });

    const levelChoices = {
      [choiceLevel]: {
        count,
        replacement: false,
      },
      replacement: {
        count: null,
        replacement: false,
      },
    };

    if (allowReplacements) {
      for (const level of utils.arrayRange(20, 1, 1)) {
        if (parseInt(level) < parseInt(choiceLevel)) continue;
        foundry.utils.setProperty(levelChoices, `${level}.replacement`, true);
      }
    }

    advancement.updateSource({
      title: name,
      hint,
      configuration: {
        allowDrops: true,
        pool: uuids.map((s) => {
          return { uuid: s.uuid };
        }),
        choices: levelChoices,
        restriction: {
          level: "0",
          type: "spell",
          list: spellListChoice ? [`class:${spellListChoice}`] : [],
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

  static async getSpellChoiceAdvancement({
    spellChoice, abilities = [], hint = "", name, spellLinks, method = "innate",
    requireSlot = false, prepared = CONFIG.DND5E.spellPreparationStates.always.value,
    level, choiceLevel = 0, choices = [], is2024, allowReplacements = false, count = 1, spellData = [],
  } = {}) {
    const advancement = new game.dnd5e.documents.advancement.ItemChoiceAdvancement();
    const spellListChoice = spellChoice.spellList || null;

    const uuids = await AdvancementHelper._getSpellUuidsFromFeatureSpellData(choices, spellData, is2024);

    spellLinks.push({
      type: "choice",
      advancementId: advancement._id,
      choices: spellChoice,
      level: level ?? spellChoice.level,
    });

    const levelChoices = {
      [choiceLevel]: {
        count,
        replacement: false,
      },
      replacement: {
        count: null,
        replacement: false,
        list: spellListChoice ? [`class:${spellListChoice}`] : [],
      },
    };

    if (allowReplacements) {
      for (const level of utils.arrayRange(20, 1, 1)) {
        if (parseInt(level) < parseInt(choiceLevel)) continue;
        foundry.utils.setProperty(levelChoices, `${level}.replacement`, true);
      }
    }

    const schools = spellChoice.schools ?? [];
    // the choice describes itself; "Choose a level 1 spell from the Divination or Enchantment school"
    // is the only school restriction dnd5e 5.x can show (no restriction.school before 6.0)
    const choiceHint = schools.length > 0
      ? `Choose a level ${spellChoice.level} spell from the ${schools
        .map((id) => DICTIONARY.spell.schools.find((school) => school.id === id)?.name ?? id)
        .map((school) => utils.capitalize(school))
        .join(" or ")} school.`
      : spellListChoice
        ? `Choose a level ${spellChoice.level} spell from the ${utils.capitalize(spellListChoice)} spell list.`
        : "";

    advancement.updateSource({
      title: name,
      // the level the feature offers the choice at; the spell's own level is the restriction below
      level: level ? parseInt(level) : parseInt(String(choiceLevel)),
      configuration: {
        allowDrops: true,
        pool: uuids.map((s) => {
          return { uuid: s.uuid };
        }),
        choices: levelChoices,
        restriction: {
          level: parseInt(spellChoice.level),
          type: "spell",
          list: spellListChoice ? [`class:${spellListChoice}`] : [],
        },
        type: "spell",
        spell: {
          ability: abilities,
          method,
          prepared,
          uses: spellChoice.amount
            ? {
              max: spellChoice.amount === "" ? "" : spellChoice.amount,
              per: spellChoice.amount === "" ? "" : "lr",
              requireSlot,
            }
            : {
              max: "",
              per: "",
              requireSlot,
            },
        },
      },
      hint: choiceHint !== "" ? choiceHint : hint,
    });

    return advancement;
  }

  static async getCantripGrantAdvancement({
    choices = [], abilities = [], hint = "", name, spellLinks, is2024, spellData = [],
  } = {}) {
    if (choices.length === 0) return undefined;
    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();
    const uuids = await AdvancementHelper._getSpellUuidsFromFeatureSpellData(choices, spellData, is2024);

    spellLinks.push({
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
          return {
            uuid: s.uuid,
            optional: false,
          };
        }),
        type: "spell",
        spell: {
          ability: abilities,
          method: "spell",
          prepared: CONFIG.DND5E.spellPreparationStates.always.value,
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

  static async getSpellGrantAdvancement({
    spellGrants, abilities = [], hint = "", name, spellLinks, method = "innate",
    requireSlot = false, prepared = CONFIG.DND5E.spellPreparationStates.always.value,
    level, is2024, forceNoAmount = false, spellData = [],
  }: {
    spellGrants: { name: string; level?: number | string; amount?: string; period?: "sr" | "lr" }[];
    abilities?: string[];
    hint?: string;
    name?: string;
    spellLinks: Record<string, unknown>[];
    method?: string;
    requireSlot?: boolean;
    prepared?: number;
    level?: number | string | null;
    is2024?: boolean;
    forceNoAmount?: boolean;
    spellData?: Record<string, unknown>[];
  }) {
    const spellGrant = spellGrants[0];
    const uuids = await AdvancementHelper._getSpellUuidsFromFeatureSpellData(spellGrants.map((g) => g.name), spellData, is2024);

    if (uuids.length === 0) return null;
    const advancement = new game.dnd5e.documents.advancement.ItemGrantAdvancement();

    spellLinks.push({
      type: "grant",
      advancementId: advancement._id,
      choices: spellGrants,
      uuids,
      level: level ?? spellGrant.level,
    });

    advancement.updateSource({
      title: name,
      level: level ? parseInt(String(level)) : parseInt(String(spellGrant.level)),
      configuration: {
        items: uuids.map((s) => {
          return {
            uuid: s.uuid,
            optional: false,
          };
        }),
        type: "spell",
        spell: {
          ability: abilities,
          method,
          prepared,
          uses: spellGrant.amount && !forceNoAmount
            ? {
              max: spellGrant.amount,
              per: spellGrant.period ?? "lr",
              requireSlot,
            }
            : {
              max: "",
              per: "",
              requireSlot,
            },
        },
      },
      hint,
    });

    return advancement;
  }


  /**
   * "Choose an ancestry from the Giantkin Ancestry table": every row's spells are in the table, but
   * DDB also gives the chosen row's benefits as traits of their own (Airstep, Crackling Personality),
   * so the table itself grants nothing and parsing it would grant every row's spells.
   */
  static withoutChoiceTables(description: string): string {
    if (!(/Choose an? [a-z]+ from the [^.]+? table\b/i).test(AdvancementHelper.stripDescription(description))) return description;
    return description.replace(/<table[\s\S]*?<\/table>/gi, "");
  }

  /** Lower-cased name of a compendium document from its (already indexed) uuid, or null. */
  static #compendiumName(uuid: string): string | null {
    try {
      const doc = fromUuidSync(uuid, { strict: false }) as { name?: string } | null;
      return doc?.name ? utils.nameString(doc.name).toLowerCase() : null;
    } catch {
      return null;
    }
  }

  static async addSpellAdvancement({ ddbParser, feature, type } = {}, addToAdvancements = true) {
    const advancements = [];

    const htmlData = AdvancementHelper.parseHTMLSpellAdvancementDataForTraits(feature.system.description.value);

    const abilityData = AdvancementHelper.parseHTMLSpellCastingAbilities(feature.system.description.value);
    const name = feature.name.toLowerCase().includes("spell")
      ? feature.name
      : `${feature.name} (Spells)`;
    const cantripName = feature.name.toLowerCase().includes("cantrip")
      ? feature.name
      : `${feature.name} (Cantrips)`;

    const hint = htmlData.hint !== "" ? htmlData.hint : abilityData.hint;
    const spellChoice = game.settings.get(SETTINGS.MODULE_ID, "munching-policy-force-spell-version");
    const use2024Spells = spellChoice === "FORCE_2024" || feature.system.source.rules === "2024";

    const spellData = ddbParser.ddbCharacter._spellParser._granted[type]
      .filter((s) =>
        s.flags.ddbimporter?.dndbeyond?.lookupName === (foundry.utils.getProperty(feature, "flags.ddbimporter.originalName") ?? feature.name)
        && s.flags.ddbimporter?.dndbeyond?.lookup?.startsWith(type),
      );

    logger.debug(`Spell Advancement Data from ${feature.name}`, {
      htmlData,
      ddbParser,
      feature,
      abilityData,
      name,
      hint,
      type,
      spellData,
    });

    const cantripChoiceAdvancement = await AdvancementHelper.getCantripChoiceAdvancement({
      choices: htmlData.cantripChoices,
      abilities: abilityData.abilities,
      hint,
      name: cantripName,
      spellListChoice: htmlData.spellListCantripChoice,
      spellLinks: ddbParser.spellLinks,
      is2024: ddbParser.is2024,
      count: htmlData.spellListCantripChoiceNum ?? 1,
      allowReplacements: htmlData.spellListChoiceReplace,
      spellData,
    });
    if (cantripChoiceAdvancement) {
      advancements.push(cantripChoiceAdvancement);
    }

    const cantripGrantAdvancement = await AdvancementHelper.getCantripGrantAdvancement({
      choices: htmlData.cantripGrants,
      abilities: abilityData.abilities,
      hint,
      name: cantripName,
      spellLinks: ddbParser.spellLinks,
      is2024: ddbParser.is2024,
      spellData,
    });
    if (cantripGrantAdvancement) {
      advancements.push(cantripGrantAdvancement);
      // ddbParser.spellsGranted[type].push({ feature: feature.name, spells: htmlData.cantripGrants, use2024Spells });
      // for (const cantripGrant of htmlData.cantripGrants) {
      //   if (Object.values(feature.system.activities).some((a) => a.name.toLowerCase() === cantripGrant.toLowerCase() && a.type === "cast")) {
      //     continue;
      //   }

      //   const spellIndex = await AdvancementHelper._getSpellUuidsFromFeatureSpellData([cantripGrant], spellData, use2024Spells);
      //   if (!spellIndex || spellIndex.length === 0) {
      //     logger.warn(`No compendium spell found for ${cantripGrant}, cannot build spell activity for feature ${feature.name}, adding spell directly`);
      //     continue;
      //   }

      //   const uuid = spellIndex[0].uuid;

      //   if (Object.values(feature.system.activities).some((a) => a.type === "cast" && a.spell?.uuid === uuid)) {
      //     logger.debug(`Spell activity for ${cantripGrant} already exists on feature ${feature.name}, skipping`);
      //     continue;
      //   }

      //   const activity = new DDBBasicActivity({
      //     nameIdPrefix: utils.namedIDStub(cantripGrant, {
      //       prefix: "gr",
      //       length: 12,
      //     }),
      //     type: "cast",
      //     foundryFeature: feature,
      //   });

      //   const spellOverride = {
      //     uuid,
      //     properties: abilityData.properties ?? [],
      //     spellbook: true,
      //   };

      //   activity.build({
      //     generateSpell: true,
      //     generateConsumption: true,
      //     noConsumeTargets: true,
      //     spellOverride,
      //   });

      //   feature.system.activities[activity.data._id] = activity.data;
      // }
    }

    // spells carried by an advancement are innate unless the text also lets you cast them with your
    // spell slots (2024 lineages, Monsters of the Multiverse, Fey Touched); Infernal Legacy does not
    const advancementSpellMethod = (/using any spell slots|with any spell slots|spell slots you have/i)
      .test(AdvancementHelper.stripDescription(feature.system.description.value))
      ? "spell"
      : "innate";
    // a feat that also lets you choose a spell follows the official shape (Fey Touched): the granted
    // spell carries its free cast on the advancement like the chosen one, with no cast activity
    const usesOnAdvancement = (type === "feat" && htmlData.spellChoices.length > 0);

    const isItemConsume = !foundry.utils.hasProperty(feature, "system.uses.max")
      || feature.system.uses.max === ""
      || feature.system.uses.max === 0
      || feature.system.uses.max === "0";

    for (const spellGrant of htmlData.spellGrants) {
      const spellGrantAdvancement = await AdvancementHelper.getSpellGrantAdvancement({
        spellGrants: [spellGrant],
        abilities: abilityData.abilities,
        hint,
        name,
        spellLinks: ddbParser.spellLinks,
        is2024: ddbParser.is2024,
        // no cast activity is built when the uses live on the advancement (choice feats), so the free
        // casts are carried by the granted spell instead
        requireSlot: !usesOnAdvancement,
        forceNoAmount: !usesOnAdvancement,
        method: usesOnAdvancement ? advancementSpellMethod : "spell",
        spellData,
      });
      if (spellGrantAdvancement) {
        advancements.push(spellGrantAdvancement);
        if (usesOnAdvancement) continue;
        // a cast the feature already carries (usually an enricher's) provides the spell, so it is recorded
        // as granted and not also put on the sheet on its own
        const markCastGranted = () => {
          ddbParser.spellsGranted[type].push({ feature: feature.name, spells: [spellGrant.name], use2024Spells });
        };
        if (Object.values(feature.system.activities).some((a) => a.name === spellGrant.name && a.type === "cast")) {
          markCastGranted();
          continue;
        }

        const spellIndex = await AdvancementHelper._getSpellUuidsFromFeatureSpellData([spellGrant.name], spellData, use2024Spells);
        if (!spellIndex || spellIndex.length === 0) {
          logger.warn(`No compendium spell found for ${spellGrant.name}, cannot build spell activity for feature ${feature.name}, adding spell directly`);
          continue;
        }

        const uuid = spellIndex[0].uuid;

        // an enricher's cast can resolve the other ruleset's copy of the spell (a 2014 Disguise Self beside
        // the grant's 2024 one), so a cast of the same spell name counts too
        const grantName = utils.nameString(spellIndex[0].name).toLowerCase();
        const castActivities = Object.values(feature.system.activities as Record<string, I5eActivity>)
          .filter((a): a is I5eCastActivity => a.type === "cast");
        if (castActivities.some((a) => a.spell?.uuid
          && (a.spell.uuid === uuid || AdvancementHelper.#compendiumName(a.spell.uuid) === grantName))) {
          logger.debug(`Spell activity for ${spellGrant.name} already exists on feature ${feature.name}, skipping`);
          markCastGranted();
          continue;
        }

        const activity = new DDBBasicActivity({
          nameIdPrefix: utils.namedIDStub(spellGrant.name, {
            prefix: "gr",
            length: 12,
          }),
          type: "cast",
          foundryFeature: feature,
        });

        const spellOverride = {
          uuid,
          properties: abilityData.properties ?? [],
          spellbook: true,
        };

        // a cantrip is always at will, and a sorcery point cast is paid for rather than counted
        const isCantrip = spellIndex[0].level === 0;
        const sorceryPoints = spellGrant.sorceryPoints;
        const limited = !isCantrip && sorceryPoints === undefined && !!spellGrant.amount;
        const featureUses = limited && spellGrant.featureUses === true;
        const additionalTargets: I5eConsumptionTarget[] = sorceryPoints === undefined
          ? []
          : [{
            type: "itemUses",
            // resolved to the actor's Sorcery Points item by the replaceActivityUses linking pass
            target: "Sorcery Points",
            value: String(sorceryPoints),
            scaling: { mode: "", formula: "" },
          }];

        activity.build({
          generateSpell: true,
          generateConsumption: true,
          consumeActivity: limited && !featureUses && !isItemConsume,
          consumeItem: limited && (featureUses || isItemConsume),
          additionalTargets,
          spellOverride,
        });
        if (sorceryPoints !== undefined) {
          foundry.utils.setProperty(feature, "flags.ddbimporter.replaceActivityUses", true);
        }

        if (limited) {
          const uses = {
            spent: 0,
            max: spellGrant.amount,
            recovery: spellGrant.shortRestRecovery
              ? [
                { period: "sr", type: "formula", formula: spellGrant.shortRestRecovery },
                { period: "lr", type: "recoverAll" },
              ]
              : [{ period: spellGrant.period ?? "lr", type: "recoverAll" }],
          };
          // a feature that already counts its own uses (The Third Eye) keeps them; the cast spends one
          if (isItemConsume) {
            feature.system.uses = uses;
          } else if (!featureUses) {
            activity.data.uses = uses as I5eSystemLimitedUses;
          }
        }
        feature.system.activities[activity.data._id] = activity.data;

        ddbParser.spellsGranted[type].push({ feature: feature.name, spells: [spellGrant.name], use2024Spells });

        logger.warn(`Added spell activity for ${spellGrant.name} to feature ${feature.name}`);

      }
    }

    for (const spellChoice of htmlData.spellChoices) {
      const spellChoiceAdvancement = await AdvancementHelper.getSpellChoiceAdvancement({
        spellChoice,
        abilities: abilityData.abilities,
        hint,
        name,
        spellLinks: ddbParser.spellLinks,
        is2024: ddbParser.is2024,
        allowReplacements: htmlData.spellListChoiceReplace,
        method: advancementSpellMethod,
        spellData,
      });
      if (spellChoiceAdvancement) {
        advancements.push(spellChoiceAdvancement);
      }
    }

    logger.debug("Spell Advancements", {
      advancements,
      feature,
    });

    if (!addToAdvancements) return;
    advancements.forEach((advancement) => {
      feature.system.advancement.push(advancement.toObject());
    });
  }

}
