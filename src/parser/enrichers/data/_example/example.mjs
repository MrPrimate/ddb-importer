/* eslint-disable no-empty-function */
/* eslint-disable class-methods-use-this */
import DDBEnricherData from "../data/DDBEnricherData.mjs";

export default class Example extends DDBEnricherData {

  get type() {
    return "utility"; // activity type - if type is none, activity hit will be generally undefined
  }

  get activity() {
    return {
      // THESE ARE ACTIvITY ADJUSTMENTS RAN EVERYWHERE
      name: "Activity Name", // if not type default"
      type: "utility", // deprecated, use type() activity type - if type is none, activity hit will be generally undefined
      parent: "name", // name of lookup parent if only applies to certain types, e.g. spells attached to items, this would be the item name
      noConsumeTargets: true, // remove any auto generated consumption targets
      addItemConsume: true, // add item consume
      itemConsumeTargetName: "Item Name", // item consume target name
      itemConsumeValue: 2, // item consume value if not 1
      addScalingMode: "amount", // add scaling mode to item consume
      addScalingFormula: "1", // add scaling formula to item consume
      addActivityConsume: true, // add activity consume
      activityConsumeValue: 2, // activity consume value if not 1
      addActivityScalingMode: "amount", // add scaling mode to activity consume
      addActivityScalingFormula: "1", // add scaling formula to activity consume
      addSpellSlotConsume: true, // add spell slot consume (as a consumption target)
      removeSpellSlotConsume: true, // remove spell slot consume (for spells)
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
      removeDamageParts: true, // remove existing damage parts
      damageParts: [], // adds damage parts
      data: {}, // merge this with activity data
      func: function() {}, // run this funciton passing in the activity as the only variable
      allowMagical: true, // allow magical restrictions
      // THESE ARE RUN OUTSIDE OF THE ENRICHER, and act as flags for other elemetns
      addSingleFreeUse: true, // duplicates activity and adds single free use consumption activity
      addSingleFreeRecoveryPeriod: "lr", // single free use recovery period.
      additionalDamageIncludeBase: true, // items only, additional damage parsing should include base damage
      stopHealSpellActivity: true, // in spells prevents healing activity auto generation
      generateSummons: true, // during spell parsing will call the summonsFunction
      summonsFunction: () => {}, // summons function to call when generateSummons is true
      profileKeys: [], // array of summon profile keys to use
      summons: {}, // data to merge to summon config
      splitDamage: true, // used by the spell parser to split damage
    };
  }

  get additionalActivities() {
    return [
      // use a duplicate
      { duplicate: true, overrides: {} },
      // builds from a DDB action
      { action: { name: "Activity Name", type: "utility", rename: ["Save vs Frightened", "Cast"] }, id: "newID" },
      // build from scratch
      {
        constructor: {
          name: "Activity Name",
          type: "utility",
        },
        build: {
          // passed to the activity constructor for the type, varies depending on item.spell.feature etc
          generateActivation: true,
          generateTarget: true,
        },
        overrides: {
          // same as activity getter., e.g.
          noConsumeTargets: true,
          data: {},
        },
        id: "idhere", // an id to use if not an autogenerated one
      },
    ];
  }

  get override() {
    return {
      noTemplate: true, // remove document template
      data: {}, // merge this with document data
      descriptionSuffix: "",
      replaceActivityUses: true, // replaces activity target use with id of parent item (name in target field)
      // eslint-disable-next-line no-unused-vars
      func: ({ enricher }) => {}, // function to run
    };
  }

  get documentStub() {
    return {
      stopDefaultActivity: true, // prevents call of generate activity
      data: {}, // merged with document data
    };
  }

  get effects() {
    return [
      {
        noCreate: true, // don't create effect, use an auto generated one
        type: "enchant", // if effect base type does not match spell/feat etc
        name: "Effect Name", // override auto name generation
        data: {}, // merge with effect data
        changes: [], // merge with effect changes
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
        daeStackable: "noneName", // set stackable dae value
        daeSpecialDurations: [], // adds dae special durations
        midiChanges: [], // adds midi changes
        daeChanges: [], // adds dae changes
        midiProperties: {}, // adds midi properties to midi flags
        func: function() {}, // run this funciton passing in the activity as the only variable
        descriptionHint: "hint text", // adds enchantment description hint
        descriptionSuffix: "", // append to item description
        midiOnly: true, // only generate this effect if midi qol is installed
        activeAurasOnly: true, // only generate this effect if active auras is installed
        activityMatch: "Attack", // Match to this activity only
        activitiesMatch: ["Save"], // Match to only these activities
        macroChanges: { macroType: "item", macroName: "cloakOfDisplacement.js" }, // add macro change
        targetUpdateMacroChanges: [{}], // onTargetUpdate macro changes
        onUseMacroChanges: [{}], // onUse macro changes
        damageBonusMacroChanges: [{}], // damage bonus macro changes
        midiOptionalChanges: { // midi optional changes
          name: "deftStrike",
          data: {
            label: `${document.name} Additional Damage`,
            count: "turn",
            "damage.all": "@scale.monk.martial-arts",
            countAlt: "ItemUses.Ki",
            criticalDamage: "1",
          },
        },
      },
    ];
  }


  /**
   * Whether to clear auto generated effects.
   * If true, DDB will clear out effects auto generated before processing effect hints on the enricher.
   * @returns {boolean} Whether to clear auto generated effects.
   */
  get clearAutoEffects() {
    return true;
  }

  get addAutoAdditionalActivities() {
    return true;
  }

  get useDefaultAdditionalActivities() {
    return true;
  }

  get addToDefaultAdditionalActivities() {
    return true;
  }

  get itemMacro() {
    return {
      type: "item",
      name: "cloakOfDisplacement.js",
    };
  }

  // set midi on use macro flag
  get setMidiOnUseMacroFlag() {
    return {
      macroType: "item",
      macroName: "cloakOfDisplacement.js",
      triggerPoints: [],
    };
  }

  get stopDefaultActivity() {
    return true;
  }

}
