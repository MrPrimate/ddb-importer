
try {
  if (workflow.activity.type !== "attack") return;
  if (workflow.activity.attack?.type?.classification !== "weapon") return;

  if (workflow.activity.attack.type.value === "melee" && !rolledItem.system.properties?.has("fin")) {
    return {}; // ranged or finesse
  }
  if (workflow.hitTargets.size < 1) return {};
  if (!actor || !token || workflow.hitTargets.size < 1) return {};
  const rogueLevels = actor.getRollData().classes.rogue?.levels;
  if (!rogueLevels) {
    ui.notifications.warn("Sneak Attack Damage: Trying to do sneak attack and not a rogue");
    return {}; // rogue only
  }
  let target = workflow.hitTargets.first();
  if (!target) {
    ui.notifications.error("Sneak attack macro failed, no target");
    return {};
  }

  let sneakAttack = args[0].actor.collections.items.find((i) => i.system.identifier === "sneak-attack");
  if (!sneakAttack) {
    ui.notifications.error("Sneak attack macro failed, sneak attack item not found");
    return {};
  }

  if (game.combat) {
    const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
    const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
    if (combatTime === lastTime) {
      ui.notifications.warn("Sneak Attack Damage: Already done a sneak attack this turn");
      return {};
    }
  }
  let foundEnemy = true;
  let isSneak = args[0].advantage;
  let isDisadvantage = args[0].disadvantage;
  let rakishAudacity = args[0].actor.collections.items.find((i) => i.system.identifier.startsWith("rakish-audacity"));

  if (!isSneak) {
    foundEnemy = false;
    const targetNearbyCreatures = DDBImporter.EffectHelper.getActiveCreaturesFromTokenByDisposition(target, {
      excludedActorIds: [args[0].actor._id],
      distance: 5,
    });

    if (targetNearbyCreatures.enemies.length > 0) {
      foundEnemy = true;
      isSneak = true;
    } else if (
      rakishAudacity
       && !isDisadvantage
      && DDBImporter.EffectHelper.getDistance(target, args[0].actor) <= 5
    ) {
      const meNearbyCreatures = DDBImporter.EffectHelper.getActiveCreaturesFromTokenByDisposition(workflow.token, {
        excludedTokenIds: [target.id],
        distance: 5,
      });
      // handle rakish audacity, within 5ft, no one else within 5ft, no disadvantage
      // console.warn("rakish audacity check", {
      //   args,
      //   workflow,
      //   target, actor,
      //   targetNearbyCreatures
      // , meNearbyCreatures, rakishAudacity, isDisadvantage, isSneak, foundEnemy
      // });
      if (meNearbyCreatures.enemies.length === 0
        && meNearbyCreatures.allies.length === 0
        && meNearbyCreatures.neutrals.length === 0
      ) {
        foundEnemy = meNearbyCreatures.others.length === 0;
        isSneak = true;
      }
    }
  }

  if (!isSneak) {
    const rakishAudacityText = rakishAudacity ? ` and another creature too close for ${rakishAudacity.name}` : "";
    ui.notifications.warn(`Sneak Attack Damage: No advantage/ally next to target${ rakishAudacityText}`);
    return {};
  }
  let useSneak = foundry.utils.getProperty(actor, "flags.dae.autoSneak");
  if (!useSneak) {
    const foundEnemyText = foundEnemy
      ? ""
      : "<p>Unable to determine is Sneak Attack is valid</p>";

    let dialog = new Promise((resolve, reject) => {
      new Dialog({
      // localize this text
      title: "Conditional Damage",
      content: `<p>Use Sneak attack?</p>${foundEnemyText}`,
      buttons: {
        one: {
          icon: '<i class="fas fa-check"></i>',
          label: "Confirm",
          callback: () => resolve(true)
        },
        two: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel",
          callback: () => {resolve(false)}
        }
      },
      default: "two"
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
  const sneakActivity = sneakAttack.system.activities?.contents[0];
  if (!sneakActivity) {
    console.error("no activity");
    return {};
  }
  let damageRolls = await sneakActivity.rollDamage(
    {
      midiOptions: { isCritical: workflow.isCritical },
    },
    { configure: false },
    { create: false }
  );
  for (let damageRoll of damageRolls)
    damageRoll.options.flavor = sneakActivity.name;
  return damageRolls;
} catch (err) {
    console.error(`${rolledItem.name} - Sneak Attack DDB Macro`, err);
}
