const FLAG_NAME = "Hunter's Mark";

try {
  const activity = args[0].workflow.activity;
  if (args[0].macroPass === "DamageBonus") {
    if (!DDBImporter.EffectHelper.isAttack({ activity, classification: "weapon" })) return;
    if (foundry.utils.hasProperty(actor, "flags.dae.onUpdateTarget") && args[0].hitTargets.length > 0) {
      const isMarked = actor.flags.dae.onUpdateTarget.some(
        (flag) =>
          flag.flagName === FLAG_NAME &&
          flag.sourceTokenUuid === args[0].hitTargetUuids[0]
      );
      if (isMarked) {
        let damageType = foundry.utils.getProperty(actor, "flags.dae.huntersMark.damageType")
          ?? item.system.damage.base.types.first();
        const diceMult = args[0].isCritical ? 2 : 1;
        const damageRoll = `${diceMult}d6[${damageType}]`;
        return {
          damageRoll,
          flavor: `${FLAG_NAME} Damage`,
        };
      }
    } else {
      return {};
    }
  } else if (args[0].macroPass === "preItemRoll") {
    console.warn("Here", this);
    // check if we are already marking and if the marked target is dead.
    const markedTarget = actor.flags.dae.onUpdateTarget.find(
      (flag) => flag.flagName === FLAG_NAME
    )?.sourceTokenUuid;

    if (!markedTarget) return true;
    const target = await fromUuid(markedTarget);
    if (target && target.actor.system.attributes.hp.value > 0) return true;
    //marked target is dead or removed so don't consume a resource
    const concentrationNames = DDBImporter.EffectHelper.getConcentrationNames(rolledItem.name);
    const concentrationEffect = actor.effects.find((ef) => concentrationNames.some((c) => ef.name.startsWith(c)));
    if (!concentrationEffect) return true;
    const currentDuration = foundry.utils.duplicate(concentrationEffect.duration);
    const useHookId = Hooks.on("dnd5e.preUseActivity", (hookItem, config, options) => {
      // console.warn("Use Hook", { hookItem, config, options, item });
      if (hookItem.parent.parent.uuid !== item.uuid) return;
      options.configureDialog = false;
      options.configure = false;
      config.consume.spellSlot = false;
      Hooks.off("dnd5e.preUseActivity", useHookId);
    });
    const effectHookId = Hooks.on("preCreateActiveEffect",(effect, _data, _options, _user) => {
      if (concentrationNames.includes(effect.name)) {
        effect.updateSource({ duration: currentDuration });
        Hooks.off("dnd5e.preCreateActiveEffect", effectHookId);
      }
      return true;
    });
    return true;
  }
} catch (err) {
  console.error(`${args[0].itemData.name} - ${FLAG_NAME}`, err);
  return {};
}
