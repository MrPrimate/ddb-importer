export function polymorphEffect(document) {

  foundry.utils.setProperty(document, "flags.midiProperties.autoFailFriendly", true);

  return document;
}
