# niconico 弹幕显示调整

[English](https://github.com/penguinhi/niconico-comment-tweaker/blob/master/README.md) | [日本語](https://github.com/penguinhi/niconico-comment-tweaker/blob/master/README.ja.md) | **简体中文**

调整 niconico 动画（nicovideo.jp）弹幕**大小**和**不透明度**的用户脚本。

## 功能

- **弹幕大小**：50%～150%，可选两种调整方式
- **弹幕不透明度**：10%～100%
- **界面语言**：日本語 / 简体中文 / 繁體中文 / English（默认跟随浏览器，也可手动切换）
- 设置保存在浏览器中，刷新页面后依然有效
- 支持全屏
- 支持电脑版（`www.nicovideo.jp`）和手机版（`sp.nicovideo.jp`）

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/) 等用户脚本管理器。
2. 打开 [niconico-comment-tweaker.user.js](https://github.com/penguinhi/niconico-comment-tweaker/raw/master/niconico-comment-tweaker.user.js)，脚本管理器会弹出安装页面，点击安装即可。
3. 打开 niconico 的视频页面（已打开的请刷新）。

## 使用方法

用以下任一方式打开设置面板：

- 点击页面**左下角的蓝色圆形按钮**
- 按 **Alt+C**（macOS 上为 Option+C）

### 设置项

| 设置项 | 说明 |
| --- | --- |
| 大小调整方式 | 改变弹幕大小的方式（见下文） |
| 字号 | 弹幕大小，100% 为原始大小 |
| 不透明度 | 弹幕层的不透明度。数值越大越清晰，越小越透明。默认为 80% |
| 语言 | 设置面板的显示语言。"自动"表示跟随浏览器语言 |
| 恢复默认 | 将大小和不透明度相关设置恢复为默认值（语言设置保持不变） |

### 大小调整方式

- **字体模式**（默认）：在绘制弹幕时修改字号。调整后新出现的弹幕才会生效。放到最大时，弹幕边缘可能会有少许重叠。
- **贴图模式**：直接缩放已经绘制好的每条弹幕图像，立即生效。放大后弹幕更容易互相重叠。
- **不调整大小**：只调整不透明度。

## 许可证

[MIT](https://github.com/penguinhi/niconico-comment-tweaker/blob/master/LICENSE)
