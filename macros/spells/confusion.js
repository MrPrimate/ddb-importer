if (args[0] === "each") {
  const findEffect = token.actor.effects.find((effect) => effect.name === "Confusion");

  if (findEffect) {
    const changeIndex = findEffect.changes.findIndex(
      (change) =>
        change.key === "system.attributes.movement.all" &&
        change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM &&
        change.value === 0
    );

    if (changeIndex !== -1) {
      findEffect.changes.splice(changeIndex, 1);

      await MidiQOL.socket().executeAsGM("updateEffects", {
        actorUuid: token.actor.uuid,
        updates: [{ _id: findEffect.id, changes: findEffect.changes }],
      });
    } else {
      console.log("Specified change not found in the Confusion effect.");
    }
  } else {
    console.log("Confusion effect not found on the actor.");
  }

  // const hasEffectApplied = await game.dfreds.effectInterface.hasEffectApplied("Reaction", token.actor.uuid);
  // if (!hasEffectApplied) {
  //   DDBImporter.EffectHelper.adjustCondition({ add: true, conditionName: "Reaction", actor: token.actor });
  // }

  const confusionRoll = await new CONFIG.Dice.DamageRoll("1d10").evaluate({ async: true });
  await MidiQOL.displayDSNForRoll(confusionRoll, "damageRoll");
  const result = confusionRoll.total;
  let content;
  let selectedTokenMessage;
  let directionResult;
  let directionContent;
  switch (result) {
    case 1: {
      content = "The creature uses all its movement to move in a random direction. To determine the direction, roll a d8 and assign a direction to each die face. The creature doesn't take an action this turn.";
      const directionRoll = await new CONFIG.Dice.DamageRoll("1d8").evaluate({ async: true });
      await MidiQOL.displayDSNForRoll(directionRoll, "damageRoll");
      directionResult = directionRoll.total;
      directionContent = null;
      switch (directionResult) {
        case 1:
          directionContent = "North";
          break;
        case 2:
          directionContent = "South";
          break;
        case 3:
          directionContent = "East";
          break;
        case 4:
          directionContent = "West";
          break;
        case 5:
          directionContent = "Northwest";
          break;
        case 6:
          directionContent = "Northeast";
          break;
        case 7:
          directionContent = "Southwest";
          break;
        case 8:
          directionContent = "Southeast";
          break;
      }
      break;
    }
    case 2:
    case 3:
    case 4:
    case 5:
    case 6: {
      content = "The creature doesn't move or take actions this turn.";
      const findEffect = token.actor.effects.find((effect) => effect.name === "Confusion");
      if (findEffect)
        findEffect.changes.push({
          key: "system.attributes.movement.all",
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: 0,
          priority: 20,
        });
      await MidiQOL.socket().executeAsGM("updateEffects", {
        actorUuid: token.actor.uuid,
        updates: [{ _id: findEffect.id, changes: findEffect.changes }],
      });
      break;
    }
    case 7:
    case 8: {
      content = "The creature uses its action to make a melee attack against a randomly determined creature within its reach. If there is no creature within its reach, the creature does nothing this turn.";
      const rangeCheck = MidiQOL.findNearby(null, token.actor, token.actor.system.attributes.movement.walk, {
        includeToken: false,
      });
      if (rangeCheck.length > 0) {
        const randomSelection = rangeCheck[Math.floor(Math.random() * rangeCheck.length)];
        selectedTokenMessage = `The creature must move to ${randomSelection.actor.name} and attack them with a melee attack.`;
        if (game.modules.get("sequencer")?.active) {
          const target = randomSelection;
          new Sequence()
            .effect()
            .from(target)
            .belowTokens()
            .attachTo(target, { locale: true })
            .scaleToObject(1, { considerTokenScale: true })
            .spriteRotation(target.rotation * -1)
            .filter("Glow", { color: 0x911a1a, distance: 15 })
            .duration(30000)
            .fadeIn(2000, { delay: 1000 })
            .fadeOut(3500, { ease: "easeInSine" })
            .opacity(0.8)
            .zIndex(0.1)
            .loopProperty("alphaFilter", "alpha", { values: [0.5, 0], duration: 1000, pingPong: true, delay: 500 })
            .effect()
            .file("jb2a.extras.tmfx.outflow.circle.01")
            .attachTo(target, { locale: true })
            .scaleToObject(3, { considerTokenScale: false })
            .randomRotation()
            .duration(30000)
            .fadeIn(5000, { delay: 1000 })
            .fadeOut(3500, { ease: "easeInSine" })
            .scaleIn(0, 3500, { ease: "easeInOutCubic" })
            .tint(0x870101)
            .opacity(0.5)
            .belowTokens()
            .play();
        }
      } else {
        selectedTokenMessage = `The creature does nothing this turn.`;
      }
      break;
    }
    case 9:
    case 10:
      content = "The creature can act and move normally.";
      break;
  }
  ChatMessage.create({ content: `Confusion roll for ${token.actor.name} is ${result}:<br> ` + content });
  if (result === 1)
    ChatMessage.create({
      content: `Movement roll for ${token.actor.name} is ${directionResult}: ${token.actor.name} must move ${directionContent} using all (${token.actor.system.attributes.movement.walk} feet) of their movement.`,
    });
  if (result === 7 || result === 8) ChatMessage.create({ content: selectedTokenMessage });
}

if (args[0] === "off") {
  const findEffect = token.actor.effects.find((effect) => effect.name === "Confusion");

  if (findEffect) {
    const changeIndex = findEffect.changes.findIndex(
      (change) =>
        change.key === "system.attributes.movement.all" &&
        change.mode === CONST.ACTIVE_EFFECT_MODES.CUSTOM &&
        change.value === 0
    );

    if (changeIndex !== -1) {
      findEffect.changes.splice(changeIndex, 1);

      await MidiQOL.socket().executeAsGM("updateEffects", {
        actorUuid: token.actor.uuid,
        updates: [{ _id: findEffect.id, changes: findEffect.changes }],
      });
    } else {
      console.log("Specified change not found in the Confusion effect.");
    }
  } else {
    console.log("Confusion effect not found on the actor.");
  }
}
