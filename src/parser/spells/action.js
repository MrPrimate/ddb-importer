export function getActionType(data) {
  if (data.definition.requiresSavingThrow && !data.definition.requiresAttackRoll) {
    return "save";
  }

  if (
    data.definition.tags.includes("Damage")
    && data.definition.range.rangeValue
    && data.definition.range.rangeValue > 0
  ) {
    return "rsak";
  }

  if (data.definition.tags.includes("Damage")) {
    return "msak";
  }

  if (data.definition.tags.includes("Healing")) {
    return "heal";
  }

  if (data.definition.tags.includes("Buff")) {
    return "util";
  }

  return "other";
}
