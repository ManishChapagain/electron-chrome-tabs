import TabbedWindow, { TabbedWindowOptions } from "./TabbedWindow";

class Browser {
  private windows: Map<number, TabbedWindow> = new Map();

  createWindow(options: TabbedWindowOptions = {}): TabbedWindow {
    const newWindow = new TabbedWindow(this, options);
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
