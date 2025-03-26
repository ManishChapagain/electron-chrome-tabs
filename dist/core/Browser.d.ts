import TabbedWindow from "./TabbedWindow";
declare class Browser {
    private windows;
    createWindow(defaultURL?: string, defaultSearchEngine?: string): TabbedWindow;
    getWindow(id: number): TabbedWindow | undefined;
    getAllWindows(): Map<number, TabbedWindow>;
}
export default Browser;
