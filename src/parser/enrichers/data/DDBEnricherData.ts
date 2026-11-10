import { DICTIONARY } from "../../../config/_module";
import logger from "../../../lib/Logger";
import utils from "../../../lib/Utils";
import DDBDataUtils from "../../lib/DDBDataUtils";
import * as DDBTemplateStrings from "../../lib/DDBTemplateStrings";
import SpellDataUtils from "../../spells/SpellDataUtils";
import type DDBSummonsManager from "../../companions/DDBSummonsManager";
import AdvancementBuilder from "../../advancements/AdvancementBuilder";
import { AutoEffects, BehaviorHelper, ChangeHelper, SRDEffects } from "../effects/_module";

export interface IDDBBasicDamage {
  number?: number | null;
  denomination?: number | null;
  type?: string | null;
  types?: string[];
  bonus?: string;
  scalingMode?: "whole" | "half" | "none";
  scalingNumber?: number | null;
  scalingFormula?: string | number;
  customFormula?: string | null;
  /** dnd5e 6 die-modifier suffixes appended to the die term, e.g. ["r1"] -> "1d8r1". */
  modifiers?: string[];
}

export default abstract class DDBEnricherData<T extends TDDBEnricher = TDDBEnricher> {

  // Static getters, not fields
  static get AutoEffects(): typeof AutoEffects {
    return AutoEffects;
  }

  static get BehaviorHelper(): typeof BehaviorHelper {
    return BehaviorHelper;
  }

  static get SRDEffects(): typeof SRDEffects {
    return SRDEffects;
  }

  static get ChangeHelper(): typeof ChangeHelper {
    return ChangeHelper;
  }

  static get AdvancementBuilder(): typeof AdvancementBuilder {
    return AdvancementBuilder;
  }
  static ACTIVITY_TYPES = DICTIONARY.parsing.activity.types;
  static SPELL_PROPERTIES = DICTIONARY.spell.components;

  ddbEnricher: T;
  ddbParser: TDDBParsers;
  is2014: boolean;
  is2024: boolean;
  useLookupName: boolean;
  activityGenerator: TActivityGenerator | null;
  effectType: string;
  document: any;
  name: string;
  isCustomAction: boolean;
  manager: DDBSummonsManager | null;

  constructor({ ddbEnricher }: { ddbEnricher: T }) {
    this.ddbEnricher = ddbEnricher;
    this.ddbParser = ddbEnricher.ddbParser;
    // enrichers are constructed after load(); before that the enricher flags are null
    this.is2014 = ddbEnricher.is2014 ?? false;
    this.is2024 = ddbEnricher.is2024 ?? !this.is2014;
    this.useLookupName = ddbEnricher.useLookupName;
    this.activityGenerator = ddbEnricher.activityGenerator;
    this.effectType = ddbEnricher.effectType;
    this.document = ddbEnricher.document;
    this.name = ddbEnricher.name ?? "";
    this.isCustomAction = ddbEnricher.isCustomAction;
    this.manager = ddbEnricher.manager;
  }

  getFeatureActionsName({ type = null }: { type?: IActionTypes | null } = {}): IDDBFeatureActionMatches {
    return this.ddbEnricher.getFeatureActionsName({ type });
  }

  get parentIdentifier(): string {
    const parent = this.ddbEnricher.findActionParent("feat");
    const parentName = parent ? parent.definition.name : this.name;
    return DDBDataUtils.classIdentifierName(parentName);
  }

  hasClassFeature({ featureName, className = null, subClassName = null }: { featureName: string; className?: string | null; subClassName?: string | null } = { featureName: "" }): boolean {
    if (!this.ddbParser?.ddbData) return false;

    return DDBDataUtils.hasClassFeature({
      ddbData: this.ddbParser.ddbData,
      featureName,
      className,
      subClassName,
    });
  }

  /**
   * The parsed description of another class feature on this character, for enrichers that fold a
   * sibling feature's text into their own document. Returns null when the feature is absent or the
   * character has not reached its level.
   */
  getClassFeatureDescription({ featureName, className = null, subClassName = null }: { featureName: string; className?: string | null; subClassName?: string | null }): string | null {
    if (!this.ddbParser?.ddbData) return null;

    const feature = DDBDataUtils.getClassFeature({
      ddbData: this.ddbParser.ddbData,
      featureName,
      className,
      subClassName,
    });

    if (!feature?.definition.description) return null;

    const rawCharacter = this.ddbParser.rawCharacter;
    if (rawCharacter?.type !== "character") return feature.definition.description;

    return DDBTemplateStrings.parse(
      this.ddbParser.ddbData,
      rawCharacter,
      feature.definition.description,
      this.ddbParser.ddbFeature,
    )?.text ?? null;
  }

  /**
   * The parsed description of a DDB action on this character, for enrichers whose document folds in
   * an action's text (the default action match copies activities but not descriptions). Returns null
   * when the action is absent.
   */
  getActionDescription({ name, type = "class" }: { name: string; type?: IActionTypes }): string | null {
    const action = this.hasAction({ name, type });
    if (!action?.description) return null;

    const rawCharacter = this.ddbParser.rawCharacter;
    if (rawCharacter?.type !== "character") return action.description;

    return DDBTemplateStrings.parse(
      this.ddbParser.ddbData,
      rawCharacter,
      action.description,
      this.ddbParser.ddbFeature,
    )?.text ?? null;
  }

  hasSpeciesTrait({ traitName }: { traitName: string }): boolean {
    if (!this.ddbParser?.ddbData) return false;

    return DDBDataUtils.hasSpeciesTrait({
      ddbData: this.ddbParser.ddbData,
      traitName,
    });
  }

  get isAction(): boolean {
    return this.ddbParser.isAction ?? false;
  }

  /**
   * True when the feature belongs to the named class, or to a class DDB builds from it (the World
   * of Warcraft Shaman counts as a Barbarian, see DDBDataUtils.baseClassName).
   */
  isClass(name: string): boolean {
    const klass = this.ddbParser.klass;
    return klass === name || (!!klass && DDBDataUtils.baseClassName(klass) === name);
  }

  isSubclass(name: string): boolean {
    const klass = this.ddbParser.klass;
    return [this.ddbParser.subKlass, this.ddbParser.subClass].some((subclass) =>
      !!subclass && (subclass === name || DDBDataUtils.baseSubclassName(klass, subclass) === name));
  }

  hasSubclass(name: string): boolean {
    if (!this.ddbParser?.ddbData) return false;
    return DDBDataUtils.hasSubClass({
      ddbData: this.ddbParser.ddbData,
      subClassName: name,
    });
  }

  getClassIdentifier(name: string): string {
    return DDBDataUtils.classIdentifierName(name);
  }

  /**
   * The identifier of a class named as on DDB ("Bard", "Blood Hunter"), for `@scale.<class>` and
   * `@classes.<class>` references. Enrichers call this rather than writing the identifier, so a
   * change in how dnd5e names classes is made in one place.
   */
  static classIdentifier(className: string): string {
    return DDBDataUtils.classIdentifierName(className);
  }

  /**
   * As the static form, but when the feature's own class is built from the named one (a WoW Shaman
   * feature asking for "Barbarian") it returns the feature's class identifier, so `@scale` and
   * `@classes` references resolve on that class.
   */
  classIdentifier(className: string): string {
    const klass = this.ddbParser?.klass;
    if (klass && klass.trim() !== className && DDBDataUtils.baseClassName(klass) === className) {
      return DDBDataUtils.classIdentifierName(klass);
    }
    return DDBEnricherData.classIdentifier(className);
  }

  /**
   * The identifier of a subclass named as on DDB ("Circle of the Land", "College of the Moon"),
   * for `@scale.<subclass>` and `@subclasses.<subclass>` references. It depends on the dnd5e
   * version (`land` before 6.1, `circle-land` from 6.1, see DDBDataUtils.subclassIdentifierName),
   * so it is resolved when the enricher runs: never store it in a static field. `className` is the
   * parent class as named on DDB; from 6.1 warlock patrons gain a `-patron` suffix from it.
   */
  static subclassIdentifier(
    subclassName: string,
    { srd, className }: { srd?: boolean; className?: string | null } = {},
  ): string {
    return DDBDataUtils.subclassIdentifierName(subclassName, { srd, className });
  }

  /**
   * As the static form, with `className` defaulting to the class of the feature being parsed.
   */
  subclassIdentifier(
    subclassName: string,
    { srd, className }: { srd?: boolean; className?: string | null } = {},
  ): string {
    // a reprinted subclass (the WoW "Subtlety Specialization" for the Soulknife) carries its own identifier
    const klass = this.ddbParser?.klass;
    const ownSubclass = this.ddbParser?.subKlass ?? this.ddbParser?.subClass;
    if (!className && klass && ownSubclass && ownSubclass !== subclassName
      && DDBDataUtils.baseSubclassName(klass, ownSubclass) === subclassName) {
      return DDBEnricherData.subclassIdentifier(ownSubclass, { srd, className: klass });
    }
    return DDBEnricherData.subclassIdentifier(subclassName, { srd, className: className ?? klass });
  }

  /**
   * Every identifier the subclass can carry, current version first (see
   * DDBDataUtils.subclassIdentifierNames). For formulas that must keep resolving on actors
   * dnd5e migrates, such as Circle of the Moon's `moon` becoming `circle-moon` in 6.1.
   */
  subclassIdentifiers(subclassName: string, { className }: { className?: string | null } = {}): string[] {
    const klass = className ?? this.ddbParser?.klass;
    const names = [subclassName, ...(className ? [] : this.#reprintedSubclassNames(subclassName))];
    return [...new Set(names.flatMap((name) => DDBDataUtils.subclassIdentifierNames(name, { className: klass })))];
  }

  /**
   * The feature's class's own subclasses that reprint `subclassName` (the WoW Druid's Feral and
   * Guardian Specializations for the Circle of the Moon), when that class is a setting's copy of a
   * core class (DICTIONARY.parsing.classFolderSuffixes). A class feature cannot know which one the
   * actor will take, so a formula has to name them all.
   */
  #reprintedSubclassNames(subclassName: string): string[] {
    const klass = this.ddbParser?.klass?.trim();
    const classId = this.ddbParser?._class?.definition?.id;
    if (!klass || !classId || !DICTIONARY.parsing.classFolderSuffixes[classId]) return [];
    return Object.entries(DICTIONARY.parsing.subclassBaseNames)
      .filter(([key, base]) => base === subclassName && key.split("|")[0] === klass)
      .map(([key]) => key.split("|")[1]);
  }

  /**
   * The character's DDB action of this name, compared through nameString so curly apostrophes
   * and trailing spaces in DDB's names ("Slippery Ploy ") still match.
   */
  hasAction({ name, type }: { name: string; type: IActionTypes }): IDDBAction | undefined {
    const target = utils.nameString(name);
    return this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      utils.nameString(a.name) === target,
    );
  }

  /**
   * Whether a DDB action comes from the named subclass, or from a subclass DDB reprints it as
   * (the WoW "Subtlety Specialization" for the Soulknife).
   */
  #actionSubclassIs(action: IDDBAction, subclassName: string): boolean {
    const klass = DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, action.componentId);
    const subclass = klass?.subclassDefinition?.name;
    if (!klass || !subclass) return false;
    return subclass === subclassName || DDBDataUtils.baseSubclassName(klass.definition.name, subclass) === subclassName;
  }

  _getSpentValue(type: IActionTypes, name: string, matchSubClass: string | null = null, includesName = false): number | null {
    const spent = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || this.#actionSubclassIs(a, matchSubClass)),
    )?.limitedUse?.numberUsed ?? null;
    return spent;
  }

  _getMaxValue(type: IActionTypes, name: string, matchSubClass: string | null = null, includesName = false): number | null {
    const max = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || this.#actionSubclassIs(a, matchSubClass)),
    )?.limitedUse?.maxUses ?? null;
    return max;
  }

  _getGeneratedUses({ type, name, matchSubClass = null, scaleLink = null, includesName = false }: {
    type: IActionTypes;
    name: string;
    matchSubClass?: string | null;
    scaleLink?: string | null;
    includesName?: boolean;
  } = { type: "" as IActionTypes, name: "" }): I5eSystemLimitedUses {
    const action = this.ddbParser?.ddbData?.character.actions[type].find((a) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || this.#actionSubclassIs(a, matchSubClass)),
    );

    if (!action) {
      logger.warn(`No action found generating uses for "${name}" (${type})`, { this: this });
      return {};
    }

    const uses: I5eSystemLimitedUses = DDBDataUtils.getLimitedUses({
      // getLimitedUses treats a null limitedUse and an empty object identically
      data: action.limitedUse ?? ({} as IDDBActionLimitedUse),
      description: action.description,
      scaleValue: scaleLink
        ?? ((foundry.utils.getProperty(this.ddbParser, "useUsesScaleValueLink") && foundry.utils.getProperty(this.ddbParser, "scaleValueUsesLink"))
          ? foundry.utils.getProperty(this.ddbParser, "scaleValueUsesLink") as string
          : null),
    }) ?? {};
    return uses;
  }

  _getUsesWithSpent({ type, name, max = null, defaultSpent = null, period = "", formula = null, override = null, matchSubClass = null, includesName = false }: { type: IActionTypes; name: string; max?: string | null; defaultSpent?: number | null; period?: TLimitedUsePeriod; formula?: string | null; override?: boolean | null; matchSubClass?: string | null; includesName?: boolean }): I5eSystemLimitedUses {
    const uses: I5eSystemLimitedUses = {};

    // dnd5e's spent is a non-nullable NumberField, so only set it if we have a value
    const spent = this._getSpentValue(type, name, matchSubClass, includesName) ?? defaultSpent;
    if (spent !== null) uses.spent = spent;

    if (max) uses.max = max;

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: "recoverAll", formula: undefined }];
    }

    if (!max) {
      // a null max would stringify to the literal "null", which is not a valid formula
      const maxValue = this._getMaxValue(type, name, matchSubClass, includesName);
      if (maxValue === null) {
        logger.warn(`No max uses found for "${name}" (${type})`, { this: this });
      } else {
        uses.max = String(maxValue);
      }
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _getSpellsForFeature({ type, name, onlyLimitedUse = true }: { type: IActionTypes; name: string; onlyLimitedUse?: boolean }): any[] {
    const ddbData = this.ddbParser?.ddbData;
    if (!ddbData) return [];
    const spells = (ddbData.character.spells?.[type] ?? []).filter((s) => {
      if (onlyLimitedUse && !s.limitedUse) return false;
      const id = type === "class"
        ? DDBDataUtils.determineActualFeatureId(ddbData, s.componentId)
        : s.componentId;
      const lookupType = type === "class" ? "classFeature" : type;
      const lookup = SpellDataUtils.getDDBSpellLookup(ddbData, lookupType, id);
      // DDB feature names carry curly apostrophes ("Paladin’s Smite"); enrichers use straight ones
      return lookup?.name !== undefined && utils.nameString(lookup.name) === utils.nameString(name);
    });
    return spells;
  }

  _getSpellUsesWithSpent({ type, name, max = null, defaultSpent = null, period = "", formula = null, override = null }: { type: IActionTypes; name: string; max?: string | null; defaultSpent?: number | null; period?: TLimitedUsePeriod; formula?: string | null; override?: boolean | null }): I5eSystemLimitedUses {
    const spells = this._getSpellsForFeature({ type, name });
    const system = this.ddbParser?.data?.system;

    const uses: I5eSystemLimitedUses = spells.length > 0
      ? SpellDataUtils.getUses(spells[0].limitedUse)
      : foundry.utils.deepClone(system && "uses" in system ? system.uses ?? {} : {});

    if (spells.length === 0) {
      logger.warn(`No spells found for feature ${name} of type ${type}`);
      // Preserve the feature's existing uses when DDB supplies no charge pool.
      // Explicit defaults still apply, including the recovery configured below.
      if (defaultSpent !== null) uses.spent = defaultSpent;
      if (max !== null) uses.max = max;
    }

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: "recoverAll", formula: undefined }];
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _buildDamagePartsWithBase(): any[] {
    const original = this.ddbEnricher.originalActivity;

    const base = foundry.utils.deepClone(this.data.system.damage.base);
    const parts = foundry.utils.deepClone((foundry.utils.getProperty(original ?? {}, "damage.parts") as I5eDamagePart[]) ?? []);
    return [base, ...parts];
  }


  /**
   * The dnd5e identifier of the document this enricher builds, as an `item.identifier` filter for a
   * rule that should only touch rolls made with this feature or item. The parsers settle the
   * identifier only after effects are built (a renamed monster feature, an enricher's own
   * `identifier`), so the filter carries `ChangeHelper.SELF_IDENTIFIER` and the factory resolves it at
   * cleanup.
   */
  get selfIdentifierFilter(): IEffectChangeFilter {
    return { k: "item.identifier", o: "exact", v: ChangeHelper.SELF_IDENTIFIER };
  }

  /**
   * The identifier `selfIdentifierFilter` resolves to when the finished document has none: the
   * parser's, else the slug of the original DDB name.
   */
  get fallbackSelfIdentifier(): string {
    const parserIdentifier = (this.ddbParser as { identifier?: string } | undefined)?.identifier;
    return parserIdentifier
      ?? utils.referenceNameString(`${this.ddbParser?.originalName ?? this.data.name}`.toLowerCase());
  }

  /**
   * An `item.sourceItem` filter matching spells cast from this item: dnd5e stamps the spell it
   * caches for a Cast activity with `system.sourceItem` set to `<item type>:<item identifier>`, so
   * the rule skips the same spells cast from another item or from a spell slot.
   */
  get castFromSelfFilter(): IEffectChangeFilter {
    return { k: "item.sourceItem", o: "exact", v: `${this.data.type}:${ChangeHelper.SELF_IDENTIFIER}` };
  }

  /**
   * Scopes a rule to rolls made with this document, and with `activityName` also to that one
   * activity (dnd5e copies the activity's own fields, `name` included, into `activity.*`).
   */
  selfActivityFilter(activityName?: string): IEffectChangeFilter[] {
    const filters = [this.selfIdentifierFilter];
    if (activityName) filters.push({ k: "activity.name", o: "exact", v: activityName });
    return filters;
  }

  /**
   * A passive (transfer) effect carrying dnd5e 6.1 damage application rules, or nothing when
   * `changes` is empty, which is always the case before 6.1 (`ChangeHelper.damageApplicationChanges`
   * returns no changes there), so 6.0 never gets an empty effect.
   *
   * `summon` makes it the summoned creature's instead: dnd5e copies a summon activity's linked
   * effects onto the creature it summons, and rules only reach the actor that rolls, so a rule on
   * the summoner never touches the companion's damage. The effect is then not transferred, links
   * to the named summon activities, and applies from summoner level `summon.minLevel`. `id` fixes
   * the effect id, for an activity that lists its effects itself.
   */
  static damageRuleEffect(
    name: string,
    changes: IActiveEffectChangeData[],
    { description, disabled = false, summon, id }: {
      description?: string;
      disabled?: boolean;
      summon?: { activities: string[]; minLevel?: number | null };
      id?: string;
    } = {},
  ): IDDBEffectHint[] {
    if (changes.length === 0) return [];
    return [{
      name,
      options: {
        transfer: !summon,
        disabled,
        ...(description ? { description } : {}),
      },
      changes,
      ...(summon ? { activitiesMatch: summon.activities } : {}),
      ...(summon || id
        ? {
          data: {
            ...(id ? { _id: id } : {}),
            ...(summon
              ? { flags: { ddbimporter: { effectIdLevel: { min: summon.minLevel ?? null, max: null } } } }
              : {}),
          },
        }
        : {}),
    }];
  }

  /**
   * A passive effect for damage that "ignores Resistance and Immunity" to `damageTypes` (`"ALL"`
   * for any type), or only Resistance with `immunity: false`, limited to rolls matching
   * `conditions`. Nothing before dnd5e 6.1, as for `damageRuleEffect`.
   */
  static ignoreDamageReductionEffect(
    name: string,
    damageTypes: string | string[],
    { immunity = true, conditions, description }: {
      immunity?: boolean;
      conditions?: IEffectChangeFilter | IEffectChangeFilter[];
      description?: string;
    } = {},
  ): IDDBEffectHint[] {
    const options = conditions ? { conditions } : {};
    return DDBEnricherData.damageRuleEffect(name, [
      ...ChangeHelper.ignoreResistanceChanges(damageTypes, options),
      ...(immunity ? ChangeHelper.ignoreImmunityChanges(damageTypes, options) : []),
    ], { description });
  }

  /** True when this dnd5e version can apply damage application rules (6.1+). */
  static get hasDamageRules(): boolean {
    return ChangeHelper.damageApplicationChanges("resistance", "ALL").length > 0;
  }

  static allDamageTypes(exclude: string[] = []): string[] {
    return DICTIONARY.actions.damageType
      .filter((d) => d.name !== null)
      .map((d) => d.name)
      .filter((d: string) => !exclude.includes(d));
  }

  static basicDamagePart({
    number = null, denomination = null, type = null, types = [], bonus = "", scalingMode = "whole",
    scalingNumber = 1, scalingFormula = "", customFormula = null, modifiers = [],
  }: IDDBBasicDamage = {}): I5eDamagePart {
    return {
      number,
      denomination,
      bonus,
      types: type ? [type] : types,
      custom: {
        enabled: customFormula !== null,
        // dnd5e's FormulaField coerces null to "" so this is output equivalent
        formula: customFormula ?? "",
      },
      // omitted when empty so unmodified parts keep their existing shape
      ...(modifiers.length > 0 ? { modifiers } : {}),
      scaling: {
        mode: scalingMode,
        number: scalingNumber,
        formula: `${scalingFormula}`,
      },
    };
  }

  /**
   * Activity data for a form-mode transform ("Select Form"): the actor keeps its own stats and the
   * forms are the effects linked to the activity by `activityMatch`, in hint order, the first being
   * the default. `formless` adds a "No Form" choice that removes every applied form. Profiles and
   * settings are written out empty because form mode never reads them. Duration is left to the
   * caller: a form effect is cloned straight onto the actor, so it carries its own duration.
   */
  static formTransformData({ formless = true }: { formless?: boolean } = {}): Partial<I5eTransformActivity> {
    return {
      profiles: [],
      settings: null,
      transform: { mode: "form", formless, customize: false, preset: "" },
    };
  }

  // DDB sheet instructions are now stripped centrally in DDBFeatureMixin.getDescription,
  // so this is only needed for notes whose phrasing is not in DDB_SHEET_NOTE_MARKERS.
  static stripBuilderNote(html: string, builderNote = "Character Builder"): string {
    return utils.stripNoteBlocks(html, [builderNote]);
  }

  get useMidiAutomations(): boolean {
    if (!DDBEnricherData.AutoEffects.effectModules().midiQolInstalled) return false;
    return this.ddbParser.useMidiAutomations ?? false;
  }

  get featureType(): string | undefined {
    return foundry.utils.getProperty(this.data, "flags.ddbimporter.type") as string | undefined;
  }

  get type(): IDDBActivityType | null {
    return null;
  }

  get data(): any {
    return this.ddbEnricher.ddbParser.data;
  }

  /** The class level DDB gives this feature (`requiredLevel`), or `fallback` when it has none. */
  featureLevel(fallback: number): number {
    const level = parseInt(String(foundry.utils.getProperty(this.ddbParser.ddbDefinition ?? {}, "requiredLevel")));
    return Number.isInteger(level) && level > 0 ? level : fallback;
  }

  /**
   * A Modify Item advancement applying this document's enchantment `effectId` to the actor's items
   * with `identifiers`, for the compendium path (level-up or a dropped item), where dnd5e runs it.
   * The effect must be a non-transfer enchantment on this document that no activity applies
   * (`modifyItemEffectFlags`).
   */
  modifyItemAdvancement({ id, name, level, effectId, identifiers }: {
    id: string;
    name: string;
    level: number;
    effectId: string;
    identifiers: string[];
  }): I5eAdvancement {
    return AdvancementBuilder.buildModifyItem({
      id,
      name,
      level,
      changes: [{ effectId, identifiers }],
    });
  }

  /** Effect flags for an enchantment only a Modify Item advancement applies: no activity links it. */
  static modifyItemEffectFlags(): { ddbimporter: { noeffect: boolean } } {
    return { ddbimporter: { noeffect: true } };
  }

  /**
   * A copy of an enchantment hint for a Modify Item advancement, under its own `_id` and linked to
   * no activity, for a feature whose enchant activity applies the same enchantment on a character
   * import. The advancement must never point at an effect an activity also applies.
   */
  static modifyItemEffectCopy(effect: IDDBEffectHint, id: string): IDDBEffectHint {
    const { activityMatch: _match, activitiesMatch: _matches, activityTypesMatch: _types, ...rest } = effect;
    return {
      ...rest,
      data: {
        ...foundry.utils.deepClone(effect.data ?? {}),
        _id: id,
        flags: DDBEnricherData.modifyItemEffectFlags(),
      },
    };
  }

  /**
   * `flags` pointing a feature-held scale value at one class's level. Without an advancement root
   * dnd5e reads such a scale against the character's total level, which overshoots on a
   * multiclass. Empty when the class is not on the character, as in the muncher.
   */
  classAdvancementRootFlags(className: string): { dnd5e?: { advancementRoot: string } } {
    const klass = this.ddbParser?.ddbCharacter?.raw?.classes?.find((entry) => entry.name === className);
    return klass?._id ? { dnd5e: { advancementRoot: klass._id } } : {};
  }

  /**
   * The spell's own duration without concentration, for a duplicated follow-up activity (a
   * region's ongoing save, a transformation used again later). Using an activity whose duration
   * concentrates begins concentration again, ending the spell's; an instantaneous duration avoids
   * that but gives any effect it applies no length, since dnd5e hands a linked effect with no
   * expiry of its own the activity's duration. Built activities get the same through the
   * `noConcentration` build option.
   */
  get followUpDuration(): I5eActivityDuration {
    const duration = (this.data?.system?.duration ?? {}) as I5eSystemDurationData;
    return { ...foundry.utils.deepClone(duration), concentration: false, override: true };
  }

  get activity(): IDDBActivityData | null {
    return null;
  }

  get summonsFunction(): ((data: ICompanionData) => Promise<ICompanionResult>) | null {
    return null;
  }

  get generateSummons(): boolean {
    return false;
  }

  get effects(): IDDBEffectHint[] {
    return [];
  }

  get override(): IDDBOverrideData | null {
    return null;
  }

  get additionalActivities(): Partial<IDDBAdditionalActivity>[] | null {
    return null;
  }

  get additionalAdvancements(): I5eAdvancement[] {
    return [];
  }

  get documentStub(): IDDBDocumentStub | null {
    return null;
  }

  get usesOnActivity(): boolean {
    return false;
  }

  get clearAutoEffects(): boolean {
    return false;
  }

  /**
   * Drops only the status effect the item parser builds from a condition its description names,
   * which links to every activity without effects of its own. Unlike clearAutoEffects, the effects
   * DDB's own modifiers grant the wielder (bonuses, resistances, languages) are kept.
   */
  get clearAutoStatusEffect(): boolean {
    return false;
  }

  get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  get addAutoAdditionalActivities(): boolean {
    return true;
  }

  /**
   * An enricher that authors `additionalActivities` normally replaces the save and check
   * activities the parser builds from the description. Return true when the enricher's activities
   * sit beside those, not instead of them: a lair-action list gaining a terrain placer still
   * needs each of its parsed saves.
   */
  get keepParsedActivities(): boolean {
    return false;
  }

  get builtFeaturesFromActionFilters(): any[] {
    return [];
  }

  get stopDefaultActivity(): boolean {
    return false;
  }

  get parseAllChoiceFeatures(): boolean {
    return false;
  }

  /**
   * Suppress the per-choice child features, keeping the options as description text on the
   * parent. The class-scoped equivalent of NO_CHOICE_BUILD, for names that are shared between
   * classes and so cannot be listed there (e.g. Gunslinger vs Fighter "Maneuvers").
   */
  get noChoiceBuild(): boolean {
    return false;
  }

  /**
   * When a lone chosen option merges into a parent that already has activities, append the
   * option's activities instead of dropping them, skipping any whose name the parent already
   * carries. For parents whose enricher builds the primary activity itself but still wants
   * DDB's per-option actions beside it (Semblance of Life's spirit-form attacks).
   */
  get mergeChoiceActivities(): boolean {
    return false;
  }

  /**
   * Refuse the option modifiers that DDBFeatureMixin._suppressedChoiceModifiers would otherwise
   * carry onto this feature, for a parent whose enricher automates those options itself. Order of
   * the Lycan: Improved Predatory Strikes/Stalker's Prowess.
   */
  get noSuppressedChoiceModifiers(): boolean {
    return false;
  }

  get itemMacro(): IDDBItemMacro | null {
    return null;
  }

  get setMidiOnUseMacroFlag(): IDDBSetMidiOnUseMacroFlag | null {
    return null;
  }

  get combineGrantedDamageModifiers(): boolean {
    return false;
  }

  get combineDamageTypes(): boolean {
    return false;
  }

  async customFunction(_options: ICustomFunctionOptions = { name: null, activity: null }): Promise<void> {
    // noop
  }

  async cleanup(_options: any = {}): Promise<void> {
    // noop
  }

  /**
   * Removes hand-built activities that copy a spell the item also casts. Item spells become cast
   * activities after the enricher's own activities are built, so call this from cleanup(). A spell
   * missing from the spells compendium gets no cast, and the hand-built activity then stays.
   */
  removeActivitiesCopiedByCast(copies: { spell: string; matches: (activity: I5eActivity) => boolean }[]): void {
    const activities = (this.data?.system?.activities ?? {}) as Record<string, I5eActivity>;
    // cast activities are named "<Spell> (<Item>)", with " (Legacy)" on 2014 spells
    const castNames = Object.values(activities).filter((a) => a.type === "cast").map((a) => a.name ?? "");
    for (const { spell, matches } of copies) {
      if (!castNames.some((name) => name === spell || name.startsWith(`${spell} (`))) continue;
      for (const [id, activity] of Object.entries(activities)) {
        if (activity.type !== "cast" && matches(activity)) delete activities[id];
      }
    }
  }

  get ddbMacroDescriptionData(): IDDBMacroDescriptionData | null {
    return null;
  }

  /** Disables parser-generated versatile activities and conditional attack modes. */
  get noVersatile(): boolean {
    return false;
  }

  get choiceComponentFeatureName(): string | null {
    return null;
  }

  get identifier(): string | null {
    return null;
  }

}
