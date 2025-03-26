import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";
import {
  TAB_ACTION,
  TAB_ACTION_TYPE,
  TAB_UPDATED,
} from "../../utils/constants";

const ChromeTabs = require("chrome-tabs");

type TabProperties = {
  tabId: string;
  url?: string;
  title?: string;
  favicon?: string;
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
      const tabId = detail.tabEl.dataset.tabId;
      if (tabId) {
        ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.SWITCH_TAB, { tabId });
      }
    });

    tabsContainer.addEventListener("tabAdd", async ({ detail }: any) => {
      const addedTabEl = detail.tabEl;

      if (!addedTabEl) return;

      const tabId = await ipcRenderer.invoke(
        TAB_ACTION_TYPE,
        TAB_ACTION.ADD_TAB,
        {}
      );

      chromeTabs.updateTab(addedTabEl, { id: tabId, title: "New Tab" });
      ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.SWITCH_TAB, { tabId });
    });

    tabsContainer.addEventListener("tabRemove", ({ detail }: any) => {
      const tabId = detail.tabEl.dataset.tabId;
      if (tabId) {
        ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.CLOSE_TAB, { tabId });
      }
    });

    chromeTabs.addTab();

    return {
      updateTab: (
        tabId: string,
        properties: { title?: string; favicon?: string[] }
      ) => {
        const tabEl = chromeTabs.tabEls.find(
          (t: HTMLElement) => t.dataset.tabId === tabId
        );
        if (tabEl) {
          if (properties.title) {
            chromeTabs.updateTab(tabEl, {
              title: properties.title,
            });
          }
          if (properties.favicon) {
            chromeTabs.updateTab(tabEl, {
              title: properties.title,
              favicon: properties.favicon[0],
            });
          }
        }
      },
      getActiveTabId: () => {
        return chromeTabs.activeTabEl?.dataset.tabId;
      },
      addNewTab: () => chromeTabs.addTab(),
    };
  },
  addTab: async (url?: string) => {
    return await ipcRenderer.invoke(TAB_ACTION_TYPE, TAB_ACTION.ADD_TAB, {
      url,
    });
  },
  closeTab: (tabId: string) =>
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.CLOSE_TAB, { tabId }),
  switchTab: (tabId: string) =>
    ipcRenderer.send(TAB_ACTION_TYPE, TAB_ACTION.SWITCH_TAB, { tabId }),

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

  onTabUpdated: (callback: TabCallback) => {
    ipcRenderer.on(TAB_UPDATED, (_: IpcRendererEvent, data: TabProperties) =>
      callback(data)
    );
  },
});
