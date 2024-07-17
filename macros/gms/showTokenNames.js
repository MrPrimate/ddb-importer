await canvas.scene.updateEmbeddedDocuments("Token", canvas.scene.tokens.map((t) => {
  const result = {
    _id: t.id,
    name: t.name.replace(/\(\d+\)/, "").trim(),
    displayName: 40,
  };
  if (t.actorData?.name && t.actorData.name !== result.name) {
    foundry.utils.setProperty(result, "delta.name", result.name);
  }
  return result;
}
));
