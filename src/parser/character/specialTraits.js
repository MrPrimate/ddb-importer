import utils from "../../utils.js";

export function getSpecialTraits (data) {
  let results = {
    powerfulBuild: false,
    savageAttacks: false,
    elvenAccuracy: false,
    halflingLucky: false,
    initiativeAdv: false,
    initiativeAlert: false,
    jackOfAllTrades: false,
    weaponCriticalThreshold: 20,
    observantFeat: false,
    remarkableAthlete: false,
    reliableTalent: false,
    diamondSoul: false,
    meleeCriticalDamageDice: 0
  };

  // powerful build/equine build
  results.powerfulBuild =
    data.character.race.racialTraits.filter(
      (trait) => trait.definition.name === "Equine Build" || trait.definition.name === "Powerful Build"
    ).length > 0;

  // savage attacks
  const savageAttacks = data.character.race.racialTraits.filter((trait) => trait.definition.name === "Savage Attacks").length > 0;
  results.savageAttacks = savageAttacks;
  if (savageAttacks) results.meleeCriticalDamageDice += 1;

  // halfling lucky
  results.halflingLucky =
    data.character.race.racialTraits.filter((trait) => trait.definition.name === "Lucky").length > 0;

  // elven accuracy
  results.elvenAccuracy = data.character.feats.filter((feat) => feat.definition.name === "Elven Accuracy").length > 0;

  // alert feat
  results.initiativeAlert = data.character.feats.filter((feat) => feat.definition.name === "Alert").length > 0;

  // advantage on initiative
  results.initiativeAdv = utils.filterBaseModifiers(data, "advantage", "initiative").length > 0;

  // initiative half prof
  results.initiativeHalfProf = utils.filterBaseModifiers(data, "half-proficiency", "initiative").length > 0;

  // observant
  results.observantFeat = data.character.feats.filter((feat) => feat.definition.name === "Observant").length > 0;

  // weapon critical threshold
  // fighter improved crit
  // remarkable athlete
  data.character.classes.forEach((cls) => {
    if (cls.subclassDefinition) {
      // Improved Critical
      const improvedCritical =
        cls.subclassDefinition.classFeatures.filter(
          (feature) => feature.name === "Improved Critical" && cls.level >= feature.requiredLevel
        ).length > 0;
      const superiorCritical =
        cls.subclassDefinition.classFeatures.filter(
          (feature) => feature.name === "Superior Critical" && cls.level >= feature.requiredLevel
        ).length > 0;

      if (superiorCritical) {
        results.weaponCriticalThreshold = 18;
      } else if (improvedCritical) {
        results.weaponCriticalThreshold = 19;
      }

      // Remarkable Athlete
      results.remarkableAthlete =
        cls.subclassDefinition.classFeatures.filter(
          (feature) => feature.name === "Remarkable Athlete" && cls.level >= feature.requiredLevel
        ).length > 0;
    }

    // Brutal Critical
    results.meleeCriticalDamageDice +=
      cls.definition.classFeatures.filter(
        (feature) => feature.name === "Brutal Critical" && cls.level >= feature.requiredLevel
      ).length;

    // Diamond Soul
    results.diamondSoul =
      cls.definition.classFeatures.filter(
        (feature) => feature.name === "Diamond Soul" && cls.level >= feature.requiredLevel
      ).length > 0;

    // Jack of All Trades
    results.jackOfAllTrades =
      cls.definition.classFeatures.filter(
        (feature) => feature.name === "Jack of All Trades" && cls.level >= feature.requiredLevel
      ).length > 0;

    // Reliable Talent
    results.reliableTalent =
      cls.definition.classFeatures.filter(
        (feature) => feature.name === "Reliable Talent" && cls.level >= feature.requiredLevel
      ).length > 0;
  });

  return results;
}
