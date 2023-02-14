/**
 * If a custom AA condition animation exists for the specified name, registers the appropriate hook with AA
 * to be able to replace the default condition animation by the custom one.
 *
 * @param {*} condition condition for which to replace its AA animation by a custom one (it must be a value from CONFIG.DND5E.conditionTypes).
 * @param {*} macroData the midi-qol macro data.
 * @param {*} originItemName the name of item used for AA customization of the condition.
 * @param {*} conditionItemUuid the UUID of the item applying the condition.
 */
export function configureCustomAAForCondition(condition, macroData, originItemName, conditionItemUuid) {
  // Get default condition label
  const statusName = CONFIG.DND5E.conditionTypes[condition];
  const customStatusName = `${statusName} [${originItemName}]`;
  if (AutomatedAnimations.AutorecManager.getAutorecEntries().aefx.find((a) => a.label === customStatusName)) {
    const aaHookId = Hooks.on("AutomatedAnimations-WorkflowStart", (data) => {
      if (
        data.item instanceof CONFIG.ActiveEffect.documentClass
        && data.item.label === statusName
        && data.item.origin === macroData.sourceItemUuid
      ) {
        data.recheckAnimation = true;
        data.item.label = customStatusName;
        Hooks.off("AutomatedAnimations-WorkflowStart", aaHookId);
      }
    });
    // Make sure that the hook is removed when the special spell effect is completed
    Hooks.once(`midi-qol.RollComplete.${conditionItemUuid}`, () => {
      Hooks.off("AutomatedAnimations-WorkflowStart", aaHookId);
    });
  }
}


/**
 * Adds a save advantage effect for the next save on the specified target actor.
 *
 * @param {*} targetActor the target actor on which to add the effect.
 * @param {*} originItem the item that is the origin of the effect.
 * @param {*} ability the short ability name to use for save, e.g. str
 */
export async function addSaveAdvantageToTarget(targetActor, originItem, ability, additionLabel = "", icon = null) {
  const effectData = {
    _id: randomID(),
    changes: [
      {
        key: `flags.midi-qol.advantage.ability.save.${ability}`,
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    origin: originItem.uuid,
    disabled: false,
    transfer: false,
    icon,
    label: `${originItem.name}${additionLabel}: Save Advantage Large Creature`,
    duration: { turns: 1 },
    flags: {
      dae: {
        specialDuration: [`isSave.${ability}`],
      },
    },
  };
  await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
}
