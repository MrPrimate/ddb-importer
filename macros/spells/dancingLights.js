if (!DDBImporter?.EffectHelper.checkJB2a(true, true, true)) return false;

const summonType = 'Dancing light';
const caster = game.actors.get(args[0].actor._id);
const spawnedIds = [];

// this is called when the item is created, you can run this manually if your actors are not created yet
// await DDBImporter.EffectHelper._createJB2aActors("Dancing Lights", "Dancing light");

const lightActors = game.actors.filter((f) =>f.name.includes(summonType));

const actorChoices = lightActors.map((actor) => {
  const labelSrc = actor.img.replace(/\\d+x\\d+\\.webm$/, 'Thumb.webp');
  const labelText = actor.name.split(' - ')[1];
  return {
    label: `<img src="${labelSrc}" width="40" height="40" style="border:0px"><br>${labelText}`,
    value: actor,
  };
});

async function preEffects(template, update) {
  //prep summoning area
  new Sequence()
    .effect()
    .atLocation(template)
    .file(getJB2aName(update.token.name))
    .center()
    .scale(1.5)
    .belowTokens()
    .play();
}

async function postEffects(template, token) {
  //bring in our minion
  new Sequence().animation().on(token).fadeIn(2000).play();
}

function getJB2aName(colorChoice) {
  if (game.modules.get('jb2a_patreon')?.active) {
    if (colorChoice.includes('Blue')) {
      return 'jb2a.dancing_light.blueteal';
    } else if (colorChoice.includes('Green')) {
      return 'jb2a.dancing_light.green';
    } else if (colorChoice.includes('Yellow')) {
      return 'jb2a.dancing_light.yellow';
    } else {
      return 'jb2a.dancing_light.yellow';
    }
  } else {
    return 'jb2a.markers.light.intro.blue';
  }
}

for (let i = 0; i < 4; i++) {
  const choice = await DDBImporter.EffectHelper.buttonDialog({
    title: 'Choose your color:',
    buttons: actorChoices,
  });

  if (!choice) break;

  const updates = {
    token: {
      name: `${choice.name} of ${caster.name}`,
      alpha: 0,
    },
    actor: {
      name: `${choice.name} of ${caster.name}`,
      system: {
        attributes: {
          hp: {
            value: 100,
            max: 100,
          },
        },
        details: {
          type: {
            custom: 'NoTarget',
            value: 'custom',
          },
        },
      },
    },
    flags: {
      'mid-qol': {
        neverTarget: true,
      }
    }
  };

  const callbacks = {
    pre: async (template, update) => {
      preEffects(template, update);
      await DDBImporter?.EffectHelper.wait(500);
    },
    post: async (template, token, updates) => {
      postEffects(template, token);
      await DDBImporter?.EffectHelper.wait(500);
      const sourceActorOrToken = fromUuidSync(
        updates.actor.flags.warpgate.control.actor
      );
      const sourceActor = sourceActorOrToken.actor ?? sourceActorOrToken;
      const concentrationFlag = sourceActor.getFlag('midi-qol', 'concentration-data');
      concentrationFlag.removeUuids.push(token.uuid);
      await sourceActor.setFlag('midi-qol', 'concentration-data', concentrationFlag);
    },
  };

  const options = { controllingActor: caster };
  const ids = await warpgate.spawn(
    await choice.getTokenDocument(),
    updates,
    callbacks,
    options,
  );

  if (!ids) break;
  spawnedIds.push(ids[0]);
}

await token.actor.setFlag('midi-qol', 'spawnedTokenIds', spawnedIds);
for (const id of spawnedIds) {
  const spawnedActor = canvas.scene.tokens.get(id).actor;
  await DAE.setFlag(spawnedActor, 'spawnedByTokenUuid', token.document.uuid);
}

const hookIdForSpawnedCreatures = Hooks.on('preDeleteToken', async (tokenDoc) => {
  const sourceTokenUuid = tokenDoc.actor.getFlag('dae', 'spawnedByTokenUuid');
  if (!sourceTokenUuid) return;
  new Sequence()
    .effect()
    .atLocation(tokenDoc.object.center)
    .file(`jb2a.smoke.puff.centered.grey.2`)
    .scale(tokenDoc.width / canvas.scene.grid.distance)
    .play();
  const sourceActor = fromUuidSync(sourceTokenUuid).actor;
  const spawnedIds = sourceActor.getFlag('midi-qol', 'spawnedTokenIds');
  if (!spawnedIds) return;
  const spawnedTokenDocs = [];
  for (const i of spawnedIds) {
    if (canvas.scene.tokens.get(i))
      spawnedTokenDocs.push(canvas.scene.tokens.get(i));
  }
  if (spawnedTokenDocs.length === 1) {
    await sourceActor.unsetFlag('midi-qol', 'spawnedTokenIds');
    Hooks.off('preDeleteToken', hookIdForSpawnedCreatures);
  }
});
