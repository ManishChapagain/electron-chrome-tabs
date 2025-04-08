import { clipboard, Menu, MenuItem, WebContents } from "electron";
import TabbedWindow from "../core/TabbedWindow";

export function createContextMenu(
  parentWindow: TabbedWindow,
  webContents: WebContents,
  params: Electron.ContextMenuParams
): Menu {
  const menu = new Menu();

  const addItem = (label: string, click: () => void, enabled = true) => {
    menu.append(new MenuItem({ label, click, enabled }));
  };

  const addSeparator = () => menu.append(new MenuItem({ type: "separator" }));

  if (params.linkURL) {
    addItem("Open link in new tab", () =>
      parentWindow.addTab({ url: params.linkURL, background: true })
    );
    addItem("Open link in new window", () =>
      parentWindow.browser.createWindow({
        initialTabURL: params.linkText,
        ...parentWindow.options,
      })
    );
    addSeparator();
    addItem("Save link as...", () => webContents.downloadURL(params.linkURL));
    addItem("Copy link address", () => clipboard.writeText(params.linkURL));
    addSeparator();
  }

  // todo: video, audio, etc
  if (params.mediaType === "image") {
    addItem(`Open image in new tab`, () =>
      parentWindow.addTab({ url: params.srcURL, background: true })
    );
    addItem(`Save image as...`, () => webContents.downloadURL(params.srcURL));
    addItem(
      `Copy image`,
      () => webContents.copyImageAt(params.x, params.y),
      params.hasImageContents
    );
    addItem(`Copy image address`, () => clipboard.writeText(params.srcURL));
    addSeparator();
  }

  if (params.isEditable) {
    addItem("Undo", () => webContents.undo(), params.editFlags.canUndo);
    addItem("Redo", () => webContents.redo(), params.editFlags.canRedo);
    addSeparator();
    addItem("Cut", () => webContents.cut(), params.editFlags.canCut);
    addItem("Copy", () => webContents.copy(), params.editFlags.canCopy);
    addItem("Paste", () => webContents.paste(), params.editFlags.canPaste);
    addItem(
      "Paste as plain text",
      () => webContents.pasteAndMatchStyle(),
      params.editFlags.canPaste
    );
    addItem("Delete", () => webContents.delete(), params.editFlags.canDelete);
    addItem(
      "Select all",
      () => webContents.selectAll(),
      params.editFlags.canSelectAll
    );
    addSeparator();
  }
  if (params.selectionText) {
    if (!params.isEditable) {
      addItem("Copy", () => webContents.copy(), params.editFlags.canCopy);
    }

    const trimmedText = params.selectionText.trim();
    if (trimmedText.length > 0) {
      const shortText = trimmedText.substring(0, 20);
      const showEllipsis = trimmedText.length > 20 ? "..." : "";

      addItem(
        `Search ${parentWindow.options.defaultSearchEngine} for "${shortText}${showEllipsis}"`,
        () => {
          const searchURL = `${
            parentWindow.defaultSearchEngineUrl
          }${encodeURIComponent(trimmedText)}`;
          parentWindow.addTab({ url: searchURL });
        }
      );
    }
    addItem("Print...", () => webContents.print());
    addSeparator();
  }

  if (menu.items.length === 0) {
    addItem(
      "Back",
      () => webContents.navigationHistory.goBack(),
      webContents.navigationHistory.canGoBack()
    );
    addItem(
      "Forward",
      () => webContents.navigationHistory.goForward(),
      webContents.navigationHistory.canGoForward()
    );
    addItem("Reload", () => webContents.reload());
    addSeparator();
    addItem("Save as...", () => webContents.downloadURL(webContents.getURL()));
    addItem("Print...", () => webContents.print());
    addSeparator();
  }

  addItem("Inspect", () => webContents.inspectElement(params.x, params.y));

  return menu;
}
