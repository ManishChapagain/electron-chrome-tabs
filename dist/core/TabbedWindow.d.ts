declare class TabbedWindow {
    private window;
    private navBar;
    private tabs;
    private activeTab;
    private defaultURL;
    private defaultSearchEngineUrl;
    constructor(defaultURL?: string, defaultSearchEngine?: string);
    get id(): number;
    addTab(url?: string): number;
    switchTab(tabId: number): void;
    closeTab(tabId: number): void;
    private navigateActiveTab;
    private reloadActiveTab;
    private goBackActiveTab;
    private goForwardActiveTab;
    private setupIPC;
    private handleSyncTabAction;
    private handleAsyncTabAction;
    private resizeViews;
    private createMenu;
}
export default TabbedWindow;
