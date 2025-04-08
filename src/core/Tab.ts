import {
  WebContentsView,
  HandlerDetails,
  BrowserWindowConstructorOptions,
  webContents,
  WebContentsViewConstructorOptions,
  BrowserWindow,
  WebContents,
  WindowOpenHandlerResponse,
  Session,
} from "electron";
import {
  DID_NAVIGATE,
  DID_NAVIGATE_IN_PAGE,
  PAGE_FAVICON_UPDATED,
  PAGE_TITLE_UPDATED,
  TAB_UPDATED,
} from "../utils/constants";
import TabbedWindow from "./TabbedWindow";
import { createContextMenu } from "../utils/context-menu";

class Tab {
  public readonly id: number;
  public readonly view: WebContentsView;

  constructor(
    private parentWindow: TabbedWindow,
    private url: string,
    private webContentsViewConstructorOptions:
      | WebContentsViewConstructorOptions
      | undefined,
    private customSession: Session
  ) {
    // issue with undefined webcontents
    if (!webContentsViewConstructorOptions?.webContents) {
      this.view = new WebContentsView({
        webPreferences: {
          session: this.customSession,
          ...(this.webContentsViewConstructorOptions?.webPreferences || {}),
        },
      });
    } else {
      this.view = new WebContentsView({
        webPreferences: {
          session: this.customSession,
          ...(this.webContentsViewConstructorOptions?.webPreferences || {}),
        },
        webContents: webContentsViewConstructorOptions.webContents,
      });
    }

    this.id = this.view.webContents.id;

    this.parentWindow.window.contentView.addChildView(this.view);
    this.view.webContents.loadURL(this.url);

    this.view.webContents.on(PAGE_TITLE_UPDATED, (_, title) => {
      // Notify the renderer process about the title change
      this.navBar.webContents.send(TAB_UPDATED, {
        id: this.id,
        title: title,
      });
    });

    this.view.webContents.on(PAGE_FAVICON_UPDATED, (_, favicon) => {
      // Notify the renderer process about the title change
      this.navBar.webContents.send(TAB_UPDATED, {
        id: this.id,
        title: this.view.webContents.getTitle(),
        favicon: favicon,
      });
    });

    this.view.webContents.on(DID_NAVIGATE, (_, url) => {
      // Notify the renderer process about the URL change
      this.navBar.webContents.send(TAB_UPDATED, {
        id: this.id,
        url: url,
      });
    });

    this.view.webContents.on(DID_NAVIGATE_IN_PAGE, (_, url, isMainFrame) => {
      // Notify the renderer process about the URL change
      if (isMainFrame) {
        this.navBar.webContents.send(TAB_UPDATED, {
          id: this.id,
          url: url,
        });
      }
    });

    this.view.webContents.setWindowOpenHandler((details: HandlerDetails) =>
      this.handleWindowOpen(details)
    );

    this.view.webContents.on("context-menu", (_, params) => {
      const menu = createContextMenu(
        this.parentWindow,
        this.view.webContents,
        params
      );
      menu.popup();
    });
  }

  get navBar() {
    return this.parentWindow.navBar;
  }

  handleWindowOpen(details: HandlerDetails): WindowOpenHandlerResponse {
    const allowWith = (
      createWindow: (options: any) => WebContents
    ): WindowOpenHandlerResponse => ({
      action: "allow",
      outlivesOpener: true,
      createWindow,
    });

    const createTab = (
      options: WebContentsViewConstructorOptions,
      background = false
    ) => {
      const tabId = this.parentWindow.addTab({
        url: details.url,
        background,
        webContentsViewConstructorOptions: options,
      });
      return webContents.fromId(tabId)!;
    };

    const createBrowserWindow = (options: BrowserWindowConstructorOptions) => {
      const win = new BrowserWindow(options);
      win.webContents.setWindowOpenHandler((details: HandlerDetails) =>
        this.handleWindowOpen(details)
      );
      return win.webContents;
    };

    const createTabbedWindow = () => {
      const tabbedWindow = this.parentWindow.browser.createWindow({
        initialTabURL: details.url,
        ...this.parentWindow.options,
      });
      return tabbedWindow.tabs[0].view.webContents;
    };

    switch (details.disposition) {
      case "foreground-tab":
        return allowWith((options) => createTab(options));
      case "background-tab":
        return allowWith((options) => createTab(options, true));
      case "new-window":
        if (details.features) {
          return allowWith((options) => createBrowserWindow(options));
        } else {
          return allowWith(() => createTabbedWindow());
        }
      default:
        return { action: "allow" };
    }
  }
}

export default Tab;
