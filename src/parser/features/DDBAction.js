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
    "Blink Steps",
    "Brew Poison",
    "Channel Divinity: Abjure Foes",
    "Channel Divinity: Divine Spark",
    "Channel Divinity: Guided Strike (Benefit Ally)",
    "Channel Divinity: Guided Strike (Self)",
    "Channel Divinity: Invoke Duplicity",
    "Channel Divinity: Sear Undead",
    "Channel Divinity: Turn Undead",
    "Channel Divinity: War God's Blessing",
    "Charge Attack",
    "Deflect Attack: Redirect Attack",
    "Deflect Attack",
    "Divine Strike",
    "Embody Legends",
    "Enhanced Dual Wielding",
    "Enhanced Unarmed Strike",
    "Evergreen Wildshape",
    "Flurry of Blows (Heightened)",
    "Flurry of Blows: Addle",
    "Flurry of Blows: Push",
    "Flurry of Blows: Topple",
    "Flurry of Blows",
    "Focus Points",
    "Form of the Beast: Tail (reaction)",
    "Free Casting",
    "Ghostly Gaze",
    "Grant Wrath of the Sea",
    "Hand of Harm: Physician's Touch",
    "Hand of Healing: Physician's Touch",
    "Improved Dash",
    "Invoke Duplicity: Cast Spells",
    "Invoke Duplicity: Distract",
    "Invoke Duplicity: Move Illusion",
    "Invoke Duplicity: Shared Distraction",
    "Ki Points",
    "Lay On Hands: Heal",
    "Lay On Hands: Purify Poison",
    "Lay on Hands: Restoring Touch",
    "Leave Druidic Message",
    "Luck Points",
    "Manifest Wrath of the Sea",
    "Merge with Shadows",
    "Moonlight Step: Regain Uses",
    "Nature Magician",
    "Patient Defense (Heightened)",
    "Patient Defense",
    "Polearm Master - Opportunity Attack",
    "Psionic Power: Protective Field",
    "Psionic Power: Psi-Bolstered Knack",
    "Psionic Power: Psi-Powered Leap",
    "Psionic Power: Psionic Energy Dice",
    "Psionic Power: Psionic Energy",
    "Psionic Power: Psionic Strike",
    "Psionic Power: Psychic Whispers",
    "Psionic Power: Recovery",
    "Psionic Power: Telekinetic Movement",
    "Psionic Power: Telekinetic Thrust",
    "Psychic Blades: Attack (STR)",
    "Psychic Blades: Bonus Attack (DEX)",
    "Psychic Blades: Bonus Attack (STR)",
    "Psychic Blades: Homing Strikes",
    "Psychic Blades: Rend Mind",
    "Psychic Teleportation",
    "Quick Search",
    "Rage (Instinctive Pounce)",
    "Rage: Regain Expended Uses",
    "Rage: Relentless Rage",
    "Rage: Teleport",
    "Reactive Spell",
    "Sacred Weapon: Imbue Weapon",
    "Saving Throw Reroll",
    "Second Wind: Tactical Shift",
    "Shift",
    "Soul Blades: Homing Strikes",
    "Soul Blades: Psychic Teleportation",
    "Speedy Recovery",
    "Step of the Wind (Heightened)",
    "Step of the Wind: Fleet Step",
    "Step of the Wind",
    "Stonecunning (Tremorsense)",
    "Summon Wildfire Spirit: Command",
    "Superiority Dice",
    "Telekinetic Master: Weapon Attack",
    "Unerring Strike",
    "War Priest: Bonus Attack",
    "Wild Magic Surge table",
    "Wild Shape: Circle Forms",
    "Wild Shape: Improved Lunar Radiance",
    "Imbue Aura of Protection",
    "Channel Divinity: Divine Sense",
    "Energy Redirection",
    "Battle Medic",
    "Avenging Angel",
    "Hunter's Mark",
    "Primal Companion: Restore Beast",
    "Primal Companion: Summon",
    "Hunter's Mark: Precise Hunter",
    "Temporary Hit Points",
    "Bolstering Performance",
    "Dreadful Strike: Sudden Strike",
    "Dreadful Strike: Mass Fear",
    "Dreadful Strike",
    "Hunter's Prey: Colossus Slayer",
    "Hunter's Mark: Superior Hunter's Prey",
    "Colossus Slayer",
    "Masterful Mimicry",
    "Steady Aim: Roving Aim",
    "Improve Fate",
    "Wild Magic Surge Table",
    "Font of Magic: Convert Spell Slots",
    "Telekinetic Shove",
    "Revelation in Flesh: Transform",
    "Trance of Order: Align Consciousness",
    "Healing Light: Expend Healing",
    "Awakened Mind: Clairvoyant Combatant",
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
    "Slasher:",
    "Fast Hands:",
    "Use Magic Device:",
    "Elemental Affinity:",
  ];

  static SKIPPED_2014_ONLY_ACTIONS = [
    "Convert Sorcery Points",
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
      this._addEffects(undefined, this.type);
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
