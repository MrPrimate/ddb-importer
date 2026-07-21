import type DDBCharacter from "../parser/DDBCharacter";

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export {};

// Bridge custom hooks into the configuration HookConfig.
// fvtt-types resolves HookName = keyof HookConfig.HookConfig where HookConfig
// is `import { Hooks as HookConfig } from "#configuration"`. The Hooks namespace
// comes from `export * as Hooks from "./hooks.mjs"` in configuration/index.d.mts.
// We augment the source module so the interface merge reaches the correct type.
declare module "fvtt-types/configuration" {
  namespace Hooks {
    interface HookConfig {
      // ---- Foundry core hooks not in the fvtt-types registry ----
      // client/canvas/placeables/note.mjs
      "activateNote": (note: any, options: Record<string, any>) => boolean | void;
      // client/hooks.mjs
      "applyActiveEffect": (actor: Actor.Implementation, change: any, current: any, delta: any, changes: Record<string, unknown>) => void;

      "dropCanvasData": (canvas: Canvas, data: Record<string, unknown>, event: Event) => boolean | void;
      // ---- Dynamic per-class render hooks ----
      // Foundry AppV1/AppV2 emit render<Class> hooks named after each sheet
      // class. registerSheets.ts registers `render${sheetName}` where sheetName
      // comes from CONFIG.Actor.sheetClasses at runtime, so the names cannot be
      // statically enumerated. This template-literal index signature lets those
      // computed hook names type check.
      [key: `render${string}`]: (...args: any[]) => unknown;

      // ---- Explicit close hooks we register ----
      "closeDocumentSheetV2": (sheet: foundry.applications.api.DocumentSheetV2) => void;

      // ---- Explicit get hooks we register ----
      // Scene navigation / directory context menus (extendSceneNavigationContext)
      "getSceneNavigationContext": (html: any, options: any[]) => void;
      "getSceneContextOptions": (html: any, options: any[]) => void;
      "getSceneDirectoryEntryContext": (html: any, options: any[]) => void;
      "getSceneControlButtons": (controls: any) => void;
      // Journal sheet header buttons/controls
      "getJournalSheet5eHeaderButtons": (config: any, buttons: any[]) => void;
      "getHeaderControlsJournalEntrySheet": (config: any, buttons: any[]) => void;
      // Item sheet header buttons/controls
      "getItemSheet5eHeaderButtons": (config: any, buttons: any[]) => void;
      "getHeaderControlsDocumentSheetV2": (config: any, buttons: any[]) => void;
      // Item / compendium context menus (tattoo compendiumContext)
      "getItemContextOptions": (app: any, options: any[]) => void;
      "getCompendiumEntryContext": (app: any, options: any[]) => void;
      "getItemDirectoryEntryContext": (app: any, options: any[]) => void;
      // Actor sheet header buttons/controls and context menus
      "getHeaderControlsActorSheetV2": (config: any, buttons: any[]) => void;
      "getHeaderControlsBaseActorSheet": (config: any, buttons: any[]) => void;
      "getActorSheet5eHeaderButtons": (config: any, buttons: any[]) => void;
      "getActorSheetHeaderButtons": (config: any, buttons: any[]) => void;
      "getActorContextOptions": (html: any, options: any[]) => void;
      "dae.addSpecialDurations": (daeSpecialDurations: Record<string, string>) => void;
      "dae.setFieldData": (fieldData: Record<string, string[]>) => void;
      "dae.addAutoFields": (addAutoFields: Function, fields: { BooleanFormulaField?: any }) => void;
      "dae.ready": (api: any) => void;
      "dae.setupComplete": (api: any) => void;
      "dnd5e.activityConsumption": (activity: Activity, usageConfig: ActivityUseConfiguration, messageConfig: RollMessageConfig, updates: unknown) => boolean | void;
      "dnd5e.applyDamage": (actor: Actor.Implementation, amount: number, options: DamageApplicationOptions) => void;
      "dnd5e.calculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => boolean | void;
      "dnd5e.postAbilityCheckRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postAttackRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postBuildSkillRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildAbilityCheckRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildSavingThrowRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildDeathSaveRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postBuildToolRollConfig": (process: RollProcessConfig, config: BasicRollConfig, index: number) => void;
      "dnd5e.postSavingThrowRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postSkillRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.postToolRollConfiguration": (rolls: Roll[], config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      // According to dnd5e createdTokens is a Token[], but it is actually a TokenDocument[]
      "dnd5e.postSummon": (activity: Activity, profile: unknown, tokens: TokenDocument.Implementation[], options: unknown) => void;
      "dnd5e.postUseActivity": (activity: Activity, usageConfig: ActivityUseConfiguration, results: unknown) => boolean;
      "dnd5e.postUseLinkedSpell": (activity: Activity, usageConfig: ActivityUseConfiguration, results: unknown) => void;
      "dnd5e.preActivityConsumption": (activity: Activity, usageConfig: ActivityUseConfiguration, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preApplyDamage": (actor: Actor.Implementation, amount: number, updates: Actor.UpdateData, options: DamageApplicationOptions) => boolean | void;
      "dnd5e.preCalculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => boolean | void;
      "dnd5e.preConfigureInitiative": (actor: Actor.Implementation, rollConfig: { data: AnyMutableObject; parts: string[]; options: D20RollOptions }) => void;
      "dnd5e.preCreateActivityTemplate": (activity: Activity, templateData: MeasuredTemplateDocument.CreateData) => boolean | void;
      "dnd5e.preRollAbilityCheck": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollAttack": (rollConfig: RollProcessConfig & { attackMode: string }, dialogConfig: RollDialogConfig, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preRollAttackV2": (rollConfig: RollProcessConfig & { attackMode: string }, dialogConfig: RollDialogConfig, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preRollConcentration": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDamage": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDamageV2": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDeathSave": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollSavingThrow": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollSkill": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollTool": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preSummonToken": (activity: Activity, profile: unknown, config: object, options: unknown) => boolean | void;
      "dnd5e.preUseActivity": (activity: Activity, usageConfig: AnyMutableObject, dialogConfig: AnyMutableObject, messageConfig: AnyMutableObject) => boolean | void;
      "dnd5e.restCompleted": (actor: Actor.Implementation, result: { longRest: boolean; newDay: boolean }, config: unknown) => void;
      "dnd5e.rollAttack": (rolls: Roll[], data: { subject: Activity | null; ammoUpdate: { id: string; destroy: boolean; quantity: number } | null }) => void;
      "dnd5e.rollConcentration": (rolls: Roll[], data: { subject?: Actor.Implementation }) => void;
      "dnd5e.rollDamage": (rolls: Roll[], data?: { subject?: Activity }) => void;
      "dnd5e.rollDeathSave": (rolls: Roll[], data: { chatString: string; updates: Actor.UpdateData; subject: Actor.Implementation }) => boolean | void;
      "dnd5e.summonToken": (activity: Activity, profile: unknown, tokenData: object, options: unknown) => void;
      "dnd5e.transformActorV2": (host: unknown, source: unknown, data: object, settings: object, options: object) => void;
      // dnd5e emits this for item sheets/context menus
      "dnd5e.getItemContextOptions": (item: Item.Implementation, options: Record<string, any>[]) => void;
      "midi-qol.ConfigSettingsChanged": () => void;
      "midi-qol.RollComplete": (workflow: Workflow) => Promise<void>;
      "midi-qol.dnd5ePreCalculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => boolean | void;
      "midi-qol.dnd5eCalculateDamage": (actor: Actor.Implementation, damages: DamageDescription[], options: DamageApplicationOptions) => void;
      "midi-qol.preItemRoll": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.preAttackRoll": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.preAttackRollConfig": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.AttackRollComplete": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.DamageRollComplete": (workflow: Workflow) => Promise<void | boolean>;
      "midi-qol.StatsUpdated": () => void;
      "midi-qol.addUndoEntry": (data: UndoData) => void;
      "midi-qol.midiReady": () => void;
      "midi-qol.ready": () => void;
      "midi-qol.removeUndoEntry": (data?: UndoData) => void;
      "midi-qol.setup": (data: typeof globalThis.MidiQOL) => void;
      "midi-qol.targeted": (targets: Set<Token.Implementation> | undefined) => void;
      "midi-qol.dependentsRegistryChanged": (event: RegistryChangeEvent) => void;
      "midi-qol-setup-wizard.launch": () => void;
      "getHeaderControlsActivitySheet": (app: foundry.applications.api.Application /* dnd5e.applications.activity.activitySheet */, buttons: any[]) => void;
      "tidy5e-sheet.ready": (api: any) => void;
      "simplecover5eReady": () => void;
      "tokenizer-2.registerFrames": (registry: any) => void;
      // ddb importer
      "ddb-importer.monsterAddToCompendiumComplete": (data: { actor: Actor.Implementation | null }) => void;
      "ddb-importer.spellsCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.classCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.subclassCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.raceCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.summonsCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.featsCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.monstersCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.traitCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.customCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.itemsCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.backgroundCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.featuresCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.vehiclesCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.inventoryCompendiumUpdateComplete": (data: { results: Item.Implementation[] | null }) => void;
      "ddb-importer.tablesCompendiumUpdateComplete": (data: { results: Table.Implementation[] | null }) => void;
      "ddb-importer.characterProcessDataComplete": (data: { actor: TImporterActor; ddbCharacter: DDBCharacter }) => void;
      "ddb-importer.compendiumCreationComplete": (data: { compendiums: string[] }) => void;
      "ddb-importer.preCreateTattooFromSpell": (spell: TImporterItem, config: SpellTattooConfiguration) => boolean | void;
      "ddb-importer.createTattooFromSpell": (spell: TImporterItem, spellTattooData: object, config: SpellTattooConfiguration) => void;
    }
  }
}
