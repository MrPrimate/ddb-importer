// console.warn({args, options, })

if (args[0].macroPass === "isHit") {
    const reactingActor = options.actor;
    const reactingToken = options.token;

    const activity = workflow.activity;
    if (activity.attack?.type?.value !== "melee") return;
    if (workflow.token.actor.uuid === workflow.hitTargets.first().actor.uuid) return;

    const effect = reactingActor.effects.find((effect) => effect.name === 'Armor of Agathys');
    if (!effect) return;

    const castData = effect.flags['midi-qol'].castData;
    let damage = Math.max(castData.castLevel, castData.baseLevel) * 5;
    const target = token;
    let damageRoll = await new CONFIG.Dice.DamageRoll(`${damage}`).evaluate();
    await MidiQOL.displayDSNForRoll(damageRoll, "damageRoll");
    const wf = await new MidiQOL.DamageOnlyWorkflow(
        reactingActor,
        reactingToken,
        damageRoll.total,
        "cold",
        [workflow.token],
        damageRoll,
        {
          itemCardId: "new",
          useOther: true,
          flavor: "Armor of Agathys Damage",
        }
    );
}

if (args[0].macroPass == "isDamaged") {
    const effect = options.actor.effects.find(effect => effect.name === 'Armor of Agathys');
    const tempHP = workflow.hitTargets.first().actor.system.attributes.hp.temp;

    if (tempHP === 0) await MidiQOL.socket().executeAsGM('removeEffects', {'actorUuid': effect.parent.uuid, 'effects': [effect.id]});
}
