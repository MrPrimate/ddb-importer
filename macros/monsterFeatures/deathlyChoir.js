if (args[0].macroPass === "prePreambleComplete") {
    if (workflow.targets.size === 0) return;
    let validTargets = [];
    for (let i of Array.from(workflow.targets)) {
      const nullEffects = DDBImporter?.EffectHelper.findEffects(i.actor, ["Deafened", "Dead", "Mind Blank"]);
      if (nullEffects.length > 0) continue;
      validTargets.push(i.id);
    }
    DDBImporter?.EffectHelper.updateTargets(validTargets);
}
