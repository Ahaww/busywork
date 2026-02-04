// 定义GameGlobal全局对象
if (!window.GameGlobal) {
  window.GameGlobal = window;
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const keyboardInput = document.getElementById('keyboard-input');

let keyboardCallback = null;
let keyboardConfirmCallback = null;
let keyboardCompleteCallback = null;

function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  const dpr = window.devicePixelRatio || 1;
  const rect = container.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  
  ctx.scale(dpr, dpr);
  
  window.SCREEN_WIDTH = rect.width;
  window.SCREEN_HEIGHT = rect.height;
}

window.wx = {
  createCanvas: () => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return canvas;
  },
  
  getWindowInfo: () => ({
    screenWidth: window.SCREEN_WIDTH,
    screenHeight: window.SCREEN_HEIGHT,
    pixelRatio: window.devicePixelRatio || 1
  }),
  
  getSystemInfoSync: () => ({
    screenWidth: window.SCREEN_WIDTH,
    screenHeight: window.SCREEN_HEIGHT,
    pixelRatio: window.devicePixelRatio || 1
  }),
  
  onTouchStart: (callback) => {
    console.log('[WX-Polyfill] onTouchStart called with callback:', callback);
    
    // 触摸事件
    const touchStartHandler = (e) => {
      console.log('[WX-Polyfill] TouchStart event:', e);
      e.preventDefault();
      callback({
        touches: Array.from(e.touches).map(t => ({
          clientX: t.clientX,
          clientY: t.clientY
        }))
      });
    };
    canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
    
    // 鼠标事件（模拟触摸开始）
    const mouseDownHandler = (e) => {
      console.log('[WX-Polyfill] MouseDown event:', e);
      e.preventDefault();
      callback({
        touches: [{
          clientX: e.clientX,
          clientY: e.clientY
        }]
      });
    };
    canvas.addEventListener('mousedown', mouseDownHandler, { passive: false });
    
    // 保存处理器以便后续移除
    callback._touchStartHandler = touchStartHandler;
    callback._mouseDownHandler = mouseDownHandler;
  },
  
  onTouchMove: (callback) => {
    console.log('[WX-Polyfill] onTouchMove called with callback:', callback);
    
    // 触摸事件
    const touchMoveHandler = (e) => {
      console.log('[WX-Polyfill] TouchMove event:', e);
      e.preventDefault();
      callback({
        touches: Array.from(e.touches).map(t => ({
          clientX: t.clientX,
          clientY: t.clientY
        }))
      });
    };
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
    
    // 鼠标事件（模拟触摸移动）
    const mouseMoveHandler = (e) => {
      console.log('[WX-Polyfill] MouseMove event:', e);
      e.preventDefault();
      callback({
        touches: [{
          clientX: e.clientX,
          clientY: e.clientY
        }]
      });
    };
    canvas.addEventListener('mousemove', mouseMoveHandler, { passive: false });
    
    // 保存处理器以便后续移除
    callback._touchMoveHandler = touchMoveHandler;
    callback._mouseMoveHandler = mouseMoveHandler;
  },
  
  onTouchEnd: (callback) => {
    console.log('[WX-Polyfill] onTouchEnd called with callback:', callback);
    
    // 触摸事件
    const touchEndHandler = (e) => {
      console.log('[WX-Polyfill] TouchEnd event:', e);
      e.preventDefault();
      callback({
        changedTouches: Array.from(e.changedTouches).map(t => ({
          clientX: t.clientX,
          clientY: t.clientY
        }))
      });
    };
    canvas.addEventListener('touchend', touchEndHandler, { passive: false });
    
    // 鼠标事件（模拟触摸结束）
    const mouseUpHandler = (e) => {
      console.log('[WX-Polyfill] MouseUp event:', e);
      e.preventDefault();
      callback({
        changedTouches: [{
          clientX: e.clientX,
          clientY: e.clientY
        }]
      });
    };
    canvas.addEventListener('mouseup', mouseUpHandler, { passive: false });
    
    // 保存处理器以便后续移除
    callback._touchEndHandler = touchEndHandler;
    callback._mouseUpHandler = mouseUpHandler;
  },
  
  offTouchStart: (callback) => {
    canvas.removeEventListener('touchstart', callback);
    canvas.removeEventListener('mousedown', callback);
  },
  
  offTouchMove: (callback) => {
    canvas.removeEventListener('touchmove', callback);
    canvas.removeEventListener('mousemove', callback);
  },
  
  offTouchEnd: (callback) => {
    canvas.removeEventListener('touchend', callback);
    canvas.removeEventListener('mouseup', callback);
  },
  
  showKeyboard: (options) => {
    keyboardInput.value = options.defaultValue || '';
    keyboardInput.focus();
    
    keyboardInput.oninput = (e) => {
      if (keyboardCallback) {
        keyboardCallback({ value: e.target.value });
      }
    };
    
    keyboardInput.onkeydown = (e) => {
      if (e.key === 'Enter' && keyboardConfirmCallback) {
        keyboardConfirmCallback();
      }
    };
    
    keyboardInput.onblur = () => {
      if (keyboardCompleteCallback) {
        keyboardCompleteCallback();
      }
    };
  },
  
  hideKeyboard: () => {
    keyboardInput.blur();
  },
  
  onKeyboardInput: (callback) => {
    keyboardCallback = callback;
  },
  
  onKeyboardConfirm: (callback) => {
    keyboardConfirmCallback = callback;
  },
  
  onKeyboardComplete: (callback) => {
    keyboardCompleteCallback = callback;
  },
  
  showToast: (options) => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      z-index: 9999;
      max-width: 80%;
      text-align: center;
    `;
    toast.textContent = options.title || options.message || '';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, options.duration || 2000);
  },
  
  setStorage: (options) => {
    try {
      localStorage.setItem(options.key, JSON.stringify(options.data));
      if (options.success) options.success();
    } catch (e) {
      if (options.fail) options.fail(e);
    }
  },
  
  getStorage: (options) => {
    try {
      const data = JSON.parse(localStorage.getItem(options.key));
      if (options.success) options.success({ data });
    } catch (e) {
      if (options.fail) options.fail(e);
    }
  },
  
  removeStorage: (options) => {
    try {
      localStorage.removeItem(options.key);
      if (options.success) options.success();
    } catch (e) {
      if (options.fail) options.fail(e);
    }
  },
  
  request: (options) => {
    const { url, method, data, header, success, fail } = options;
    
    fetch(url, {
      method: method || 'GET',
      headers: header || {},
      body: data ? JSON.stringify(data) : undefined
    })
    .then(res => res.json())
    .then(res => {
      if (success) success({ data: res, statusCode: res.statusCode || 200 });
    })
    .catch(err => {
      if (fail) fail({ errMsg: err.message });
    });
  }
};

export default window.wx;
