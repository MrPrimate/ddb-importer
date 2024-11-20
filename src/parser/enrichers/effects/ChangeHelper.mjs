export default class ChangeHelper {

  static change(value, priority, key, type) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES[type],
      priority,
    };
  }


  // Basic Change generation helpers
  static signedAddChange(value, priority, key) {
    const bonusValue = (Number.isInteger(value) && value >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !value.trim().startsWith("+") && !value.trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return {
      key,
      value: bonusValue,
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static unsignedAddChange(value, priority, key) {
    const bonusValue = `${value}`.trim().replace("+ +", "+").replace(/^\+\s+/, "");
    return {
      key,
      value: bonusValue.trim(),
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      priority,
    };
  }

  static customChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static customBonusChange(value, priority, key) {
    const bonusValue = (Number.isInteger(value) && value >= 0) // if bonus is a positive integer
      || (!Number.isInteger(value) && !value.trim().startsWith("+") && !value.trim().startsWith("-")) // not an int and does not start with + or -
      ? `+${value}`
      : value;
    return {
      key,
      value: bonusValue,
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority,
    };
  }

  static upgradeChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE,
      priority,
    };
  }

  static overrideChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      priority,
    };
  }

  static multiplyChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
      priority,
    };
  }

  static downgradeChange(value, priority, key) {
    return {
      key,
      value,
      mode: CONST.ACTIVE_EFFECT_MODES.DOWNGRADE,
      priority,
    };
  }

  static tokenMagicFXChange(macroValue, priority = 20) {
    return {
      key: 'macro.tokenMagic',
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      value: macroValue,
      priority: priority,
    };
  }

  // this can now be removed once changes refactored
  static atlChange(atlKey, mode, value, priority = 20) {
    let key = atlKey;

    switch (atlKey) {
      case 'ATL.dimLight':
        key = 'ATL.light.dim';
        break;
      case 'ATL.brightLight':
        key = 'ATL.light.bright';
        break;
      case 'ATL.lightAnimation':
        key = 'ATL.light.animation';
        break;
      case 'ATL.lightColor':
        key = 'ATL.light.color';
        break;
      case 'ATL.lightAlpha':
        key = 'ATL.light.alpha';
        break;
      case 'ATL.lightAngle':
        key = 'ATL.light.angle';
        break;
      // no default
    }

    return {
      key,
      mode,
      value,
      priority,
    };
  }



}
