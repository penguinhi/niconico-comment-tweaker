# Niconico Comment Tweaker

**English** | [日本語](README.ja.md) | [简体中文](README.zh-CN.md)

A userscript that adjusts the **size** and **opacity** of comments on Niconico (nicovideo.jp) videos.

## Features

- **Comment size**: 50%–150%, with two methods to choose from
- **Comment opacity**: 10%–100%
- **UI language**: Japanese / Simplified Chinese / Traditional Chinese / English (follows the browser by default; can be switched manually)
- Settings are saved in the browser and kept across page reloads
- Works in fullscreen
- Supports both the PC site (`www.nicovideo.jp`) and the smartphone site (`sp.nicovideo.jp`)

## Installation

1. Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
2. Open `niconico-comment-tweaker.js` and install it with your userscript manager.
3. Open (or reload) a video page on Niconico.

## Usage

Open the settings panel in either of these ways:

- Click the round **blue button at the bottom-left** of the page
- Press **Alt+C** (Option+C on macOS)

### Settings

| Setting | Description |
| --- | --- |
| Size adjustment | How comment size is changed (see below) |
| Size | Comment size. 100% is the original size |
| Opacity | Opacity of the comment layer. Higher values make comments more solid; lower values make them more see-through. Default is 80% |
| Language | Language of the settings panel. "Auto" follows the browser language |
| Reset to defaults | Restores size and opacity settings (the language setting is kept) |

### Size adjustment methods

- **Font mode** (default): Changes the font size when comments are drawn. The change applies to comments that appear after you adjust it. At the maximum size, the edges of comments may overlap slightly.
- **Sprite mode**: Scales each already-drawn comment image, and the change applies immediately. When enlarged, comments overlap more easily.
- **No size change**: Only opacity is adjusted.
