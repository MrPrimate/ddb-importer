/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export {}

global {
  namespace Hooks {
    interface HookConfig {
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
      "dnd5e.preConfigureInitiative": (actor: Actor.Implementation, rollConfig: { data: AnyMutableObject, parts: string[], options: D20RollOptions }) => void;
      "dnd5e.preCreateActivityTemplate": (activity: Activity, templateData: MeasuredTemplateDocument.CreateData) => boolean | void;
      "dnd5e.preRollAbilityCheck": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollAttack": (rollConfig: RollProcessConfig & { attackMode: string }, dialogConfig: RollDialogConfig, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preRollAttackV2": (rollConfig: RollProcessConfig & { attackMode: string }, dialogConfig: RollDialogConfig, messageConfig: RollMessageConfig) => boolean | void;
      "dnd5e.preRollConcentration": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDamage": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollDeathSave": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollSavingThrow": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollSkill": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preRollTool": (config: RollProcessConfig, dialog: RollDialogConfig, message: RollMessageConfig) => boolean | void;
      "dnd5e.preUseActivity": (activity: Activity, usageConfig: AnyMutableObject, dialogConfig: AnyMutableObject, messageConfig: AnyMutableObject) => boolean | void;
      "dnd5e.restCompleted": (actor: Actor.Implementation, result: { longRest: boolean; newDay: boolean }, config: unknown) => void;
      "dnd5e.rollAttack": (rolls: Roll[], data: { subject: Activity | null, ammoUpdate: { id: string, destroy: boolean; quantity: number } | null }) => void;
      "dnd5e.rollConcentration": (rolls: Roll[], data: { subject?: Actor.Implementation }) => void;
      "dnd5e.rollDamage": (rolls: Roll[], data?: { subject?: Activity }) => void;
      "dnd5e.rollDeathSave": (rolls: Roll[], data: { chatString: string; updates: Actor.UpdateData; subject: Actor.Implementation }) => boolean | void;
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
      "getHeaderControlsActivitySheet": (app: foundry.applications.api.Application /*dnd5e.applications.activity.activitySheet*/ , buttons: any[]) => void;
      "tidy5e-sheet.ready": (api: any) => void;
      "simplecover5eReady": () => void;
      // ddb importer
      "ddb-importer.monsterAddToCompendiumComplete": [data: { actor: Actor5e | null }];
    }
  }
}
