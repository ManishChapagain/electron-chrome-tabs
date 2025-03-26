import { WebContentsView, BaseWindow } from "electron";
declare class Tab {
    private parentWindow;
    private navBarView;
    readonly id: number;
    readonly view: WebContentsView;
    constructor(parentWindow: BaseWindow, navBarView: WebContentsView, url: string);
}
export default Tab;
