import { BaseWindow, WebContentsView } from "electron";
import path from "path";

class NavBar {
  public view: WebContentsView;

  constructor(private parentWindow: BaseWindow) {
    const libPath = path.dirname(
      eval("require.resolve")("electron-chrome-tabs")
    );

    this.view = new WebContentsView({
      webPreferences: {
        preload: path.join(libPath, "components", "Navbar", "preload.js"),
      },
    });

    this.view.webContents.openDevTools();

    this.view.webContents.loadFile(
      path.join(libPath, "components", "Navbar", "ui", "navbar.html")
    );

    this.parentWindow.contentView.addChildView(this.view);
  }

  get webContents() {
    return this.view.webContents;
  }

  send(event: string, data: any): void {
    this.webContents.send(event, data);
  }
}

export default NavBar;
