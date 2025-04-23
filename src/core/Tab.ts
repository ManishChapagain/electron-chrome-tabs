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
import { TabProperties } from "../components/Navbar/preload";

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

    const sendTabUpdate = (update: Partial<TabProperties>) => {
      this.parentWindow.navBar.webContents.send(TAB_UPDATED, {
        id: this.id,
        ...update,
      });
    };

    this.view.webContents.on(PAGE_TITLE_UPDATED, (_, title) =>
      sendTabUpdate({ title })
    );

    this.view.webContents.on(PAGE_FAVICON_UPDATED, (_, favicon) =>
      sendTabUpdate({ title: this.view.webContents.getTitle(), favicon })
    );

    this.view.webContents.on(DID_NAVIGATE, (_, url) => sendTabUpdate({ url }));

    this.view.webContents.on(DID_NAVIGATE_IN_PAGE, (_, url, isMainFrame) => {
      if (isMainFrame) {
        sendTabUpdate({ url });
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

      win.webContents.on("context-menu", (_, params) => {
        const menu = createContextMenu(
          this.parentWindow,
          win.webContents,
          params
        );
        menu.popup();
      });
      return win.webContents;
    };

    const createTabbedWindow = () => {
      this.parentWindow.browser.createWindow({
        ...this.parentWindow.options,
        initialTabURL: details.url,
      });
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
          createTabbedWindow();
          return { action: "deny" };
        }
      default:
        return { action: "allow" };
    }
  }
}

export default Tab;
