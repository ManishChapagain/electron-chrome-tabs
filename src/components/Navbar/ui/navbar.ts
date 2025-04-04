import { TabProperties } from "../preload";
import "./navbar.css";

// Access the tabManagerBridge from preload.js
const tabManager = (window as any).tabManagerBridge || {};

// Initialize Chrome Tabs
const chromeTabsApi = tabManager.initChromeTabs();

tabManager.onTabAdded((data: TabProperties) => {
  chromeTabsApi.addTab(data);
});

tabManager.onTabUpdated((data: TabProperties) => {
  chromeTabsApi.updateTab(data);

  if (data.url !== null && data.url !== undefined) {
    const addressInput = document.getElementById(
      "address-input"
    ) as HTMLInputElement;
    if (addressInput) {
      addressInput.value = data.url;
    }
  }
});

document.getElementById("back-button")?.addEventListener("click", () => {
  const activeTabId = chromeTabsApi.getActiveTabId();
  if (activeTabId) {
    tabManager.goBack();
  }
});

document.getElementById("forward-button")?.addEventListener("click", () => {
  const activeTabId = chromeTabsApi.getActiveTabId();
  if (activeTabId) {
    tabManager.goForward();
  }
});

document.getElementById("reload-button")?.addEventListener("click", () => {
  const activeTabId = chromeTabsApi.getActiveTabId();
  if (activeTabId) {
    tabManager.reload();
  }
});

document.getElementById("address-input")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const input = e.target as HTMLInputElement;
    const url = input.value;
    const activeTabId = chromeTabsApi.getActiveTabId();
    if (activeTabId) {
      tabManager.navigate(url);
    }
  }
});
