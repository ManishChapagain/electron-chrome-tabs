# Electron Chrome Tabs

A lightweight, minimal library that adds tabbed browsing to your Electron applications. This simple implementation focuses on the core browser functionality.

[![NPM Version](https://img.shields.io/npm/v/electron-chrome-tabs.svg)](https://npmjs.org/package/electron-chrome-tabs)

## Features

- 🔄 Basic tabbed browsing experience
- 🔍 Simple URL bar with search engine fallback
- 🧩 Session management for cookies and storage
- 🧭 Basic navigation controls (back, forward, reload)
- ⚡ Lightweight and minimal
- 🛠️ Easy to integrate into any Electron application

## Current Limitations & Planned Features

This is a minimal implementation focused on core functionality. Unlike Chrome, it currently does not include:
- Bookmarks 
- Find-in-page
- Downloads manager
- Extensions
- Tab groups or tab pinning
- New Tab button (dblclick the tabs bar to open new tab for now)

and many more.

## Installation

```bash
npm install electron-chrome-tabs
```

## Basic Usage

```typescript
import { app } from "electron";
import { Browser } from "electron-chrome-tabs";

app.whenReady().then(() => {
  const browser = new Browser();

  browser.createWindow({
    defaultURL: "https://www.github.com",
    defaultSearchEngine: "duckduckgo",
  });
});
```

## Custom Session Example

```typescript
import { app, session } from "electron";
import { Browser } from "electron-chrome-tabs";

app.whenReady().then(() => {
  const customSession = session.fromPartition("persist:custom");
  const browser = new Browser();

  // Create a window with the custom session
  browser.createWindow({
    defaultURL: "https://www.github.com",
    customSession: customSession,
  });
});
```

## License

MIT
