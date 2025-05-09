import {
  BaseWindow,
  Menu,
  MenuItemConstructorOptions,
  session,
  WebContentsViewConstructorOptions,
} from "electron";
import Tab from "./Tab";
import NavBar from "../components/Navbar/Navbar";
import {
  TAB_ACTION,
  TAB_ACTION_TYPE,
  TAB_ADDED,
  TAB_UPDATED,
} from "../utils/constants";
import { Session } from "electron";
import Browser from "./Browser";
import { TabProperties } from "../components/Navbar/preload";
import EventEmitter from "events";

export interface TabbedWindowOptions {
  defaultURL?: string;
  defaultSearchEngine?: string;
  customSession?: Session;
  initialTabURL?: string;
}

class TabbedWindow extends EventEmitter {
  readonly options: TabbedWindowOptions;
  readonly browser: Browser;
  readonly window: BaseWindow;
  readonly navBar: NavBar;
  readonly defaultSearchEngine: string;
  readonly defaultSearchEngineUrl: string;
  readonly tabs: Tab[] = [];
  activeTab: Tab | null = null;

  constructor(browser: Browser, options: TabbedWindowOptions) {
    super();
    this.options = options;
    this.browser = browser;

    this.defaultSearchEngine = this.options.defaultSearchEngine || "google";
    this.defaultSearchEngineUrl = `https://www.${this.defaultSearchEngine}.com/search?q=`;

    this.window = new BaseWindow({
      width: 1024,
      height: 800,
      autoHideMenuBar: true,
    });
    this.window.setMinimumSize(300, 87);

    this.navBar = new NavBar(this.window);
    this.createMenu();

    // emit ready when the navbar is ready
    this.navBar.webContents.once("did-finish-load", () => {
      this.resizeViews();
      this.window.on("resize", () => this.resizeViews());
      this.setupIPC();
      this.addTab({ url: this.options.initialTabURL });

      this.emit("ready");
    });
  }

  get id(): number {
    return this.window.id;
  }

  // internal parameter needed since we don't want to send the tab-added
  // event to the navbar when we add a new tab from the navbar itself
  // todo: find a better way to handle this
  addTab({
    url,
    background = false,
    _internal = false,
    webContentsViewConstructorOptions,
  }: {
    url?: string;
    background?: boolean;
    _internal?: boolean;
    webContentsViewConstructorOptions?: WebContentsViewConstructorOptions;
  } = {}): number {
    const tab = new Tab(
      this,
      url || this.options.defaultURL || "",
      webContentsViewConstructorOptions,
      this.options.customSession || session.defaultSession
    );
    this.tabs.push(tab);

    if (!_internal) {
      const tabProperties: TabProperties = {
        id: tab.id,
        url: url || this.options.defaultURL,
        background,
      };
      this.navBar.webContents.send(TAB_ADDED, tabProperties);
    }

    return tab.id;
  }

  switchTab(id: number): void {
    if (!id) return;

    if (this.activeTab?.id == id) return;

    if (this.activeTab) {
      this.activeTab?.view.setBounds({
        x: -9999,
        y: -9999,
        width: 1,
        height: 1,
      }); // Move active tab off-screen
    }

    // Show the new active tab
    const newTab = this.tabs.find((tab: Tab) => tab.id == id);
    if (newTab) {
      this.activeTab = newTab;
      this.resizeViews(); // Resize to fit the content area
      this.activeTab?.view?.webContents?.focus();
    }
    const tabProperties: TabProperties = {
      id,
      url: newTab?.view.webContents.getURL(),
    };
    this.navBar.webContents.send(TAB_UPDATED, tabProperties);
  }

  closeTab(id: number): void {
    if (!id) return;

    const tab = this.tabs.find((tab) => tab.id == id);
    if (tab) {
      this.window.contentView.removeChildView(tab.view);

      tab.view.webContents.removeAllListeners();
      tab.view.webContents.close();

      this.tabs.splice(this.tabs.indexOf(tab), 1);

      if (this.tabs.length < 1) {
        this.window.close();
      }
    }
  }

  // Additional methods for navigation, reload, etc.
  private navigateActiveTab(url: string): void {
    if (!url) return;

    if (!url.includes(".") && url !== "localhost") {
      url = `${this.defaultSearchEngineUrl}${encodeURIComponent(url)}`;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    if (this.activeTab) {
      this.activeTab.view.webContents.loadURL(url);
    }
  }

  private reloadActiveTab(): void {
    if (this.activeTab) {
      this.activeTab.view.webContents.reload();
    }
  }

  private goBackActiveTab(): void {
    if (
      this.activeTab &&
      this.activeTab.view.webContents.navigationHistory.canGoBack()
    ) {
      this.activeTab.view.webContents.navigationHistory.goBack();
    }
  }

  private goForwardActiveTab(): void {
    if (
      this.activeTab &&
      this.activeTab.view.webContents.navigationHistory.canGoForward()
    ) {
      this.activeTab.view.webContents.navigationHistory.goForward();
    }
  }

  private setupIPC(): void {
    this.navBar.webContents.ipc.on(TAB_ACTION_TYPE, (_, action, data) => {
      this.handleSyncTabAction(action, data);
    });

    this.navBar.webContents.ipc.handle(
      TAB_ACTION_TYPE,
      async (_, action, data) => {
        return this.handleAsyncTabAction(action, data);
      }
    );
  }

  private handleSyncTabAction(action: string, data: any): void {
    switch (action) {
      case TAB_ACTION.CLOSE_TAB:
        this.closeTab(data?.id);
        break;
      case TAB_ACTION.SWITCH_TAB:
        this.switchTab(data?.id);
        break;
      case TAB_ACTION.NAVIGATE:
        this.navigateActiveTab(data?.url);
        break;
      case TAB_ACTION.RELOAD:
        this.reloadActiveTab();
        break;
      case TAB_ACTION.GO_BACK:
        this.goBackActiveTab();
        break;
      case TAB_ACTION.GO_FORWARD:
        this.goForwardActiveTab();
        break;
      default:
        break;
    }
  }

  private async handleAsyncTabAction(action: string, data: any): Promise<any> {
    switch (action) {
      case TAB_ACTION.ADD_TAB:
        return this.addTab({
          url: data?.url,
          background: data?.background,
          _internal: data?._internal,
        });
      default:
        return null;
    }
  }

  private resizeViews(): void {
    const bounds = this.window.getContentBounds();

    // Set the bounds for the navigation bar view
    this.navBar.view.setBounds({
      x: 0,
      y: 0,
      width: bounds.width,
      height: 87,
    });

    // Resize the active tab view
    if (this.activeTab) {
      const contentView = this.activeTab.view;
      if (contentView) {
        contentView.setBounds({
          x: 0,
          y: 87,
          width: bounds.width,
          height: bounds.height - 87,
        });
      }
    }
  }

  private createMenu(): void {
    const template: MenuItemConstructorOptions[] = [
      {
        label: "File",
        submenu: [
          {
            label: "New Tab",
            accelerator: "CmdOrCtrl+T",
            click: () => {
              this.addTab();
            },
          },
          { type: "separator" },
          { role: "quit" },
        ],
      },
      {
        label: "View",
        submenu: [
          {
            label: "Toggle DevTools",
            accelerator:
              process.platform == "darwin" ? "Cmd+Alt+I" : "Ctrl+Shift+I",
            click: () => {
              if (this.activeTab) {
                this.activeTab?.view?.webContents?.toggleDevTools();
              }
            },
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    this.window.setMenu(menu);
  }
}

export default TabbedWindow;
