import { BaseWindow, WebContentsView } from "electron";
declare class NavBar {
    private parentWindow;
    view: WebContentsView;
    constructor(parentWindow: BaseWindow);
    get webContents(): Electron.WebContents;
    send(event: string, data: any): void;
}
export default NavBar;
