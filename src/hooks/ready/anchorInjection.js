import logger from "../../logger.js";
import utils from "../../lib/utils.js";

function addSlugField(element, slug) {
  const titleInput = element.querySelector("input[name='text']");
  const slugHTML = `<div class="form-group">
  <label>Jump to HTML Slug</label>
  <div class="form-fields">
      <input type="text" name="slug" value="${slug}" placeholder="">
  </div>
</div>`;

  const div = utils.htmlToElement(slugHTML);
  titleInput.parentNode.parentNode.parentNode.insertBefore(div, titleInput.parentNode.parentNode.nextSibling.nextSibling);
}

function updateSlugField(element, slug) {
  const slugInput = element.querySelector("input[name='slug']");
  slugInput.setAttribute('value', slug);
}

function setSlugProperties(doc, slug, label) {
  setProperty(doc, "flags.anchor.slug", slug);
  setProperty(doc, "flags.ddb.slugLink", slug);
  setProperty(doc, "flags.ddb.labelName", label);
  return doc;
}

export function anchorInjection() {
  Hooks.on("activateNote", (note, options) => {
    if (note.document?.flags?.ddb?.slugLink) {
      logger.debug("Injecting note anchor", note.document.flags.ddb.slugLink);
      options["anchor"] = note.document.flags.ddb.slugLink;
    } else if (note.document.flags.anchor?.slug) {
      logger.debug("Injecting note anchor", note.document.flags.anchor.slug);
      options["anchor"] = note.document.flags.anchor.slug;
    } else if (note.document?.flags?.anchor) {
      logger.debug("Injecting note anchor", note.document.flags.anchor);
      options["anchor"] = note.document.flags.anchor;
    }
  });

  // when we render a note we add the anchor links box
  Hooks.on("renderNoteConfig", (noteConfig) => {
    const slug = noteConfig.document.flags.ddb?.slugLink
      ?? noteConfig.document.flags.anchor?.slug
      ?? "";
    if (!noteConfig.element[0].querySelector("input[name='slug']")) addSlugField(noteConfig.element[0], slug);
    noteConfig.element[0].style.height = "auto";
    const isExistingNote = noteConfig.document.id !== null;

    if (isExistingNote) {
      const closeHookId = Hooks.on("closeDocumentSheet", async (documentSheet, html) => {
        if (!(documentSheet instanceof NoteConfig)) return;
        if (noteConfig.document.id !== documentSheet.document.id) return;
        Hooks.off("closeNoteConfig", closeHookId);
        const slugInput = html[0].querySelector("input[name='slug']");
        const slug = slugInput.value;
        if (slug && slug.trim() !== "" && slug !== documentSheet.document.flags.ddb?.slugLink) {
          const update = setSlugProperties({ _id: documentSheet.document.id }, slug, documentSheet.document.label);
          await canvas.scene.updateEmbeddedDocuments("Note", [update]);
        }
      });
    }
  });

  // handle new notes, we just inject the slug properties into the source from the sheet data
  Hooks.on("preCreateNote", (note, data) => {
    if (data.slug) {
      const flagData = setSlugProperties(deepClone(note), data.slug, data.text);
      note.updateSource({ flags: flagData.flags });
    };
  });

  Hooks.on("dropCanvasData", (_, dropData) => {
    if (dropData.type !== "JournalEntryPage" && !dropData.anchor?.slug) return;

    // when we create from the side bar we fill in the input label name to match
    // the anchor name and set the slug value to the anchor slug
    Hooks.once("renderNoteConfig", (noteConfig) => {
      const titleInput = noteConfig.element[0].querySelector("input[name='text']");
      titleInput.setAttribute('value', dropData.anchor.name);
      if (dropData.anchor.slug) updateSlugField(noteConfig.element[0], dropData.anchor.slug);
    });
  });
}
