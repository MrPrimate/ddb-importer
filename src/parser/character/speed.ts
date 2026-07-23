import { DICTIONARY } from "../../config/_module";
import DDBCharacter from "../DDBCharacter";
import { DDBModifiers } from "../lib/_module";

DDBCharacter.prototype._generateSpeed = function _generateSpeed(this: DDBCharacter) {

  // For all processing, we take into account the regular movement types of this character
  const movementTypes: Partial<Record<I5eMovementType, number>> = {};
  const setToWalking: Partial<Record<I5eMovementType, boolean>> = {};
  for (const type in this.source.ddb.character.race.weightSpeeds.normal) {
    // if (data.character.race.weightSpeeds.normal[type] !== 0) {
    const movementType = type as I5eMovementType;
    movementTypes[movementType] = this.source.ddb.character.race.weightSpeeds.normal[movementType];
    setToWalking[movementType] = false;
    // }
  }


  // get bonus speed mods
  const restriction = ["", null, "unless your speed is already higher"];
  // Check for equipped Heavy Armor
  const wearingHeavy = this.source.ddb.character.inventory.some((item) => item.equipped && item.definition.type === "Heavy Armor");
  // Accounts for Barbarian Class Feature - Fast Movement
  if (!wearingHeavy) restriction.push("while you aren’t wearing heavy armor");

  // build base speeds
  for (const type in movementTypes) {
    // is there a 'inntate-speed-[type]ing' race/class modifier?
    const innateType = DICTIONARY.actor.speeds.find((s) => s.type === type).innate;
    const innateSpeeds = this.source.ddb.character.modifiers.race.filter(
      (modifier) => modifier.type === "set" && modifier.subType === `innate-speed-${innateType}`,
    );
    const movementType = type as I5eMovementType;
    let base = movementTypes[movementType];

    innateSpeeds.forEach((speed) => {
      // take the highest value
      if (speed.value === null && speed.modifierSubTypeId == 182 && speed.modifierTypeId == 9) {
        setToWalking[movementType] = true;
      } else if (parseInt(String(speed.value)) > base) {
        base = parseInt(String(speed.value));
      }
    });

    // overwrite the (perhaps) changed value
    (movementTypes as Record<string, any>)[type] = base;
  }

  const bonusSpeed = DDBModifiers
    .filterBaseModifiers(this.source.ddb, "bonus", { subType: "speed", restriction })
    .reduce((speed, feat) => speed + parseInt(String(feat.value)), 0);

  // speed bonuses
  for (const type in movementTypes) {
    const innateBonus = DDBModifiers
      .filterBaseModifiers(this.source.ddb, "bonus", { subType: `speed-${type}ing`, restriction })
      .reduce((speed, feat) => speed + parseInt(String(feat.value)), 0);

    // overwrite the (perhaps) changed value
    const movementType = type as I5eMovementType;
    if (movementTypes[movementType] !== 0) movementTypes[movementType] += bonusSpeed + innateBonus;
  }

  // unarmored movement for barbarians and monks
  if (this.isUnArmored()) {
    DDBModifiers.getChosenClassModifiers(this.source.ddb)
      .filter((modifier) => modifier.type === "bonus" && modifier.subType === "unarmored-movement")
      .forEach((bonusSpeed) => {
        for (const type in movementTypes) {
          const movementType = type as I5eMovementType;
          if (movementTypes[movementType] !== 0) movementTypes[movementType] += parseInt(String(bonusSpeed.value));
        }
      });
  }

  // new ranger deft explorer sets speeds, leaves value null, use walking
  for (const type in movementTypes) {
    const innateType = DICTIONARY.actor.speeds.find((s) => s.type === type).innate;
    // is there a 'inntate-speed-[type]ing' race/class modifier?
    const innateSpeeds = DDBModifiers
      .filterBaseModifiers(this.source.ddb, "set", { subType: `innate-speed-${innateType}`, restriction });
    const movementType = type as I5eMovementType;
    let base = movementTypes[movementType];

    innateSpeeds.forEach((speed) => {
      // take the highest value
      if (parseInt(String(speed.value)) > base) {
        base = parseInt(String(speed.value));
      } else if (!speed.value && movementTypes["walk"]) {
        base = movementTypes["walk"];
      }
    });

    // overwrite the (perhaps) changed value
    movementTypes[movementType] = base;
  }


  // is there a custom seed over-ride?
  if (this.source.ddb.character.customSpeeds) {
    this.source.ddb.character.customSpeeds.forEach((speed) => {
      const type = DICTIONARY.actor.speeds.find((s) => s.id === speed.movementId).type;
      if (speed.distance) {
        movementTypes[type] = speed.distance;
      }
    });
  }

  for (const type in setToWalking) {
    const movementType = type as I5eMovementType;
    if (setToWalking[movementType] && movementTypes["walk"] > movementTypes[movementType]) {
      movementTypes[movementType] = movementTypes["walk"];
    }
  }

  this.raw.character.system.attributes.movement = {
    burrow: movementTypes["burrow"] ? String(movementTypes["burrow"]) : "",
    climb: movementTypes["climb"] ? String(movementTypes["climb"]) : "",
    fly: movementTypes["fly"] ? String(movementTypes["fly"]) : "",
    swim: movementTypes["swim"] ? String(movementTypes["swim"]) : "",
    walk: movementTypes["walk"] ? String(movementTypes["walk"]) : "",
    units: "ft",
    hover: false,
  };

};
