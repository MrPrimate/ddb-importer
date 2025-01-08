export default class GreatWeaponMaster {

  static dnd5ePreRollDamageV2Hook(rollData, _options, _message) {
    if (rollData.rolls.length === 0) return true;
    if (!rollData.subject?.parent?.properties?.has("hvy")) return true;

    const document = rollData.subject?.actor?.items?.some((i) =>
      i.name === "Great Weapon Master"
      && i.system.source.rules === "2024",
    );
    if (!document) return true;
    rollData.rolls[0].parts.push('@prof');
    return true;
  }

}
