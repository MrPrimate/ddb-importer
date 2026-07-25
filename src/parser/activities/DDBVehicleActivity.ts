import { logger } from "../../lib/_module";
import DDBBasicActivity from "./DDBBasicActivity";

interface IDDBVehicleFeatureActivityCreate extends Omit<IDDBBasicActivityCreateOptions, "document" | "character"> {
  document: I5eVehicleItem;
  character?: I5eVehicleData | null;
}

export default class DDBVehicleActivity extends DDBBasicActivity {

  actionData: Record<string, any>;

  /** builder-shape view of the activity data while parts are being assembled */
  get buildData(): IActivityData {
    return this.data as IActivityData;
  }

  _init() {
    logger.debug(`Generating DDBVehicleActivity ${this.name ?? this.type ?? "?"} for ${this.actor?.name}`);
  }

  constructor({ type, name, ddbParent, nameIdPrefix = null, nameIdPostfix = null, id = null }: {
    type: IDDBActivityType;
    name?: string | null;
    ddbParent?: any;
    nameIdPrefix?: string | null;
    nameIdPostfix?: string | null;
    id?: string | null;
  }) {
    super({
      type,
      name,
      ddbParent,
      foundryFeature: ddbParent.data,
      nameIdPrefix,
      nameIdPostfix,
      actor: ddbParent.ddbVehicle.data,
      id,
    });

    this.actionData = ddbParent.actionData;

  }

  _generateSave({ saveOverride = null, dc = null, ability = null } = {}) {
    if (saveOverride) {
      this.buildData.save = saveOverride;
      return;
    }
    this.buildData.save = {
      ability: ability ? [ability] : [Object.keys(CONFIG.DND5E.abilities)[0]],
      dc: {
        calculation: "",
        formula: dc ?? "",
      },
    };
  }

  build({
    activationOverride,
    additionalTargets,
    attackData,
    chatFlavor,
    checkOverride = null,
    consumeActivity,
    consumeItem,
    criticalDamage,
    damageParts = [],
    damageScalingOverride,
    data,
    ddbMacroOverride,
    durationOverride,
    generateActivation = true,
    generateAttack = false,
    generateCheck = false,
    generateConsumption = true,
    generateDamage = false,
    generateDDBMacro = false,
    generateDescription = false,
    generateDuration = true,
    generateEffects = true,
    generateEnchant = false,
    generateHealing = false,
    generateRange = true,
    generateRoll = false,
    generateSave = false,
    generateSpell = false,
    generateSummon = false,
    generateTarget = true,
    generateUses,
    healingChatFlavor,
    healingPart = null,
    img,
    includeBaseDamage = true,
    noeffect,
    noManualActivation,
    onSave,
    rangeOverride,
    rollOverride,
    saveOverride,
    spellOverride,
    targetOverride,
    usesOverride,
    consumptionOverride = null,
    saveData = {},
  }: IDDBVehicleActivityBuild = {}) {

    this._generateSave(foundry.utils.mergeObject({
      saveOverride,
    }, saveData));

    // override set to false on object if overriding

    logger.debug(`Generating Activity for ${this.ddbParent?.name}`, {
      damageParts,
      healingPart,
      generateActivation,
      generateAttack,
      generateConsumption,
      generateDamage,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave,
      generateTarget,
      includeBaseDamage,
      generateCheck,
      checkOverride,
      generateDDBMacro,
      generateRoll,
      generateSummon,
      consumptionOverride,
      saveOverride,
      saveData,
      this: this,
    });

    super.build({
      generateActivation,
      generateAttack,
      generateSpell,
      generateConsumption,
      generateCheck,
      generateDamage,
      generateDescription,
      generateDuration,
      generateEffects,
      generateHealing,
      generateRange,
      generateSave: false,
      generateTarget,
      generateDDBMacro,
      generateEnchant,
      generateRoll,
      generateSummon,
      healingChatFlavor,
      generateUses,
      chatFlavor,
      onSave,
      noeffect,
      spellOverride,
      rollOverride,
      targetOverride,
      checkOverride,
      rangeOverride,
      activationOverride,
      noManualActivation,
      durationOverride,
      img,
      ddbMacroOverride,
      usesOverride,
      additionalTargets,
      consumeActivity,
      consumeItem,
      saveOverride,
      data,
      attackData,
      includeBaseDamage,
      criticalDamage,
      damageScalingOverride,
      healingPart,
      damageParts,
    });


  }

  static async createActivity({ document, type, name, character }: IDDBVehicleFeatureActivityCreate, options: Record<string, any> = {}): Promise<string> {
    const activity = new DDBVehicleActivity({
      name: name ?? null,
      type,
      foundryFeature: document,
      actor: character,
    } as ConstructorParameters<typeof DDBVehicleActivity>[0]);

    activity.build(options);
    foundry.utils.setProperty(document, `system.activities.${activity.data._id}`, activity.data);

    // _generateDataStub always assigns data._id in the constructor
    return activity.data._id ?? "";

  }

}
