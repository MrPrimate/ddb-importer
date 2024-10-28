/* eslint-disable no-empty-function */
/* eslint-disable class-methods-use-this */
import DDBEnricherMixin from "../DDBEnricherMixin.js";

export default class Example extends DDBEnricherMixin {

  get activity() {
    return {
      // THESE ARE ACTIvITY ADJUSTMENTS RAN EVERYWHERE
      name: "Activity Name", // if not type default"
      type: "utility", // activity type - if type is none, activity hit will be generally undefined
      parent: "name", // name of lookup parent if only applies to certain types, e.g. spells attached to items, this would be the item name
      noConsumeTargets: true, // remove any auto generated consumption targets
      addItemConsume: true, // add item consume
      itemConsumeValue: 2, // item consume value if not 1
      addScalingMode: "amount", // add scaling mode to item consume
      addScalingFormula: "1", // add scaling formula to item consume
      addActivityConsume: true, // add activity consume
      activityConsumeValue: 2, // activity consume value if not 1
      addActivityScalingMode: "amount", // add scaling mode to activity consume
      addActivityScalingFormula: "1", // add scaling formula to activity consume
      addSpellSlotConsume: true, // add spell slot consume
      spellSlotConsumeValue: 2, // spell slot consume value if not 1
      addSpellSlotScalingMode: "level", // add scaling mode to spell slot consume
      addSpellSlotScalingFormula: "2", // add scaling formula to spell slot consume
      additionalConsumptionTargets: [], // add additional consumption targets
      addConsumptionScalingMax: "", // enable consumption scaling and add max
      targetType: "self", // target type override
      rangeSelf: true, // set range self
      noTemplate: true, // remove target template
      overrideTemplate: true, // add override target template
      overrideRange: true, // add override range
      activationType: "special", // activation type
      activationCondition: "A string", // activation condition
      overrideActivation: true, // add override activation
      midiManualReaction: true, // add midi manual reaction
      flatAttack: "1", // flat attack value, sets flat attack for activity
      damageParts: [], // adds damage parts
      data: {}, // merge this ith activity data
      func: function() {}, // run this funciton passing in the activity as the only variable
      allowMagical: true, // allow magical restrictions
      // THESE ARE RUN OUTSIDE OF THE ENRICHER, and act as flags for other elemetns
      addSingleFreeUse: true, // duplicates activity and adds single free use consumption activity
      addSingleFreeRecoveryPeriod: "lr", // single free use recovery period.
    };
  }

  get additionalActivities() {
    return [];
  }

  get override() {
    return {
      noTemplate: true, // remove document template
      data: {}, // merge this with document data
      descriptionSuffix: "",
    };
  }

  get documentStub() {
    return {
      stopDefaultActivity: true, // prevents call of generate activity
      data: {}, // merged with document data
    };
  }

  get effect() {
    return {
      // THESE ARE EFFECT ADJUSTMENTS RAN EVERYWHERE
      noCreate: true, // don't create effect, use an auto generated one
      type: "enchant", // if effect base type does not match spell/feat etc
      name: "Effect Name", // override auto name generation
      data: {}, // merge with effect data
      changes: [], // merge with effect changes
      multiple: [], // nest this for multiple effects
      options: { // passed to the ddb effect generator
        description: "Effect Description", // add a description to effect
        durationSeconds: 60, // add duration seconds
        durationRounds: 10, // add duration rounds
      },
      magicalBonus: { // add magical bonus
        name: "Name",
        bonus: 1,
        bonusMode: "ADD",
        makeMagical: true,
      },
      statuses: [], // add status effects
      atlChanges: [], // adds atl changes if atl active
      tokenMagicChanges: [], // adds token magic changes
      midiChanges: [], // adds midi changes
      func: function() {}, // run this funciton passing in the activity as the only variable
      descriptionHint: "hint text", // adds enchantment description hint
      descriptionSuffix: "", // append to item description
      // outside enricher flags
      clearAutoEffects: true, // clear auto effects
    };
  }


}
