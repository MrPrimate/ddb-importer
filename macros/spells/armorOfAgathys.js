console.warn({args, options, })

if (args[0].macroPass === "isHit") {
    const reactingActor = options.actor;
    const reactingToken = options.token;

    const activity = args[0].attackRoll.data.activity;
    if (activity.attack?.value !== "melee") return;

    if (workflow.token.actor.uuid === workflow.hitTargets.first().actor.uuid) return;

    const effect = reactingActor.effects.find(effect => effect.label === 'Armor of Agathys');
    if (!effect) return;

    let damage = effect.flags['midi-qol'].castData.castLevel * 5;
    const target = token;
    let damageRoll = await new CONFIG.Dice.DamageRoll(`${damage}`).evaluate({ async: true });
    new MidiQOL.DamageOnlyWorkflow(
        reactingActor,
        reactingToken,
        damageRoll.total,
        "cold",
        target ? [target] : [],
        damageRoll,
        { itemCardId: workflow.itemCardId, flavor: "Armor of Agathys" }
    );
}

if (args[0].macroPass == "isDamaged") {
    const effect = options.actor.effects.find(effect => effect.label === 'Armor of Agathys');
    const tempHP = workflow.hitTargets.first().actor.system.attributes.hp.temp;

    if (tempHP === 0) await MidiQOL.socket().executeAsGM('removeEffects', {'actorUuid': effect.parent.uuid, 'effects': [effect.id]});
}
