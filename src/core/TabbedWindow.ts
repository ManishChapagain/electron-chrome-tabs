import { BaseWindow, Menu, MenuItemConstructorOptions } from "electron";
import Tab from "./Tab";
import NavBar from "../components/Navbar/Navbar";
import { TAB_ACTION, TAB_ACTION_TYPE } from "../utils/constants";

class TabbedWindow {
  private window: BaseWindow;
  private navBar: NavBar;
  private tabs: Tab[] = [];
  private activeTab: Tab | null = null;
  private defaultURL: string;
  private defaultSearchEngineUrl: string;

  constructor(defaultURL: string = "", defaultSearchEngine: string = "google") {
    this.defaultURL = defaultURL;
    this.defaultSearchEngineUrl = `https://www.${defaultSearchEngine}.com/search?q=`;

    this.window = new BaseWindow({
      width: 1024,
      height: 800,
      autoHideMenuBar: true,
    });
    this.window.setMinimumSize(300, 87);

    this.navBar = new NavBar(this.window);

    this.resizeViews();
    this.window.on("resize", () => this.resizeViews());

    this.setupIPC();
    this.createMenu();
  }

  get id(): number {
    return this.window.id;
  }

  addTab(url?: string): number {
    const tab = new Tab(this.window, this.navBar.view, url || this.defaultURL);
    this.tabs.push(tab);
    return tab.id;
  }

  switchTab(tabId: number): void {
    if (!tabId) return;

    if (this.activeTab?.id == tabId) return;

    if (this.activeTab) {
      this.activeTab?.view.setBounds({
        x: -9999,
        y: -9999,
        width: 1,
        height: 1,
      }); // Move active tab off-screen
    }

    // Show the new active tab
    const newTab = this.tabs.find((tab: Tab) => tab.id == tabId);
    if (newTab) {
      this.activeTab = newTab;
      this.resizeViews(); // Resize to fit the content area
      this.activeTab?.view?.webContents?.focus();
    }

    this.navBar.view.webContents.send("tab-updated", {
      tabId: tabId,
      url: newTab?.view.webContents.getURL(),
    });
  }

  closeTab(tabId: number): void {
    if (!tabId) return;

    const tab = this.tabs.find((tab) => tab.id == tabId);
    if (tab) {
      this.window.contentView.removeChildView(tab.view);

      tab.view.webContents.removeAllListeners();
      tab.view.webContents.close();

      this.tabs.splice(this.tabs.indexOf(tab), 1);

      // Switch to another tab if available
      if (this.tabs.length > 0) {
        const nextTabId = this.tabs[0].id;
        this.switchTab(nextTabId);
      } else {
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
        this.closeTab(data?.tabId);
        break;
      case TAB_ACTION.SWITCH_TAB:
        this.switchTab(data?.tabId);
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
        return this.addTab(data?.url);
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
