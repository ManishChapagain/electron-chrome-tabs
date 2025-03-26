import { BaseWindow, WebContentsView } from "electron";
import path from "path";

class NavBar {
  public view: WebContentsView;

  constructor(private parentWindow: BaseWindow) {
    this.view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, "components", "Navbar", "preload.js"),
      },
    });

    this.view.webContents.openDevTools();

    this.view.webContents.loadFile(
      path.join(__dirname, "components", "Navbar", "ui", "navbar.html")
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
