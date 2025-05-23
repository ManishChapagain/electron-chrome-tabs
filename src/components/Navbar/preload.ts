import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import {
  TAB_ACTION,
  TAB_ACTION_TYPE,
  TAB_ADDED,
  TAB_UPDATED,
} from "../../utils/constants";

const ChromeTabs = require("chrome-tabs");

export type TabProperties = {
  id: number;
  url?: string;
  title?: string;
  favicon?: string[];
  background?: boolean;
  _internal?: boolean;
};

type TabCallback = (data: TabProperties) => void;

contextBridge.exposeInMainWorld("tabManagerBridge", {
  initChromeTabs: (containerSelector = ".chrome-tabs") => {
    const tabsContainer = document.querySelector(containerSelector);
    if (!tabsContainer) {
      throw new Error("ChromeTabs container not found");
    }

    const chromeTabs = new ChromeTabs();
    chromeTabs.init(tabsContainer);

    tabsContainer.addEventListener("activeTabChange", ({ detail }: any) => {
      const tabId = parseInt(detail.tabEl.dataset.tabId);
      if (tabId) {
        ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.SWITCH_TAB, { id: tabId });
      }
    });

    tabsContainer.addEventListener("tabAdd", async ({ detail }: any) => {
      if (!detail.tabEl.dataset.tabId) {
        const tabId = await ipcRenderer.invoke(
          TAB_ACTION_TYPE,
          TAB_ACTION.ADD_TAB,
          { _internal: true }
        );
        chromeTabs.updateTab(detail.tabEl, { id: tabId, title: "New Tab" });
        ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.SWITCH_TAB, { id: tabId });
      }
    });

    tabsContainer.addEventListener("tabRemove", ({ detail }: any) => {
      const tabId = parseInt(detail.tabEl.dataset.tabId);
      if (tabId) {
        ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.CLOSE_TAB, { id: tabId });
      }
    });

    return {
      addTab: (tabProperties: TabProperties) => {
        chromeTabs.addTab(tabProperties, {
          background: tabProperties.background,
        });
      },
      updateTab: (tabProperties: TabProperties) => {
        const tabEl = chromeTabs.tabEls.find(
          (t: HTMLElement) =>
            parseInt(t?.dataset.tabId || "0") === tabProperties.id
        );
        if (tabEl) {
          if (tabProperties.title) {
            chromeTabs.updateTab(tabEl, {
              title: tabProperties.title,
            });
          }
          if (tabProperties.favicon) {
            chromeTabs.updateTab(tabEl, {
              title: tabProperties.title,
              favicon: tabProperties.favicon[0],
            });
          }
        }
      },
      getActiveTabId: () => {
        return parseInt(chromeTabs.activeTabEl?.dataset.tabId);
      },
    };
  },
  addTab: async (url?: string) => {
    return await ipcRenderer.invoke(TAB_ACTION_TYPE, TAB_ACTION.ADD_TAB, {
      url,
    });
  },
  closeTab: (id: number) =>
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.CLOSE_TAB, { id }),
  switchTab: (id: number) =>
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.SWITCH_TAB, { id }),

  // Navigation functions
  navigate: (url: string) => {
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.NAVIGATE, { url });
  },
  reload: () => {
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.RELOAD);
  },
  goBack: () => {
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.GO_BACK);
  },
  goForward: () => {
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.GO_FORWARD);
  },

  onTabAdded: (callback: TabCallback) => {
    ipcRenderer.on(TAB_ADDED, (_: IpcRendererEvent, data: TabProperties) =>
      callback(data)
    );
  },
  onTabUpdated: (callback: TabCallback) => {
    ipcRenderer.on(TAB_UPDATED, (_: IpcRendererEvent, data: TabProperties) =>
      callback(data)
    );
  },
});
