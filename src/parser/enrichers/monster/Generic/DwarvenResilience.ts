import _SaveAdvantageVsCondition from "./_SaveAdvantageVsCondition";

export default class DwarvenResilience extends _SaveAdvantageVsCondition {

  override get saveAdvantageStatuses(): string[] {
    return ["poisoned"];
  }

  override get saveAdvantageExtraConditions(): string[] {
    // 2014 wording is advantage against poison generally, not just the condition
    return ["damageTypes.poison"];
  }

}
