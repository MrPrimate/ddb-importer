import DICTIONARY from "../../dictionary.js";
import DDBHelper from "../../lib/DDBHelper.js";
import utils from "../../lib/utils.js";
import logger from "../../logger.js";
import DDBBaseFeature from "./DDBBaseFeature.js";

export default class DDBAction extends DDBBaseFeature {

  static SKIPPED_ACTIONS = [
    // weapon properties
    "Cleave",
    "Graze",
    "Nick",
    "Push",
    "Sap",
    "Slow",
    "Topple",
    "Vex",
    // others
    "Activate Large Form",
    "Assume Unbreakable Majesty",
    "Bardic Damage",
    "Bardic Inspiration: Agile Strikes",
    "Beguiling Magic: Regain Use",
    "Brew Poison",
    "Channel Divinity: Divine Spark",
    "Channel Divinity: Guided Strike (Benefit Ally)",
    "Channel Divinity: Guided Strike (Self)",
    "Channel Divinity: Invoke Duplicity",
    "Channel Divinity: Sear Undead",
    "Channel Divinity: Turn Undead",
    "Channel Divinity: War God's Blessing",
    "Charge Attack",
    "Divine Strike",
    "Enhanced Dual Wielding",
    "Evergreen Wildshape",
    "Form of the Beast: Tail (reaction)",
    "Free Casting",
    "Ghostly Gaze",
    "Improved Dash",
    "Invoke Duplicity: Cast Spells",
    "Invoke Duplicity: Distract",
    "Invoke Duplicity: Move Illusion",
    "Invoke Duplicity: Shared Distraction",
    "Lay On Hands: Heal",
    "Leave Druidic Message",
    "Moonlight Step: Regain Uses",
    "Nature Magician",
    "Polearm Master - Opportunity Attack",
    "Psychic Blades: Attack (STR)",
    "Psychic Blades: Bonus Attack (DEX)",
    "Psychic Blades: Bonus Attack (STR)",
    "Rage (Instinctive Pounce)",
    "Rage: Regain Expended Uses",
    "Rage: Relentless Rage",
    "Rage: Teleport",
    "Reactive Spell",
    "Sacred Weapon: Imbue Weapon",
    "Shift",
    "Summon Wildfire Spirit: Command",
    "War Priest: Bonus Attack",
    "Wild Magic Surge table",
    "Wild Shape: Circle Forms",
    "Wild Shape: Improved Lunar Radiance",
    // "Lay On Hands: Purify Poison",
    // "Mantle of Majesty",
    // "Unbreakable Majesty",
    "Manifest Wrath of the Sea",
    "Grant Wrath of the Sea",
    "Superiority Dice",
    "Blink Steps",
    "Second Wind: Tactical Shift",
    "Stonecunning (Tremorsense)",
    "Luck Points",
    "Psionic Power: Psi-Bolstered Knack",
    "Psionic Power: Psychic Whispers",
    "Psionic Power: Psionic Energy Dice",
    "Psionic Power: Psionic Energy",
    "Soul Blades: Homing Strikes",
    "Soul Blades: Psychic Teleportation",
    "Psychic Blades: Homing Strikes",
    "Psychic Teleportation",
    "Psionic Power: Recovery",
    "Psychic Blades: Rend Mind",
    "Psionic Power: Protective Field",
    "Psionic Power: Telekinetic Thrust",
    "Psionic Power: Psi-Powered Leap",
    "Psionic Power: Psionic Strike",
    "Psionic Power: Telekinetic Movement",
    "Telekinetic Master: Weapon Attack",
    "Hand of Healing: Physician's Touch",
    "Hand of Harm: Physician's Touch",
    "Patient Defense (Heightened)",
    "Step of the Wind (Heightened)",
    "Flurry of Blows (Heightened)",
    "Focus Points",
    "Ki Points",
    "Deflect Attack",
    "Deflect Attack: Redirect Attack",
    "Flurry of Blows",
    "Patient Defense",
    "Step of the Wind",
  ];

  static SKIPPED_ACTIONS_STARTSWITH = [
    // weapon properties
    "Cleave (",
    "Graze (",
    "Nick (",
    "Push (",
    "Sap (",
    "Slow (",
    "Topple (",
    "Vex (",
    // others
    "Tactical Master:",
    "Brutal Strike:",
    "Channel Divinity: War God",
    "Combat Inspiration: ",
    "Font of Magic: Create",
    "Improved Brutal Strike:",
    "Land's Aid:",
    "Maneuver: Disarming Attack (Dex.",
    "Maneuver: Menacing Attack (Dex.",
    "Maneuver: Parry (Dex.",
    "Maneuver: Trip Attack (Dex.",
    "Misty Step: ",
    "Natural Recovery:",
    "Pact of the Blade:",
    "Sneak Attack:",
    "Starry Form:",
    "Wild Resurgence:",
    "War Bond:",
  ];

  static SKIPPED_2014_ONLY_ACTIONS = [
  ];

  static SKIPPED_2024_ONLY_ACTIONS = [
    "Lifedrinker",
  ];

  static HIGHEST_LEVEL_ONLY_ACTION_MATCH = [
    "Bardic Inspiration",
    "Channel Divinity: Invoke Duplicity",
    "Moonlight Step",
    "Warding Flare",
  ];

  // static ACTION_MATCH = [
  //   /Rune Carver: (\w+ Rune)/i,
  // ];

  // _actionMatch() {
  //   for (const match of DDBAction.ACTION_MATCH) {
  //     const result = match.exec(this.ddbDefinition.name);
  //     if (result) {
  //       foundry.utils.setProperty(this.data, "flags.ddbimporter.featureMatchName", result[1]);
  //       break;
  //     }
  //   }
  // }


  _init() {
    this.isAction = true;
    logger.debug(`Generating Action ${this.ddbDefinition.name}`);
  }


  displayAsAttack() {
    const customDisplay = this.rawCharacter
      ? DDBHelper.getCustomValueFromCharacter(this.ddbDefinition, this.rawCharacter, 16)
      : DDBHelper.getCustomValue(this.ddbDefinition, this.ddbData, 16);
    if (typeof customDisplay == "boolean") {
      return customDisplay;
    } else if (foundry.utils.hasProperty(this.ddbDefinition, "displayAsAttack")) {
      return this.ddbDefinition.displayAsAttack;
    } else {
      return false;
    }
  }

  _generateSystemType(typeNudge = null) {
    if (this.documentType === "weapon") {
      this._generateWeaponType();
    } else if (this.ddbData.character.actions.class.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      this.data.system.type.value = "class";
    } else if (this.ddbData.character.actions.race.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      this.data.system.type.value = "race";
    } else if (this.ddbData.character.actions.feat.some((a) =>
      a.name === this.ddbDefinition.name
      || (foundry.utils.hasProperty(a, "definition.name") && a.definition.name === this.ddbDefinition.name),
    )) {
      this.data.system.type.value = "feat";
    } else if (typeNudge) {
      this.data.system.type.value = typeNudge;
      foundry.utils.setProperty(this.data, "flags.ddbimporter.type", typeNudge);
    }
  }

  isMeleeOrRangedAction() {
    return this.ddbDefinition.attackTypeRange || this.ddbDefinition.rangeId;
  }

  getDamage(bonuses = []) {
    // when the action type is not set to melee or ranged we don't apply the mod to damage
    const meleeOrRangedAction = this.isMeleeOrRangedAction();
    const modBonus = (this.ddbDefinition.statId || this.ddbDefinition.abilityModifierStatId)
      && !this.ddbDefinition.isOffhand
      && meleeOrRangedAction
      ? " + @mod"
      : "";
    const unarmedDamageBonus = DDBHelper.filterBaseModifiers(this.ddbData, "damage", { subType: "unarmed-attacks" })
      .reduce((prev, cur) => prev + cur.value, 0);

    const damage = this.ddbDefinition.isMartialArts
      ? super.getMartialArtsDamage(bonuses.concat((unarmedDamageBonus === 0 ? [] : [`+ ${unarmedDamageBonus}`])))
      : super.getDamage(bonuses.concat([modBonus]));

    if (damage.number || damage.custom.enabled) {
      return damage;
    } else {
      return undefined;
    }
  }

  getActionAttackAbility() {
    let defaultAbility = this.ddbDefinition.abilityModifierStatId
      ? DICTIONARY.character.abilities.find(
        (stat) => stat.id === this.ddbDefinition.abilityModifierStatId,
      ).value
      : "";

    if (this.ddbDefinition.abilityModifierStatId
      && !([1, 2].includes(this.ddbDefinition.abilityModifierStatId) && this.ddbDefinition.isMartialArts)
    ) {
      return defaultAbility;
    } else if (this.ddbDefinition.isMartialArts) {
      return this.ddbDefinition.isMartialArts && this.isMartialArtist()
        ? this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.dex.value >= this.rawCharacter.flags.ddbimporter.dndbeyond.effectAbilities.str.value
          ? "dex"
          : "str"
        : defaultAbility !== ""
          ? defaultAbility
          : "str";
    } else {
      return "";
    }
  }

  getBonusDamage() {
    if (this.ddbDefinition.isMartialArts) {
      return DDBHelper.filterBaseModifiers(this.ddbData, "bonus", { subType: "unarmed-attacks" }).reduce((prev, cur) => prev + cur.value, 0);
    }
    return "";
  }

  _generateProperties() {
    const kiEmpowered = this.ddbData.character.classes
      // is a martial artist
      .some((cls) =>
        cls.classFeatures.some((feature) =>
          feature.definition.name === "Ki-Empowered Strikes"
          && cls.level >= feature.definition.requiredLevel,
        ));

    if (kiEmpowered && foundry.utils.getProperty(this.data, "flags.ddbimporter.originalName") == "Unarmed Strike") {
      utils.addToProperties(this.data.system.properties, "mgc");
    }
  }

  build() {
    try {
      if (this.is2014 && DDBAction.SKIPPED_2014_ONLY_ACTIONS.includes(this.originalName)) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.skip", true);
      } else if (!this.is2014 && DDBAction.SKIPPED_2024_ONLY_ACTIONS.includes(this.originalName)) {
        foundry.utils.setProperty(this.data, "flags.ddbimporter.skip", true);
      }
      this._generateSystemType();
      this._generateSystemSubType();
      this._generateDescription();
      this._generateLimitedUse();
      this._generateRange();
      if (!this.enricher.documentStub?.stopDefaultActivity)
        this._generateActivity();
      this.enricher.addAdditionalActivities(this);
      this._generateResourceFlags();

      this.enricher.addDocumentOverride();
      this._addEffects();
      this._addCustomValues();

      this.data.system.identifier = utils.referenceNameString(`${this.data.name.toLowerCase()}`); // ${this.is2014 ? " - legacy" : ""}`);

    } catch (err) {
      logger.warn(
        `Unable to Generate Action: ${this.name}, please log a bug report. Err: ${err.message}`,
        "extension",
      );
      logger.error("Error", err);
    }
  }

}
