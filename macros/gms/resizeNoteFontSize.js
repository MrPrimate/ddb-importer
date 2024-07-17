const onSubmit = async (noteIds, doc) => {
  const newSize = doc.find("input[name=new-size]")[0].value;
  const updates = noteIds.map((noteId) => {
    const update = {
      _id: noteId,
      fontSize: Number.parseInt(newSize),
    };
    return update;
  });
  game.canvas.scene.updateEmbeddedDocuments("Note", updates);
};

const showDialog = async (noteIds) => {
  return new Promise((resolve) => {
    new Dialog({
      title: 'Update font size for notes',
      content: `<form>
<div class="form-group">
  <label for="new-size">Size</label><input type="number" name="new-size" id="new-size" placeholder="" />
</div>
</form>`,
      buttons: {
        change: {
          label: "Change!",
          callback: async (input) => {
            resolve(await onSubmit(noteIds, input));
          }
        }
      },
      default: "change",
      close: () => resolve(null),
      render: (doc) => {
        const target = doc.find("input[name=new-size]")[0];
        target.focus();
        target.value = "";
      }
    }).render(true);
  });
};

showDialog(game.canvas.notes.placeables.map((n) => {
  return n.document._id;
}));

