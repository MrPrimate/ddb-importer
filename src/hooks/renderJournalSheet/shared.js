import utils from "../../utils.js";

function getBookName(bookId) {
  const book = CONFIG.DDB.sources.find((source) => source.name.toLowerCase() == bookId.toLowerCase());
  if (book) {
    return book.description;
  } else {
    return "";
  }
}

export function imageToChat(src) {
  const content = `<img class="ddbimporter-chat-image" data-src="${src}" src="${src}">`;

  ChatMessage.create({
    content,
  });
}

export async function createAndShowPlayerHandout(name, content, type, bookCode) {
  const subFolderName = bookCode
    ? getBookName(bookCode)
    : "";
  const folder = await utils.getFolder("journal", subFolderName, "Player Handouts", "#515fc8", "#515fc8", false);

  const options = {
    displaySheet: false,
  };
  const data = {
    name,
    folder: folder.id,
    permission: {
      default: CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER,
    },
  };
  switch (type) {
    case "image": {
      data.img = content;
      break;
    }
    case "text":
    default: {
      data.content = content;
    }
  }

  const tempJournal = await JournalEntry.create(data, options);

  tempJournal.show(type, true);
}
