// 定义GameGlobal全局对象
if (!window.GameGlobal) {
  window.GameGlobal = window;
}

// 确保wx对象存在
if (!window.wx) {
  window.wx = {
    createCanvas: () => document.getElementById('gameCanvas'),
    getWindowInfo: () => ({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    }),
    getSystemInfoSync: () => ({
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight
    })
  };
}

GameGlobal.canvas = wx.createCanvas();
window.canvas = GameGlobal.canvas;

const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();

canvas.width = windowInfo.screenWidth;
canvas.height = windowInfo.screenHeight;

export const SCREEN_WIDTH = windowInfo.screenWidth;
export const SCREEN_HEIGHT = windowInfo.screenHeight;