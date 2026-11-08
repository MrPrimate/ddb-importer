import { DICTIONARY } from "../../config/_module";
import logger from "../../lib/Logger";
import AdvancementBuilder from "./AdvancementBuilder";
import { parseWeaponMastery } from "../lib/WeaponMastery";

/** DDB's choice subtypes for the picks a feat offers (type 2 choices). */
const CHOICE_SUBTYPE = {
  PROFICIENCY: 1,
  EXPERTISE: 2,
  LANGUAGE: 3,
  // proficiency and Expertise in the same pick (Aereni Expertise)
  PROFICIENCY_AND_EXPERTISE: 6,
} as const;

/** DDB's choice type for a feat option (a sub-feature to pick, e.g. Resilient's ability). */
const OPTION_CHOICE_TYPE = 3;

/** The DDB modifier types that carry a feat's fixed grants and its resolved picks. */
const GRANT_MODIFIER_TYPES = new Set(["proficiency", "language", "expertise"]);

type TFeatTraitMode = "default" | "expertise" | "upgrade" | "forcedExpertise" | "mastery";

const TRAIT_MODES: TFeatTraitMode[] = ["default", "upgrade", "expertise", "forcedExpertise", "mastery"];

interface IFeatChoiceGroup {
  mode: TFeatTraitMode;
  pool: string[];
  count: number;
  picks: string[];
}

interface IFeatTraitOptions {
  ddbData: IDDBData;
  definition: { id: number | string; entityTypeId: number | string; name: string; description?: string | null };
  isMuncher: boolean;
}

/**
 * Trait advancements for the proficiencies, languages and expertise a feat grants, built the way
 * the official dnd5e feats carry them: on the feat itself, level 0, no replacements, fixed grants
 * plus counted choices from a pool ("skills:*", "tool:*", "saves:*" when the pool covers them all).
 *
 * DDB keeps everything a feat offers on its type 2 choices (the option pool, and the pick on a
 * character; the mule has no pick), and its resolved picks plus fixed grants as the feat's own
 * modifiers. A fixed grant is a modifier no pick explains. On a character import the advancement
 * records what was chosen and changes nothing (the character parser already set the proficiencies);
 * a munched compendium feat leaves the value empty so the advancement flow asks.
 */
export default class FeatTraitAdvancements {

  ddbData: IDDBData;
  definition: IFeatTraitOptions["definition"];
  isMuncher: boolean;

  constructor({ ddbData, definition, isMuncher }: IFeatTraitOptions) {
    this.ddbData = ddbData;
    this.definition = definition;
    this.isMuncher = isMuncher;
  }

  /** The Trait key for a DDB skill, save, tool, language, armor or weapon label, or null. */
  static traitKey(label: string | null | undefined): string | null {
    const text = (label ?? "").trim().replace(/[’‘]/g, "'");
    if (text === "") return null;

    const skill = DICTIONARY.actor.skills.find((s) => s.label === text);
    if (skill) return `skills:${skill.name}`;

    const save = text.match(/^(\w+) Saving Throws?$/i);
    if (save) {
      const ability = DICTIONARY.actor.abilities.find((a) => a.long === save[1].toLowerCase());
      if (ability) return `saves:${ability.value}`;
    }

    const language = DICTIONARY.actor.languages.find((l) => l.name.replace(/[’‘]/g, "'") === text);
    if (language) {
      const path = FeatTraitAdvancements.#languagePath(language.value);
      if (path) return `languages:${path}`;
      return language.advancement ? `languages:${language.advancement}:${language.value}` : `languages:${language.value}`;
    }

    const proficiency = DICTIONARY.actor.proficiencies.find((p) => p.name.replace(/[’‘]/g, "'") === text);
    if (!proficiency) return null;
    if (proficiency.type === "Tool" && "baseTool" in proficiency && proficiency.baseTool) {
      const toolType = "toolType" in proficiency ? proficiency.toolType : "";
      return toolType ? `tool:${toolType}:${proficiency.baseTool}` : `tool:${proficiency.baseTool}`;
    }
    if (proficiency.type === "Armor" && proficiency.foundryValue && proficiency.foundryValue !== "all") {
      return `armor:${proficiency.foundryValue}`;
    }
    if (proficiency.type === "Weapon" && proficiency.foundryValue) {
      return proficiency.advancement
        ? `weapon:${proficiency.advancement}:${proficiency.foundryValue}`
        : `weapon:${proficiency.foundryValue}`;
    }
    return null;
  }

  /**
   * A language's key path in dnd5e's own language tree ("exotic:cant", "exotic:primordial:ignan"),
   * which places the languages the dictionary leaves ungrouped (Druidic, Thieves' Cant). Null when
   * dnd5e's config is not loaded or does not know the language.
   */
  static #languagePath(value: string): string | null {
    const walk = (tree: Record<string, unknown> | undefined, prefix: string[]): string | null => {
      for (const [key, entry] of Object.entries(tree ?? {})) {
        if (key === value) return [...prefix, key].join(":");
        const children = entry && typeof entry === "object" && "children" in entry
          ? entry.children as Record<string, unknown>
          : undefined;
        const found = children ? walk(children, [...prefix, key]) : null;
        if (found) return found;
      }
      return null;
    };
    return walk(foundry.utils.getProperty(CONFIG, "DND5E.languages") as Record<string, unknown> | undefined, []);
  }

  /**
   * Every key of one trait the dictionary knows, used to collapse a full pool to its wildcard. Book
   * variants ("Common (WoW)") are left out: no core DDB pool lists them.
   */
  static #allKeys(prefix: "skills" | "saves" | "tool" | "weapon:sim" | "weapon:mar" | "languages:standard"): string[] {
    switch (prefix) {
      case "skills": return DICTIONARY.actor.skills.map((s) => `skills:${s.name}`);
      case "saves": return DICTIONARY.actor.abilities.map((a) => `saves:${a.value}`);
      default: {
        const keys = new Set<string>();
        for (const label of [
          ...DICTIONARY.actor.proficiencies.map((p) => p.name),
          ...DICTIONARY.actor.languages.map((l) => l.name),
        ]) {
          if (label.includes("(")) continue;
          const key = FeatTraitAdvancements.traitKey(label);
          if (key && key.startsWith(`${prefix}:`)) keys.add(key);
        }
        return [...keys];
      }
    }
  }

  /**
   * Replace every complete set of keys with its wildcard: all skills -> "skills:*", all saves ->
   * "saves:*", all simple or martial weapons -> "weapon:sim" / "weapon:mar", a tool group ->
   * "tool:art:*". DDB's "any tool" pool lists every artisan's tool and instrument but no single
   * gaming set, and its "Standard or Rare" language pool every standard language plus some rare
   * ones (never Druidic or Thieves' Cant), so those two read as "tool:*" and "languages:*". DDB
   * pools also list third-party entries the dictionary does not know; those were already dropped.
   */
  static collapsePool(keys: string[]): string[] {
    let pool = [...new Set(keys)];
    const covers = (all: string[]) => all.length > 0 && all.every((key) => pool.includes(key));
    const replace = (drop: (key: string) => boolean, wildcard: string) => {
      pool = pool.filter((key) => !drop(key)).concat(wildcard);
    };

    const skills = FeatTraitAdvancements.#allKeys("skills");
    if (covers(skills)) replace((key) => skills.includes(key), "skills:*");
    const saves = FeatTraitAdvancements.#allKeys("saves");
    if (covers(saves)) replace((key) => saves.includes(key), "saves:*");
    for (const group of ["sim", "mar"] as const) {
      const weapons = FeatTraitAdvancements.#allKeys(`weapon:${group}`);
      if (covers(weapons)) replace((key) => weapons.includes(key), `weapon:${group}`);
    }

    const tools = FeatTraitAdvancements.#allKeys("tool");
    const toolGroup = (group: string) => tools.filter((key) => key.startsWith(`tool:${group}:`));
    if (covers(toolGroup("art")) && covers(toolGroup("music"))) {
      replace((key) => key.startsWith("tool:"), "tool:*");
    } else {
      const groups = new Set(pool.filter((key) => key.startsWith("tool:") && key.split(":").length === 3).map((key) => key.split(":")[1]));
      for (const group of groups) {
        const groupKeys = toolGroup(group);
        if (covers(groupKeys)) replace((key) => groupKeys.includes(key), `tool:${group}:*`);
      }
    }

    const standard = FeatTraitAdvancements.#allKeys("languages:standard");
    if (covers(standard)) {
      const anyRare = pool.some((key) => key.startsWith("languages:") && !key.startsWith("languages:standard:"));
      if (anyRare) replace((key) => key.startsWith("languages:"), "languages:*");
      else replace((key) => standard.includes(key), "languages:standard:*");
    }
    return pool;
  }

  /** The description as plain text. */
  get #text(): string {
    return (this.definition.description ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ");
  }

  /**
   * "you gain proficiency ... If you already have proficiency ..., you instead gain Expertise",
   * "If you already have this proficiency, you instead gain expertise".
   */
  get isUpgrade(): boolean {
    return (/already have (?:\w+ )?(?:skill )?proficiency[^.]*\bexpertise\b/i).test(this.#text)
      || (/\bproficiency or expertise\b/i).test(this.#text);
  }

  /**
   * The text around a proficiency-or-Expertise grant: the sentence saying "already have
   * proficiency" and the one before it, which names the skill or lists the skills to choose from.
   */
  get #upgradeText(): string {
    const sentences = this.#text.split(/(?<=[.:])\s+/);
    const index = sentences.findIndex((sentence) => (/already have (?:\w+ )?(?:skill )?proficiency/i).test(sentence));
    if (index === -1) return "";
    return sentences.slice(Math.max(0, index - 2), index + 1).join(" ");
  }

  /** The skill Trait keys a piece of text names ("Animal Handling and Nature Proficiency"). */
  static #skillsNamed(text: string): string[] {
    return DICTIONARY.actor.skills
      .filter((skill) => new RegExp(`\\b${skill.label}\\b`, "i").test(text))
      .map((skill) => `skills:${skill.name}`);
  }

  /** The feat's unpicked or picked type 3 options, as their labels. */
  get #optionChoices(): { labels: string[]; picked: string | null }[] {
    const definitions = this.ddbData.character.choices.choiceDefinitions ?? [];
    return ((this.ddbData.character.choices as Record<string, any>).feat ?? [])
      .filter((choice: any) => String(choice.componentId) === String(this.definition.id) && choice.type === OPTION_CHOICE_TYPE)
      .map((choice: any) => {
        const definition = definitions.find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
        const labels = (definition?.options ?? [])
          .filter((option) => (choice.optionIds ?? []).includes(option.id))
          .map((option) => option.label ?? "");
        const picked = (definition?.options ?? []).find((option) => option.id === choice.optionValue)?.label ?? null;
        return { labels, picked };
      });
  }

  /**
   * A save pick DDB only adds once a type 3 ability option is picked (Resilient: options named
   * after the abilities, "saving throw proficiency with the chosen ability"). Null when the feat is
   * not one of these or its save choice is already there.
   */
  #optionSaveGroup(groups: IFeatChoiceGroup[]): IFeatChoiceGroup | null {
    if (groups.some((group) => group.pool.some((key) => key.startsWith("saves:")))) return null;
    if (!(/saving throw proficiency|proficiency in saving throws/i).test(this.#text)) return null;
    for (const { labels } of this.#optionChoices) {
      const abilities = labels.map((label) => DICTIONARY.actor.abilities.find((a) => a.long === label.trim().toLowerCase()));
      if (labels.length === 0 || abilities.some((ability) => !ability)) continue;
      const pool = FeatTraitAdvancements.collapsePool(abilities.map((ability) => `saves:${ability!.value}`));
      return { mode: "default", pool, count: 1, picks: [] };
    }
    return null;
  }

  /** The mastery Trait key for a DDB mastery label ("Greataxe (Cleave)", "Topple (Battleaxe)"). */
  static #masteryKey(label: string | null | undefined): string | null {
    const parsed = label ? parseWeaponMastery(label) : null;
    return parsed ? `weapon:${parsed.advancement}` : null;
  }

  /**
   * A weapon mastery pick DDB models as a type 3 option per weapon and mastery (2024 Weapon Master:
   * "Greataxe (Cleave)", ...). A pool covering every dictionary weapon that has a mastery reads as
   * "weapon:*", the official shape; third-party weapons in DDB's list are left out.
   */
  get #optionMasteryGroup(): IFeatChoiceGroup | null {
    if (!(/\bmastery propert/i).test(this.#text)) return null;
    for (const { labels, picked } of this.#optionChoices) {
      const keys = labels.map((label) => FeatTraitAdvancements.#masteryKey(label)).filter((key): key is string => key !== null);
      if (keys.length < 2 || keys.length * 2 < labels.length) continue;
      const core = DICTIONARY.actor.proficiencies
        .filter((prof) => prof.type === "Weapon" && "mastery" in prof && prof.mastery && prof.foundryValue && prof.advancement)
        .map((prof) => `weapon:${prof.advancement}:${prof.foundryValue}`);
      const pool = core.every((key) => keys.includes(key)) ? ["weapon:*"] : [...new Set(keys)];
      const pick = FeatTraitAdvancements.#masteryKey(picked);
      return { mode: "mastery", pool, count: 1, picks: pick ? [pick] : [] };
    }
    return null;
  }

  /**
   * A proficiency-or-Expertise skill grant DDB models as a type 3 switch ("Survival: Proficiency" /
   * "Survival: Expertise", "Expert Performer" / "Expert Performer: Expertise", "Proficiency" /
   * "Expertise"), whose skill pick (if any) only appears once the switch is picked. The skills come
   * from the option labels, else the text around the grant; "one of the following skills" is a
   * pick, anything else a grant of each.
   */
  get #optionUpgrade(): { skills: string[]; choose: boolean } | null {
    if (!this.isUpgrade) return null;
    const switches = this.#optionChoices.find(({ labels }) =>
      labels.length > 1 && labels.every((label) => (/\b(?:proficiency|expert(?:ise)?)\b/i).test(label)));
    if (!switches) return null;
    const fromLabels = FeatTraitAdvancements.#skillsNamed(switches.labels.join(" "));
    const skills = fromLabels.length > 0 ? fromLabels : FeatTraitAdvancements.#skillsNamed(this.#upgradeText);
    if (skills.length === 0) return null;
    const choose = fromLabels.length === 0 && (/\b(?:choose one|one of the following)\b/i).test(this.#upgradeText);
    return { skills, choose };
  }

  /** The feat's own type 2 choices, those that offer a proficiency, expertise or language. */
  get #choices(): any[] {
    return ((this.ddbData.character.choices as Record<string, any>).feat ?? []).filter((choice: any) =>
      String(choice.componentId) === String(this.definition.id)
      && choice.type === 2
      && (Object.values(CHOICE_SUBTYPE) as number[]).includes(choice.subType),
    );
  }

  /** A choice's option pool and pick as Trait keys; options the dictionary cannot map are left out. */
  #resolveChoice(choice: any): { pool: string[]; pick: string | null } {
    const definition = (this.ddbData.character.choices.choiceDefinitions ?? [])
      .find((selection) => selection.id === `${choice.componentTypeId}-${choice.type}`);
    const options = (definition?.options ?? []).filter((option) => (choice.optionIds ?? []).includes(option.id));
    const pool = options
      .map((option) => FeatTraitAdvancements.traitKey(option.label))
      .filter((key): key is string => key !== null);
    const picked = (definition?.options ?? []).find((option) => option.id === choice.optionValue);
    return { pool, pick: FeatTraitAdvancements.traitKey(picked?.label) };
  }

  /** Choices grouped by mode and pool, so three "Choose a Skill or Tool" picks are one choice of 3. */
  get choiceGroups(): IFeatChoiceGroup[] {
    const upgrade = this.isUpgrade;
    const groups = new Map<string, IFeatChoiceGroup>();
    for (const choice of this.#choices) {
      const { pool, pick } = this.#resolveChoice(choice);
      if (pool.length === 0) {
        logger.debug(`Feat choice "${choice.label}" on ${this.definition.name} offers nothing a Trait can hold`, { choice });
        continue;
      }
      let mode: TFeatTraitMode = choice.subType === CHOICE_SUBTYPE.EXPERTISE
        ? "expertise"
        : choice.subType === CHOICE_SUBTYPE.PROFICIENCY_AND_EXPERTISE ? "forcedExpertise" : "default";
      if (upgrade && pool.every((key) => key.startsWith("skills:"))) {
        // DDB offers the expertise branch of a proficiency-or-expertise pick as its own choice
        if (mode === "expertise") continue;
        mode = "upgrade";
      }
      const collapsed = FeatTraitAdvancements.collapsePool(pool);
      const key = `${mode}|${[...collapsed].sort().join(",")}`;
      const group = groups.get(key) ?? { mode, pool: collapsed, count: 0, picks: [] };
      group.count += 1;
      if (pick) group.picks.push(pick);
      groups.set(key, group);
    }
    return [...groups.values()];
  }

  /**
   * The feat's picks as Trait keys, by what they grant: a proficiency or language pick explains a
   * proficiency modifier, an expertise pick an expertise modifier, and a subtype 6 pick both.
   */
  get #picks(): { proficiency: Set<string>; expertise: Set<string> } {
    const proficiency = new Set<string>();
    const expertise = new Set<string>();
    for (const choice of this.#choices) {
      const pick = this.#resolveChoice(choice).pick;
      if (!pick) continue;
      if (choice.subType !== CHOICE_SUBTYPE.EXPERTISE) proficiency.add(pick);
      if (choice.subType === CHOICE_SUBTYPE.EXPERTISE || choice.subType === CHOICE_SUBTYPE.PROFICIENCY_AND_EXPERTISE) expertise.add(pick);
    }
    return { proficiency, expertise };
  }

  /** The feat's own modifiers that resolve to a Trait key, split into proficiency and expertise. */
  get #modifierKeys(): { proficiency: string[]; expertise: string[] } {
    const modifiers = (this.ddbData.character.modifiers.feat ?? []).filter((mod) =>
      String(mod.componentId) === String(this.definition.id)
      && String(mod.componentTypeId) === String(this.definition.entityTypeId)
      && GRANT_MODIFIER_TYPES.has(mod.type),
    );
    const proficiency = new Set<string>();
    const expertise = new Set<string>();
    for (const mod of modifiers) {
      const key = FeatTraitAdvancements.traitKey(mod.friendlySubtypeName);
      if (!key) continue;
      (mod.type === "expertise" ? expertise : proficiency).add(key);
    }
    return { proficiency: [...proficiency], expertise: [...expertise] };
  }

  /** One Trait advancement per mode that has anything to grant or offer. */
  build(): I5eAdvancement[] {
    let groups = this.choiceGroups;
    const picksBy = this.#picks;
    const picks = new Set([...picksBy.proficiency, ...picksBy.expertise]);
    const mods = this.#modifierKeys;
    // the picks also arrive as modifiers on a character; only what no pick explains is fixed
    const fixed: Record<TFeatTraitMode, string[]> = {
      default: mods.proficiency.filter((key) => !picksBy.proficiency.has(key)),
      expertise: mods.expertise.filter((key) => !picksBy.expertise.has(key)),
      upgrade: [],
      forcedExpertise: [],
      mastery: [],
    };

    const saveGroup = this.#optionSaveGroup(groups);
    if (saveGroup) groups.push(saveGroup);
    const masteryGroup = this.#optionMasteryGroup;
    if (masteryGroup) groups.push(masteryGroup);

    // an expertise pick among skills the feat itself grants (Boon of Skill: every skill, then
    // Expertise in one) is dnd5e's forcedExpertise, as the official feat has it
    const allSkills = DICTIONARY.actor.skills.map((skill) => `skills:${skill.name}`);
    const grantsEvery = (pool: string[]) => pool
      .flatMap((key) => (key === "skills:*" ? allSkills : [key]))
      .every((key) => key.startsWith("skills:") && fixed.default.includes(key));
    groups = groups.map((group) => (group.mode === "expertise" && grantsEvery(group.pool)
      ? { ...group, mode: "forcedExpertise" }
      : group));

    // a type 3 proficiency-or-Expertise switch: one upgrade Trait for its skills, replacing
    // whatever proficiency or expertise the character's resolved switch shows for them
    const upgrade = this.#optionUpgrade;
    if (upgrade && !groups.some((group) => group.mode === "upgrade")) {
      const covered = (key: string) => upgrade.skills.includes(key);
      fixed.default = fixed.default.filter((key) => !covered(key));
      fixed.expertise = fixed.expertise.filter((key) => !covered(key));
      groups = groups.filter((group) => !(group.mode !== "upgrade" && group.pool.every(covered)));
      if (upgrade.choose) {
        const picked = [...mods.proficiency, ...mods.expertise, ...picks].filter(covered);
        groups.push({ mode: "upgrade", pool: upgrade.skills, count: 1, picks: [...new Set(picked)].slice(0, 1) });
      } else {
        fixed.upgrade = upgrade.skills;
      }
    }

    const advancements: I5eAdvancement[] = [];
    for (const mode of TRAIT_MODES) {
      const modeGroups = groups.filter((group) => group.mode === mode);
      const grants = fixed[mode];
      if (grants.length === 0 && modeGroups.length === 0) continue;
      const chosen = [...grants, ...modeGroups.flatMap((group) => group.picks)];
      const advancement = AdvancementBuilder.createAdvancement(game.dnd5e.documents.advancement.TraitAdvancement);
      advancement.updateSource({
        level: 0,
        configuration: {
          mode,
          allowReplacements: false,
          grants,
          choices: modeGroups.map((group) => ({ count: group.count, pool: group.pool })),
        },
        ...(this.isMuncher || chosen.length === 0 ? {} : { value: { chosen } }),
      });
      advancements.push(advancement.toObject() as unknown as I5eAdvancement);
    }
    return advancements;
  }

}
