import TabbedWindow from "./TabbedWindow";

class Browser {
  private windows: Map<number, TabbedWindow> = new Map();

  createWindow(
    defaultURL?: string,
    defaultSearchEngine?: string
  ): TabbedWindow {
    const newWindow = new TabbedWindow(defaultURL, defaultSearchEngine);
    this.windows.set(newWindow.id, newWindow);
    return newWindow;
  }

  getWindow(id: number): TabbedWindow | undefined {
    return this.windows.get(id);
  }

  getAllWindows(): Map<number, TabbedWindow> {
    return this.windows;
  }
}

export default Browser;
