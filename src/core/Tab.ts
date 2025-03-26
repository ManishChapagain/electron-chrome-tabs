import { WebContentsView, BaseWindow } from "electron";
import {
  DID_NAVIGATE,
  DID_NAVIGATE_IN_PAGE,
  PAGE_FAVICON_UPDATED,
  PAGE_TITLE_UPDATED,
  TAB_UPDATED,
} from "../utils/constants";

class Tab {
  public readonly id: number;
  public readonly view: WebContentsView;

  constructor(
    private parentWindow: BaseWindow,
    private navBarView: WebContentsView,
    url: string
  ) {
    this.view = new WebContentsView();
    this.id = this.view.webContents.id;

    this.parentWindow.contentView.addChildView(this.view);
    this.view.webContents.loadURL(url);

    this.view.webContents.on(PAGE_TITLE_UPDATED, (_, title) => {
      // Notify the renderer process about the title change
      this.navBarView.webContents.send(TAB_UPDATED, {
        tabId: this.id,
        title: title,
      });
    });

    this.view.webContents.on(PAGE_FAVICON_UPDATED, (_, favicon) => {
      // Notify the renderer process about the title change
      this.navBarView.webContents.send(TAB_UPDATED, {
        tabId: this.id,
        title: this.view.webContents.getTitle(),
        favicon: favicon,
      });
    });

    this.view.webContents.on(DID_NAVIGATE, (_, url) => {
      // Notify the renderer process about the URL change
      this.navBarView.webContents.send(TAB_UPDATED, {
        tabId: this.id,
        url: url,
      });
    });

    this.view.webContents.on(DID_NAVIGATE_IN_PAGE, (_, url, isMainFrame) => {
      // Notify the renderer process about the URL change
      if (isMainFrame) {
        this.navBarView.webContents.send(TAB_UPDATED, {
          tabId: this.id,
          url: url,
        });
      }
    });
  }
}

export default Tab;
