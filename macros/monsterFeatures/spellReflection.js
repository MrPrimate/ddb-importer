if (args[0].macroPass === 'isSaveSuccess' && workflow.item.type === 'spell') {
  const oldToken = options.token;
  workflow.targets.delete(oldToken);
  workflow.saves.delete(oldToken);
  workflow.hitTargets.delete(oldToken);
  await MidiQOL.resolveLateTargeting(workflow.item, { forceDisplay: true });

  const msg = await item.displayCard({createMessage:false});
  const DIV = document.createElement("DIV");
  DIV.innerHTML = msg.content;
  DIV.querySelector("div.card-buttons").remove();
  await ChatMessage.create({content:DIV.innerHTML});

  const newToken = game.user.targets.first();
  if (!newToken) return;
  workflow.targets.add(newToken);
  workflow.hitTargets.add(newToken);
  workflow.saveResults = workflow.saveResults.filter((e) => e.data.tokenId !== oldToken.id);
  const { ability, dc } = duplicate(workflow.item.system.save);
  const userID = MidiQOL.playerForActor(newToken.actor)?.active ? MidiQOL.playerForActor(newToken.actor).id : game.users.activeGM.id;
  const data = {
      request: 'save',
      targetUuid: newToken.document.uuid,
      ability,
      options: {
          name: 'Reflect',
          skipDialogue: true,
          targetValue: dc,
      },
  };

  const save = await MidiQOL.socket().executeAsUser('rollAbility', userID, data);

  workflow.saveResults.push(save);

  const midiConfigSettings = game.settings.get('midi-qol','ConfigSettings');

  const coverSaveBonus = MidiQOL.computeCoverBonus(workflow.token, newToken, workflow.item);

  let adv = "";
  if (midiConfigSettings.displaySaveAdvantage) {
      if (game.system.id === "dnd5e") {
          adv = workflow.advantageSaves.has(newToken) ? `(${game.i18n.localize("DND5E.Advantage")})` : "";
          if (workflow.disadvantageSaves.has(newToken)) {
              adv = `(${game.i18n.localize("DND5E.Disadvantage")})`;
          }
      }
  }

  if (coverSaveBonus) {
      adv += `(+${coverSaveBonus} Cover)`;
  }

  let img = newToken.document?.texture?.src ?? newToken.actor.img ?? '';
  if (midiConfigSettings.usePlayerPortrait && newToken.actor.type === "character") {
      img = newToken.actor?.img ?? newToken.document?.texture?.src ?? "";
  }
  if (VideoHelper.hasVideoExtension(img)) {
      img = await game.video.createThumbnail(img, { width: 100, height: 100 });
  }

  let saved = save.total >= save.options.targetValue
  if (saved) {
      workflow.saves.add(newToken);
  } else {
      workflow.failedSaves.add(newToken);
  }

  let saveStyle = "";
  if (midiConfigSettings.highlightSuccess) {
    if (saved) {
        saveStyle = "color: green;";
    }
    else {
        saveStyle = "color: red;";
    }
  }

  workflow.saveDisplayData.push({
      gmName: newToken.name,
      playerName: MidiQOL.getTokenPlayerName(newToken),
      img,
      isPC: newToken.actor.hasPlayerOwner,
      target: newToken,
      saveString: game.i18n.localize(saved ? "midi-qol.save-success" : "midi-qol.save-failure"),
      rollTotal: save.total,
      rollDetail: save,
      id: newToken.id,
      adv,
      saveStyle
  });
}

if (args[0].macroPass === 'isAttacked' && workflow.item.type === 'spell') {
  const oldToken = options.token;

  if (workflow.attackTotal >= oldToken.actor.system.attributes.ac.value) {
      return;
  }

  workflow.targets.delete(oldToken.object);
  workflow.hitTargets.delete(oldToken.object);
  await MidiQOL.resolveLateTargeting(workflow.item, { forceDisplay: true });

  const msg = await item.displayCard({createMessage:false});
  const DIV = document.createElement("DIV");
  DIV.innerHTML = msg.content;
  DIV.querySelector("div.card-buttons").remove();
  await ChatMessage.create({content:DIV.innerHTML});

  const newToken = game.user.targets.first();

  if (!newToken) return;

  workflow.targets.add(newToken);
  workflow.hitTargets.add(newToken);
}
