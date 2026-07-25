import { logger } from "../../lib/_module";
import DDBCharacter from "../DDBCharacter";

DDBCharacter.prototype._generateCurrency = function _generateCurrency(this: DDBCharacter) {
  const ddb = this.source?.ddb;
  if (!ddb) {
    logger.warn("Unable to generate currency, no DDB source data");
    return;
  }
  this.raw.character.system.currency = {
    pp: ddb.character.currencies.pp,
    gp: ddb.character.currencies.gp,
    ep: ddb.character.currencies.ep,
    sp: ddb.character.currencies.sp,
    cp: ddb.character.currencies.cp,
  };

  this._currency = foundry.utils.deepClone(this.raw.character.system.currency) as I5eCurrency;
};
