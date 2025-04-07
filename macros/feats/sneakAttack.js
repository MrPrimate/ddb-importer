


console.warn("Sneak Attack Damage Macro", { args, workflow, rolledItem});
try {
    if (!["mwak","rwak"].includes(workflow.activity.actionType)) return {}; // weapon attack
    if (workflow.activity.actionType === "mwak" && !rolledItem?.system.properties?.has("fin"))
      return {}; // ranged or finesse
    if (workflow.hitTargets.size < 1) return {};
    if (!actor || !token || workflow.hitTargets.size < 1) return {};
    const rogueLevels = actor.getRollData().classes.rogue?.levels;
    if (!rogueLevels) {
      MidiQOL.warn("Sneak Attack Damage: Trying to do sneak attack and not a rogue");
      return {}; // rogue only
    }
    let target = workflow.hitTargets.first();
    if (!target) MidiQOL.error("Sneak attack macro failed");

    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime === lastTime) {
      MidiQOL.warn("Sneak Attack Damage: Already done a sneak attack this turn");
      return {};
      }
    }
    let foundEnemy = true;
    let isSneak = args[0].advantage;

    if (!isSneak) {
      foundEnemy = false;
      let nearbyEnemy = canvas.tokens.placeables.filter(t => {
        let nearby = (t.actor &&
            t.actor?.id !== args[0].actor._id && // not me
            t.id !== target.id && // not the target
            t.actor?.system.attributes?.hp?.value > 0 && // not incapacitated
            t.document.disposition !== target.document.disposition && // not an ally
            MidiQOL.computeDistance(t, target, {wallsBlock: false}) <= 5 // close to the target
        );
        foundEnemy = foundEnemy || (nearby && t.document.disposition === -target.document.disposition)
        return nearby;
      });
      isSneak = nearbyEnemy.length > 0;
    }
    if (!isSneak) {
      MidiQOL.warn("Sneak Attack Damage: No advantage/ally next to target");
      return {};
    }
    let useSneak = foundry.utils.getProperty(actor, "flags.dae.autoSneak");
    if (!useSneak) {
        let dialog = new Promise((resolve, reject) => {
          new Dialog({
          // localize this text
          title: "Conditional Damage",
          content: `<p>Use Sneak attack?</p>`+(!foundEnemy ? "<p>Only Nuetral creatures nearby</p>" : ""),
          buttons: {
              confirm: {
                  icon: '<i class="fas fa-check"></i>',
                  label: "Confirm",
                  callback: () => resolve(true)
              },
              cancel: {
                  icon: '<i class="fas fa-times"></i>',
                  label: "Cancel",
                  callback: () => {resolve(false)}
              }
          },
          default: "confirm"
          }).render(true);
        });
        useSneak = await dialog;
    }
    if (!useSneak) return {}
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime !== lastTime) {
        await actor.setFlag("midi-qol", "sneakAttackTime", combatTime)
      }
    }
    const sneakActivity = macroItem.system.activities?.contents[0];
    if (!sneakActivity) {
      console.error("no activity");
      return {};
    }
  let damageRolls = await sneakActivity.rollDamage({midiOptions: {isCritical: workflow.isCritical}}, {configure: false}, {create: false});
  for (let damageRoll of damageRolls)
    damageRoll.options.flavor = sneakActivity.name;
    return damageRolls;
} catch (err) {
  console.error(`${args[0].itemData.name} - Sneak Attack ${version}`, err);
}
