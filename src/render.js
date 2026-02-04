import './wx-polyfill';

let SCREEN_WIDTH = 375;
let SCREEN_HEIGHT = 667;

// 浏览器环境
if (typeof window !== 'undefined' && document.getElementById) {
  console.log('[Render] Browser environment detected');
  const canvasElement = document.getElementById('gameCanvas');
  if (canvasElement) {
    window.canvas = canvasElement;
    
    // 设置Canvas大小为容器大小，确保与显示大小匹配
    const container = document.getElementById('canvas-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      SCREEN_WIDTH = rect.width;
      SCREEN_HEIGHT = rect.height;
    } else {
      // 回退到窗口大小
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      SCREEN_WIDTH = window.innerWidth;
      SCREEN_HEIGHT = window.innerHeight;
    }
    
    console.log('[Render] Canvas size:', { width: canvas.width, height: canvas.height });
    console.log('[Render] Screen size:', { width: SCREEN_WIDTH, height: SCREEN_HEIGHT });
  } else {
    console.error('[Render] Canvas element not found');
  }
} else {
  // 微信小游戏环境
  console.log('[Render] WeChat Mini Game environment detected');
  GameGlobal.canvas = wx.createCanvas();
  window.canvas = GameGlobal.canvas;
  
  const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  
  console.log('[Render] Window info:', windowInfo);
  
  canvas.width = windowInfo.screenWidth;
  canvas.height = windowInfo.screenHeight;
  
  SCREEN_WIDTH = windowInfo.screenWidth;
  SCREEN_HEIGHT = windowInfo.screenHeight;
  
  console.log('[Render] Canvas size:', { width: canvas.width, height: canvas.height });
}

export { SCREEN_WIDTH, SCREEN_HEIGHT };
