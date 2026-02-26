import { DICTIONARY } from "../../../config/_module";
import { logger } from "../../../lib/_module";
import { DDBDataUtils } from "../../lib/_module";
import CharacterSpellFactory from "../../spells/CharacterSpellFactory";
import DDBSpell from "../../spells/DDBSpell";
import { AutoEffects, ChangeHelper } from "../effects/_module";

import type {
  IDDBActivityData,
  IDDBAdditionalActivity,
  IDDBDamagePart,
  IDDBDocumentStub,
  IDDBEffectHint,
  IDDBItemMacro,
  IDDBMacroDescriptionData,
  IDDBOverrideData,
  IDDBSetMidiOnUseMacroFlag,
} from "./types";

export default class DDBEnricherData {

  static META_DATA: Record<string, any> = {};

  static AutoEffects = AutoEffects;

  static ChangeHelper = ChangeHelper;

  ddbEnricher: any;
  ddbParser: any;
  is2014: boolean;
  is2024: boolean;
  useLookupName: any;
  activityGenerator: any;
  effectType: any;
  document: any;
  name: string;
  isCustomAction: any;
  manager: any;

  constructor({ ddbEnricher }: { ddbEnricher: any }) {
    this.ddbEnricher = ddbEnricher;
    this.ddbParser = ddbEnricher.ddbParser;
    this.is2014 = ddbEnricher.is2014;
    this.is2024 = ddbEnricher.is2024;
    this.useLookupName = ddbEnricher.useLookupName;
    this.activityGenerator = ddbEnricher.activityGenerator;
    this.effectType = ddbEnricher.effectType;
    this.document = ddbEnricher.document;
    this.name = ddbEnricher.name;
    this.isCustomAction = ddbEnricher.isCustomAction;
    this.manager = ddbEnricher.manager;
  }

  getFeatureActionsName({ type = null }: { type?: string | null } = {}): any {
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

  get isAction(): boolean {
    return this.ddbParser.isAction ?? false;
  }

  isClass(name: string): boolean {
    return this.ddbParser.klass === name;
  }

  isSubclass(name: string): boolean {
    return this.ddbParser.subKlass === name || this.ddbParser.subClass === name;
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

  hasAction({ name, type }: { name: string; type: string }): any {
    return this.ddbParser?.ddbData?.character.actions[type].find((a: any) =>
      a.name === name,
    );
  }

  _getSpentValue(type: string, name: string, matchSubClass: string | null = null, includesName = false): number | null {
    const spent = this.ddbParser?.ddbData?.character.actions[type].find((a: any) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId)?.definition.name === matchSubClass),
    )?.limitedUse?.numberUsed ?? null;
    return spent;
  }

  _getMaxValue(type: string, name: string, matchSubClass: string | null = null, includesName = false): number | null {
    const max = this.ddbParser?.ddbData?.character.actions[type].find((a: any) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId)?.definition.name === matchSubClass),
    )?.limitedUse?.maxUses ?? null;
    return max;
  }

  _getGeneratedUses({ type, name, matchSubClass = null, scaleLink = null, includesName = false }: { type: string; name: string; matchSubClass?: string | null; scaleLink?: any; includesName?: boolean } = { type: "", name: "" }): I5eSystemLimitedUses {
    const action = this.ddbParser?.ddbData?.character.actions[type].find((a: any) =>
      (includesName ? a.name.includes(name) : a.name === name)
    && (matchSubClass === null
      || DDBDataUtils.findSubClassByFeatureId(this.ddbParser.ddbData, a.componentId)?.definition.name === matchSubClass),
    );

    const uses: I5eSystemLimitedUses = DDBDataUtils.getLimitedUses({
      data: action.limitedUse,
      description: action.description,
      scaleValue: scaleLink
        ?? (this.ddbParser.useUsesScaleValueLink && this.ddbParser.scaleValueUsesLink
          ? this.ddbParser.scaleValueUsesLink
          : null),
    });
    return uses;
  }

  _getUsesWithSpent({ type, name, max, defaultSpent = null, period = "", formula = null, override = null, matchSubClass = null, includesName = false }: { type: string; name: string; max: any; defaultSpent?: number | null; period?: string; formula?: string | null; override?: any; matchSubClass?: string | null; includesName?: boolean } = { type: "", name: "", max: null }): any {
    const uses: any = {
      spent: this._getSpentValue(type, name, matchSubClass, includesName) ?? defaultSpent,
      max,
    };

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: 'recoverAll', formula: undefined }];
    }

    if (!max) {
      uses.max = this._getMaxValue(type, name, matchSubClass, includesName);
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _getSpellsForFeature({ type, name, onlyLimitedUse = true }: { type: string; name: string; onlyLimitedUse?: boolean } = { type: "", name: "" }): any[] {
    const spells = this.ddbParser.ddbData.character.spells[type].filter((s: any) => {
      if (onlyLimitedUse && !s.limitedUse) return false;
      const id = type === "class"
        ? DDBDataUtils.determineActualFeatureId(this.ddbParser.ddbData, s.componentId)
        : s.componentId;
      const lookupType = type === "class" ? "classFeature" : type;
      const lookup = CharacterSpellFactory.getDDBSpellLookup(this.ddbParser.ddbData, lookupType, id);
      if (lookup.name === name) return true;
      return false;
    });
    return spells;
  }

  _getSpellUsesWithSpent({ type, name, max, defaultSpent = null, period = "", formula = null, override = null }: { type: string; name: string; max: any; defaultSpent?: number | null; period?: string; formula?: string | null; override?: any } = { type: "", name: "", max: null }): I5eSystemLimitedUses {
    const spells = this._getSpellsForFeature({ type, name });

    if (spells.length === 0) {
      logger.error(`No spells found for feature ${name} of type ${type}`);
      return {
        spent: defaultSpent,
        max,
        recovery: [],
      };
    }

    const uses: I5eSystemLimitedUses = DDBSpell.getUses(spells[0].limitedUse);

    if (formula) {
      uses.recovery = [{ period, type: "formula", formula }];
    } else if (period != "") {
      uses.recovery = [{ period, type: 'recoverAll', formula: undefined }];
    }

    if (override) {
      uses.override = true;
    }

    return uses;
  }

  _buildDamagePartsWithBase(): any[] {
    const original = this.ddbEnricher.originalActivity;

    const base = foundry.utils.deepClone(this.data.system.damage.base);
    const parts = foundry.utils.deepClone(original?.damage.parts ?? []);
    return [base, ...parts];
  }


  static allDamageTypes(exclude: string[] = []): string[] {
    return DICTIONARY.actions.damageType
      .filter((d: any) => d.name !== null)
      .map((d: any) => d.name)
      .filter((d: string) => !exclude.includes(d));
  }

  static basicDamagePart({
    number = null, denomination = null, type = null, types = [], bonus = "", scalingMode = "whole",
    scalingNumber = 1, scalingFormula = "", customFormula = null,
  }: {
    number?: number | null;
    denomination?: number | null;
    type?: string | null;
    types?: string[];
    bonus?: string;
    scalingMode?: string;
    scalingNumber?: number;
    scalingFormula?: string | number;
    customFormula?: string | null;
  } = {}): IDDBDamagePart {
    return {
      number,
      denomination,
      bonus,
      types: type ? [type] : types,
      custom: {
        enabled: customFormula !== null,
        formula: customFormula,
      },
      scaling: {
        mode: scalingMode as IDDBDamagePart["scaling"]["mode"],
        number: scalingNumber,
        formula: `${scalingFormula}`,
      },
    };
  }

  get useMidiAutomations(): boolean {
    if (!DDBEnricherData.AutoEffects.effectModules().midiQolInstalled) return false;
    return this.ddbParser.useMidiAutomations ?? false;
  }

  get featureType(): any {
    return foundry.utils.getProperty(this.data, "flags.ddbimporter.type");
  }

  get type(): string | null {
    return null;
  }

  get data(): any {
    return this.ddbEnricher.ddbParser.data;
  }

  get activity(): IDDBActivityData | null {
    return null;
  }

  get summonsFunction(): any {
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

  get additionalAdvancements(): object[] {
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

  get useDefaultAdditionalActivities(): boolean {
    return false;
  }

  get addToDefaultAdditionalActivities(): boolean {
    return false;
  }

  get addAutoAdditionalActivities(): boolean {
    return true;
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

  async customFunction(_options: any = {}): Promise<void> {
    // noop
  }

  async cleanup(_options: any = {}): Promise<void> {
    // noop
  }

  get ddbMacroDescriptionData(): IDDBMacroDescriptionData | null {
    return null;
  }

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
