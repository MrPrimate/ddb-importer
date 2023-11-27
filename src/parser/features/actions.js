import DDBAttackAction from "./DDBAttackAction.js";

function getAttackAction(ddb, character, action) {
  const ddbAttackAction = new DDBAttackAction({ ddbData: ddb, ddbAction: action, rawCharacter: character });
  ddbAttackAction.build();

  return ddbAttackAction.data;
}

/**
 * Everyone has an Unarmed Strike
 * @param {*} ddb
 */
export function getUnarmedStrike(ddb, character, overrides = {}) {
  const unarmedStrikeMock = CONFIG.DDB.naturalActions[0];
  unarmedStrikeMock.displayAsAttack = true;
  const strikeMock = Object.assign(unarmedStrikeMock, overrides);
  const unarmedStrike = getAttackAction(ddb, character, strikeMock);
  return unarmedStrike;
}
