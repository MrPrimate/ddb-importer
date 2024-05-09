if (args[0].macroPass === "postSave" && workflow.failedSaves) {
  let targets = workflow.failedSaves;
  const commandWord = await globalThis.DDBImporter.DialogHelper.ChooserDialog.Ask(
    [
      {
        label: "What do you command?",
        type: "text",
        value: "",
        options: [""]
      }
    ],
    [
      {
        label: "Cast!",
        value: "1",
      }
    ],
    { title: "🗣Command Spell" }
  );

  for (let target of targets) {
    MidiQOL.socket().executeAsGM("_gmSetFlag", {
      actorUuid: target.actor.uuid,
      base: "midi-qol",
      key: "commandWord",
      value: commandWord.results[0],
    });
  }
}
if (args[0] === "off") {
  let wordInput = await actor.getFlag("midi-qol", "commandWord");
  let content = `${actor.name} must use their action to "${wordInput}".`;
  let actorPlayer = MidiQOL.playerForActor(actor);
  let chatData = {
    user: actorPlayer.id,
    speaker: ChatMessage.getSpeaker({ token: token }),
    content: content,
  };
  ChatMessage.create(chatData);
  MidiQOL.socket().executeAsGM("_gmUnsetFlag", { actorUuid: actor.uuid, base: "midi-qol", key: "commandWord" });
}
