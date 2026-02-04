import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import deepseekApi from '../services/deepseek-api';
import dialogueManager from '../services/dialogue-manager';

/**
 * DeepSeek API Client 聊天界面
 */
export default class ChatInterface extends Emitter {
  constructor() {
    super();
    
    // 消息列表
    this.messages = [];
    
    // 输入框相关
    this.inputText = '';
    this.inputY = SCREEN_HEIGHT - 60; // 输入框位置
    this.inputHeight = 50;
    this.inputPadding = 10;
    this.isInputActive = false;
    this.isKeyboardVisible = false;
    
    // 运行环境标记 - 只有在真实的微信环境中才为true
    this.isWxEnv = false;
    console.log('[ChatInterface] isWxEnv:', this.isWxEnv);
    
    // 微信风格 UI 尺寸
    this.statusBarHeight = 88; // 标题栏高度增加
    this.avatarSize = 38;
    this.sidePadding = 12;
    this.bubbleRadius = 6;
    this.bubbleTailSize = 8;
    
    // 消息列表相关（确保在标题栏下方，留出足够空间）
    this.messageStartY = this.statusBarHeight + 16;
    this.messagePadding = 14; // 消息间距
    this.messageMaxWidth = SCREEN_WIDTH * 0.62; // 更接近微信的气泡宽度
    this.messageBubblePadding = 12; // 气泡内边距
    this.messageLineHeight = 24; // 行高
    
    // 滚动位置
    this.scrollY = 0;
    this.maxScrollY = 0;
    
    // 内容垂直偏移量（默认为0，不再额外上移）
    this.contentOffsetY = 0;
    
    // 光标闪烁相关
    this.cursorBlinkTime = 0;
    this.cursorVisible = true;
    this.lastCursorUpdate = Date.now();
    
    // 预创建触摸事件处理函数，便于绑定/解绑
    this.boundTouchHandlers = {
      onTouchStart: this.touchStartHandler.bind(this),
      onTouchMove: this.touchMoveHandler.bind(this),
      onTouchEnd: this.touchEndHandler.bind(this)
    };
    
    // 文本测量上下文（用于计算换行和宽度）
    if (typeof canvas !== 'undefined') {
      this.measureCtx = canvas.getContext('2d');
      this.measureCtx.font = '18px Arial';
    } else {
      this.measureCtx = null;
    }
    
    // 绑定触摸事件
    this.bindDirectTouchEvents();
    
    // 绑定键盘输入（微信小游戏环境）
    this.setupKeyboard();
    
    // 绑定鼠标滚轮事件（浏览器环境）
    this.setupMouseWheel();
    
    // 绑定键盘高度变化事件（微信小游戏环境）
    this.setupKeyboardHeightChange();
    
    // 初始化
    this.initialize();
    
    // 添加欢迎消息
    this.addMessage('DeepSeek', '你好！我叫A', false);
    
    this.autoReplyEnabled = false; // 禁用自动回复，使用API回复
  }
  
  /**
   * 初始化DeepSeek API Client
   */
  async initialize() {
    // 加载性格描述
    await dialogueManager.loadPersonality();
    
    // 初始化对话历史
    dialogueManager.initializeHistory();
  }
  
  /**
   * 设置API Key
   */
  setApiKey(apiKey) {
    deepseekApi.setApiKey(apiKey);
  }
  
  /**
   * 设置对话历史限制
   */
  setHistoryLimit(limit) {
    dialogueManager.setHistoryLimit(limit);
  }
  
  /**
   * 启用/禁用对话历史截断
   */
  setHistoryTruncation(enabled) {
    dialogueManager.setHistoryTruncation(enabled);
  }
  
  setupKeyboard() {
    // 微信小游戏环境下的键盘输入处理
    if (typeof wx !== 'undefined') {
      // 监听键盘输入
      if (wx.onKeyboardInput) {
        wx.onKeyboardInput((res) => {
          console.log('[Keyboard] Input:', res);
          if (res.value !== undefined) {
            this.inputText = res.value;
          }
        });
      }
      
      // 监听键盘确认（Enter键或发送按钮）
      if (wx.onKeyboardConfirm) {
        wx.onKeyboardConfirm(() => {
          console.log('[Keyboard] Confirm');
          // 直接发送消息，不检查isInputActive状态
          this.sendMessage();
        });
      }
      
      // 监听键盘完成（键盘关闭）
      if (wx.onKeyboardComplete) {
        wx.onKeyboardComplete(() => {
          console.log('[Keyboard] Complete');
          this.isInputActive = false;
          this.lastCursorUpdate = Date.now(); // 重置光标闪烁时间
        });
      }
    }
  }
  
  /**
   * 添加消息
   * @param {string} sender - 发送者（'我' 或 '对方'）
   * @param {string} text - 消息内容
   * @param {boolean} isMe - 是否是我发送的
   */
  addMessage(sender, text, isMe = true) {
    const message = {
      sender,
      text: String(text),
      isMe,
      timestamp: Date.now()
    };
    
    this.messages.push(message);
    
    // 计算消息高度并更新滚动位置
    this.updateScrollPosition();
  }
  
  /**
   * 更新滚动位置
   */
  updateScrollPosition() {
    const wasNearBottom = this.scrollY >= this.maxScrollY - 10;
    
    // 计算总内容高度
    let totalHeight = 0;
    this.messages.forEach(msg => {
      const metrics = this.getMessageMetrics(msg);
      totalHeight += metrics.totalHeight + this.messagePadding;
    });
    
    // 计算可见区域高度（消息从 messageStartY 开始，到输入框上方预留 10px 间距）
    const visibleHeight = Math.max(
      0,
      this.inputY - this.messageStartY - 10
    );
    
    this.maxScrollY = Math.max(0, totalHeight - visibleHeight);
    
    if (wasNearBottom) {
      // 自动滚动到底部
      this.scrollY = this.maxScrollY;
    } else {
      // 确保当前滚动位置在有效范围内
      this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));
    }
  }
  
  bindWxTouchEvents() {
    const touchBindings = [
      ['onTouchStart', 'onTouchStart'],
      ['onTouchMove', 'onTouchMove'],
      ['onTouchEnd', 'onTouchEnd']
    ];
    
    touchBindings.forEach(([eventName, handlerKey]) => {
      if (typeof wx[eventName] === 'function' && this.boundTouchHandlers[handlerKey]) {
        wx[eventName](this.boundTouchHandlers[handlerKey]);
      }
    });
  }
  
  bindDirectTouchEvents() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[ChatInterface] Canvas not found');
      return;
    }
    
    // 坐标转换函数，将屏幕坐标转换为Canvas坐标
    const getCanvasCoordinates = (e) => {
      const rect = canvas.getBoundingClientRect();
      let x, y;
      
      if (e.clientX !== undefined) {
        // 鼠标事件
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      } else if (e.touches && e.touches[0]) {
        // 触摸事件
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else if (e.changedTouches && e.changedTouches[0]) {
        // 触摸结束事件
        x = e.changedTouches[0].clientX - rect.left;
        y = e.changedTouches[0].clientY - rect.top;
      }
      
      // 转换为Canvas实际大小的坐标
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
        x: x * scaleX,
        y: y * scaleY
      };
    };
    
    // 统一的事件处理函数
    this.directTouchStartHandler = (e) => {
      e.preventDefault();
      const coords = getCanvasCoordinates(e);
      if (coords.x !== undefined && coords.y !== undefined) {
        console.log('[ChatInterface] Start event:', { x: coords.x, y: coords.y });
        const event = {
          touches: [{ clientX: coords.x, clientY: coords.y }]
        };
        this.touchStartHandler(event);
      }
    };
    
    this.directTouchMoveHandler = (e) => {
      e.preventDefault();
      const coords = getCanvasCoordinates(e);
      if (coords.x !== undefined && coords.y !== undefined) {
        console.log('[ChatInterface] Move event:', { x: coords.x, y: coords.y });
        const event = {
          touches: [{ clientX: coords.x, clientY: coords.y }]
        };
        this.touchMoveHandler(event);
      }
    };
    
    this.directTouchEndHandler = (e) => {
      e.preventDefault();
      const coords = getCanvasCoordinates(e);
      if (coords.x !== undefined && coords.y !== undefined) {
        console.log('[ChatInterface] End event:', { x: coords.x, y: coords.y });
        const event = {
          changedTouches: [{ clientX: coords.x, clientY: coords.y }]
        };
        this.touchEndHandler(event);
      }
    };
    
    // 添加事件监听器
    canvas.addEventListener('mousedown', this.directTouchStartHandler);
    canvas.addEventListener('touchstart', this.directTouchStartHandler);
    
    canvas.addEventListener('mousemove', this.directTouchMoveHandler);
    canvas.addEventListener('touchmove', this.directTouchMoveHandler);
    
    canvas.addEventListener('mouseup', this.directTouchEndHandler);
    canvas.addEventListener('touchend', this.directTouchEndHandler);
    
    console.log('[ChatInterface] Direct event listeners bound to canvas');
  }
  
  /**
   * 获取文本行数
   */
  getTextLines(text) {
    const ctx = this.measureCtx || (typeof canvas !== 'undefined' ? canvas.getContext('2d') : null);
    if (!ctx) {
      return [text];
    }
    
    // 计算实际可用宽度（减去气泡内边距）
    const availableWidth = this.messageMaxWidth - this.messageBubblePadding * 2;
    
    const lines = [];
    const rawLines = String(text).split(/\r?\n/);
    
    rawLines.forEach(rawLine => {
      const characters = Array.from(rawLine);
      let currentLine = '';
      
      characters.forEach(char => {
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > availableWidth && currentLine !== '') {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      });
      
      // 空行也需要占位
      lines.push(currentLine);
    });
    
    return lines.length > 0 ? lines : [''];
  }
  
  getMessageMetrics(msg) {
    // 缓存每条消息的测量结果，避免在滚动与渲染过程中重复计算
    if (!msg._metricsCache) {
      msg._metricsCache = this.computeMessageMetrics(msg);
    }
    return msg._metricsCache;
  }
  
  computeMessageMetrics(msg) {
    const lines = this.getTextLines(msg.text);
    const lineCount = Math.max(lines.length, 1);
    const contentHeight = lineCount * this.messageLineHeight;
    const timestampHeight = msg.timestamp ? 18 : 0;
    const bubbleHeight = contentHeight + this.messageBubblePadding * 2;
    const metadataHeight = timestampHeight ? timestampHeight + 4 : 0;
    
    return {
      lines,
      contentHeight,
      bubbleHeight,
      timestampHeight,
      metadataHeight,
      totalHeight: bubbleHeight + metadataHeight
    };
  }
  
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * 处理触摸开始
   */
  touchStartHandler(event) {
    const touch = event.touches[0];
    this.touchStartY = touch.clientY;
    this.touchStartScrollY = this.scrollY;
    this.isScrolling = false;
  }
  
  /**
   * 处理触摸移动
   */
  touchMoveHandler(event) {
    const touch = event.touches[0];
    const deltaY = touch.clientY - this.touchStartY;
    
    if (Math.abs(deltaY) > 10) {
      this.isScrolling = true;
      this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.touchStartScrollY - deltaY));
    }
  }
  
  /**
   * 处理触摸结束
   */
  touchEndHandler(event) {
    if (!this.isScrolling) {
      const touch = event.changedTouches[0];
      
      // 检查是否点击返回按钮
      const backBtnX = 10;
      const backBtnY = Math.floor(this.statusBarHeight * 0.35);
      const backBtnSize = 20;
      
      if (touch.clientX >= backBtnX && 
          touch.clientX <= backBtnX + backBtnSize &&
          touch.clientY >= backBtnY && 
          touch.clientY <= backBtnY + backBtnSize) {
        this.emit('backToMenu');
        return;
      }
      
      const inputH = 36;
      const inputY = this.inputY + Math.floor((this.inputHeight - inputH) / 2);
      const inputX = this.sidePadding;
      const sendBtnWidth = 60;
      const sendBtnX = SCREEN_WIDTH - sendBtnWidth - this.sidePadding;
      const inputW = SCREEN_WIDTH - inputX - sendBtnWidth - this.sidePadding - 10;
      
      // 检查是否点击发送按钮
      if (touch.clientY >= inputY && 
          touch.clientY <= inputY + inputH &&
          touch.clientX >= sendBtnX && 
          touch.clientX <= sendBtnX + sendBtnWidth) {
        console.log('[ChatInterface] Send button clicked');
        this.sendMessage();
      }
      // 精确检查是否点击输入框区域（不包括发送按钮）
      else if (touch.clientY >= inputY && 
               touch.clientY <= inputY + inputH &&
               touch.clientX >= inputX && 
               touch.clientX <= inputX + inputW) {
        // 只有点击输入框区域才激活键盘
        this.showInput();
      }
    }
  }
  
  /**
   * 显示输入框并激活键盘
   */
  showInput() {
    // 立即设置为激活状态，显示全宽输入框和光标
    this.isInputActive = true;
    this.cursorVisible = true;
    this.lastCursorUpdate = Date.now();
    
    // 更新滚动位置，确保最新的消息不会被遮挡
    this.updateScrollPosition();
    
    // 在微信小游戏环境中，调用 wx.showKeyboard 立即激活键盘
    if (typeof wx !== 'undefined' && wx.showKeyboard) {
      // 立即显示键盘，配置为发送模式
      wx.showKeyboard({
        defaultValue: this.inputText || '',
        maxLength: 200,
        multiple: true,
        confirmHold: false,
        confirmType: 'send',
        confirmText: '发送'
      });
    } else {
      // 在浏览器环境中，聚焦到隐藏的输入框
      const keyboardInput = document.getElementById('keyboard-input');
      if (keyboardInput) {
        console.log('[ChatInterface] Keyboard input element found:', keyboardInput);
        keyboardInput.value = this.inputText || '';
        
        // 强制聚焦
        setTimeout(() => {
          keyboardInput.focus();
          console.log('[ChatInterface] Keyboard input focused');
          
          // 检查聚焦状态
          console.log('[ChatInterface] Input is focused:', document.activeElement === keyboardInput);
        }, 100);
        
        // 监听输入事件
        keyboardInput.oninput = (e) => {
          this.inputText = e.target.value;
          console.log('[ChatInterface] Input changed:', this.inputText);
        };
        
        // 监听回车键发送
        keyboardInput.onkeydown = (e) => {
          console.log('[ChatInterface] Key pressed:', e.key);
          if (e.key === 'Enter') {
            console.log('[ChatInterface] Enter key pressed, sending message');
            this.sendMessage();
          }
        };
        
        console.log('[ChatInterface] Keyboard input activated in browser');
      } else {
        console.error('[ChatInterface] Keyboard input element not found');
      }
    }
  }
  
  /**
   * 发送消息
   */
  async sendMessage() {
    const messageText = this.inputText.trim();
    if (messageText) {
      // 添加消息到界面
      this.addMessage('我', messageText, true);
      
      // 添加消息到对话历史
      dialogueManager.addMessage('user', messageText);
      
      // 清空输入框
      this.inputText = '';
      this.isInputActive = false;
      this.isKeyboardVisible = false;
      this.lastCursorUpdate = Date.now(); // 重置光标闪烁时间
      
      // 隐藏键盘
      if (typeof wx !== 'undefined' && wx.hideKeyboard) {
        wx.hideKeyboard();
      }
      
      // 发送API请求获取回复
      await this.getAIResponse();
    }
  }
  
  /**
   * 获取AI回复
   */
  async getAIResponse() {
    try {
      // 显示加载状态
      this.addMessage('DeepSeek', '...', false);
      
      // 发送请求到DeepSeek API
      const response = await deepseekApi.sendRequest(dialogueManager.getHistory());
      
      // 移除加载消息
      this.messages.pop();
      this.updateScrollPosition();
      
      if (response.error) {
        // 显示错误消息
        this.addMessage('DeepSeek', `抱歉，我遇到了一个错误：${response.error}`, false);
        return;
      }
      
      // 提取AI回复
      const aiReply = response.choices && response.choices[0] && response.choices[0].message ? 
        response.choices[0].message.content : '抱歉，我无法生成回复。';
      
      // 添加AI回复到对话历史
      dialogueManager.addMessage('assistant', aiReply);
      
      // 添加AI回复到界面
      this.addMessage('DeepSeek', aiReply, false);
    } catch (error) {
      console.error('[DeepSeek] 获取AI回复失败:', error);
      
      // 移除加载消息
      this.messages.pop();
      this.updateScrollPosition();
      
      // 显示错误消息
      this.addMessage('DeepSeek', `抱歉，我遇到了一个错误：${error.message}`, false);
    }
  }
  
  /**
   * 设置输入文本（实际应该从键盘输入获取）
   */
  setInputText(text) {
    this.inputText = text;
  }
  
  /**
   * 渲染聊天界面
   */
  render(ctx) {
    // 微信聊天背景：浅灰纯色
    ctx.fillStyle = '#EDEDED';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // 绘制顶部状态栏
    this.renderStatusBar(ctx);
    
    // 绘制消息列表
    this.renderMessages(ctx);
    
    // 绘制输入框
    this.renderInputArea(ctx);
  }
  
  /**
   * 绘制状态栏
   */
  renderStatusBar(ctx) {
    const barHeight = this.statusBarHeight;
    
    // 白色顶部栏 + 底部分割线
    ctx.fillStyle = '#F7F7F7';
    ctx.fillRect(0, 0, SCREEN_WIDTH, barHeight);
    ctx.fillStyle = '#DADADA';
    ctx.fillRect(0, barHeight - 1, SCREEN_WIDTH, 1);
    
    // 返回按钮（左侧）
    const backBtnX = 10;
    const backBtnY = Math.floor(barHeight * 0.35);
    const backBtnSize = 20;
    
    ctx.save();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(backBtnX + backBtnSize, backBtnY);
    ctx.lineTo(backBtnX, backBtnY + backBtnSize / 2);
    ctx.lineTo(backBtnX + backBtnSize, backBtnY + backBtnSize);
    ctx.stroke();
    ctx.restore();
    
    // 左边显示时间
    const nowLabel = this.formatTimestamp(Date.now());
    ctx.fillStyle = '#111111';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const titleY = Math.floor(barHeight * 0.65);
    ctx.fillText(nowLabel, 50, titleY);
    
    // 标题（居中，位置下移）
    ctx.fillStyle = '#111111';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', SCREEN_WIDTH / 2, titleY);
  }
  
  /**
   * 绘制消息列表
   */
  renderMessages(ctx) {
    // 应用滚动位置，从顶部开始顺序排布
    let currentY = this.messageStartY - this.scrollY + this.contentOffsetY;
    
    // 确保可见区域顶部至少是标题栏底部，防止消息绘制到标题栏
    const visibleTop = Math.max(this.messageStartY, this.statusBarHeight);
    const visibleBottom = this.inputY - 10;
    
    this.messages.forEach(msg => {
      const metrics = this.getMessageMetrics(msg);
      const messageTop = currentY;
      const messageBottom = currentY + metrics.totalHeight;
      
      // 只渲染在屏幕可见区域内的消息，确保不会绘制到标题栏
      if (messageBottom >= visibleTop && messageTop <= visibleBottom) {
        const drawY = Math.max(messageTop, visibleTop);
        this.renderMessage(ctx, msg, metrics, drawY);
      }
      
      currentY += metrics.totalHeight + this.messagePadding;
    });
  }
  
  /**
   * 绘制单条消息
   */
  renderMessage(ctx, msg, metrics, y) {
    const { lines, bubbleHeight, timestampHeight, contentHeight, metadataHeight } = metrics;
    const isMe = msg.isMe;
    
    ctx.font = '16px Arial';
    const lineWidths = lines.length > 0
      ? lines.map(line => ctx.measureText(line).width)
      : [0];
    const maxLineWidth = lineWidths.length ? Math.max(...lineWidths) : 0;
    const bubbleWidth = Math.min(
      this.messageMaxWidth,
      maxLineWidth + this.messageBubblePadding * 2
    );
    
    const minBubbleWidth = 40;
    const finalBubbleWidth = Math.max(bubbleWidth, minBubbleWidth);
    
    const avatarSize = this.avatarSize;
    const avatarY = y;
    const bubbleY = y;
    
    const avatarX = isMe
      ? SCREEN_WIDTH - this.sidePadding - avatarSize
      : this.sidePadding;
    
    const bubbleX = isMe
      ? avatarX - 10 - finalBubbleWidth
      : avatarX + avatarSize + 10;
    
    // 绘制头像（圆形占位）
    ctx.save();
    const avatarR = Math.floor(avatarSize / 2);
    const avatarCx = avatarX + avatarR;
    const avatarCy = avatarY + avatarR;
    this.drawCircle(ctx, avatarCx, avatarCy, avatarR);
    ctx.fillStyle = isMe ? '#FDE68A' : '#FCA5A5';
    ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isMe ? '我' : 'A', avatarCx, avatarCy + 1);
    ctx.restore();
    
    // 绘制消息气泡（微信风格：右侧绿色、左侧白色，带尾巴）
    ctx.save();
    ctx.fillStyle = isMe ? '#95EC69' : '#FFFFFF';
    // 轻微描边让白气泡更清晰
    if (!isMe) {
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 1;
    }
    this.drawBubbleWithTail(ctx, bubbleX, bubbleY, finalBubbleWidth, bubbleHeight, this.bubbleRadius, isMe);
    if (!isMe) {
      ctx.stroke();
    }
    ctx.restore();
    
    // 绘制消息文本
    ctx.fillStyle = '#111111';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const textStartY = bubbleY + this.messageBubblePadding;
    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        bubbleX + this.messageBubblePadding,
        textStartY + index * this.messageLineHeight
      );
    });
    
    // 时间戳（更接近微信：淡灰、在气泡下方靠边）
    if (msg.timestamp) {
      const timestampText = this.formatTimestamp(msg.timestamp);
      const timestampY = bubbleY + bubbleHeight + 12;
      ctx.save();
      ctx.font = '12px Arial';
      ctx.fillStyle = '#B0B0B0';
      ctx.textAlign = isMe ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      const timeX = isMe
        ? bubbleX + finalBubbleWidth
        : bubbleX;
      ctx.fillText(timestampText, timeX, timestampY);
      ctx.restore();
    }
  }
  
  /**
   * 绘制圆角矩形
   */
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
  
  drawCircle(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
  }
  
  drawBubbleWithTail(ctx, x, y, w, h, r, isMe) {
    // 主体圆角矩形
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    
    // 尖尖的尾巴（三角形）
    const t = this.bubbleTailSize;
    const midY = y + 18;
    ctx.beginPath();
    if (isMe) {
      ctx.moveTo(x + w, midY);
      ctx.lineTo(x + w + t, midY + 6);
      ctx.lineTo(x + w, midY + 12);
    } else {
      ctx.moveTo(x, midY);
      ctx.lineTo(x - t, midY + 6);
      ctx.lineTo(x, midY + 12);
    }
    ctx.closePath();
    ctx.fill();
  }
  
  /**
   * 绘制输入区域
   */
  renderInputArea(ctx) {
    // 更新光标闪烁
    this.updateCursorBlink();
    
    const hasText = this.inputText.trim().length > 0;
    
    // 如果是微信环境且输入框已激活，则完全交给系统输入框处理，
    // 在画布上不再绘制任何自定义输入区域，避免逻辑混乱和遮挡。
    if (this.isWxEnv && this.isInputActive) {
      return;
    }
    
    // 微信底部输入栏：浅灰背景 + 顶部分割线
    ctx.fillStyle = '#F7F7F7';
    ctx.fillRect(0, this.inputY, SCREEN_WIDTH, SCREEN_HEIGHT - this.inputY);
    ctx.fillStyle = '#DADADA';
    ctx.fillRect(0, this.inputY, SCREEN_WIDTH, 1);
    
    // 只保留文字输入框和发送按钮（去掉语音、表情、加号等功能）
    const inputH = 36;
    const inputY = this.inputY + Math.floor((this.inputHeight - inputH) / 2);
    const inputX = this.sidePadding;
    const sendBtnWidth = 60;
    const inputW = SCREEN_WIDTH - inputX - sendBtnWidth - this.sidePadding - 10;
    
    // 输入框
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, inputX, inputY, inputW, inputH, 6);
    ctx.strokeStyle = '#CFCFCF';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    
    // 输入文字
    ctx.save();
    ctx.fillStyle = this.inputText ? '#111111' : '#A0A0A0';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const displayText = this.inputText || '输入消息';
    ctx.fillText(displayText, inputX + 10, inputY + Math.floor(inputH / 2) + 1);
    // 光标
    if (this.isInputActive && this.cursorVisible) {
      const textWidth = this.inputText ? ctx.measureText(this.inputText).width : 0;
      const cursorX = inputX + 10 + textWidth + 2;
      ctx.fillStyle = '#07C160';
      ctx.fillRect(cursorX, inputY + 8, 2, inputH - 16);
    }
    ctx.restore();
    
    // 发送按钮
    const sendBtnX = SCREEN_WIDTH - sendBtnWidth - this.sidePadding;
    ctx.save();
    ctx.fillStyle = hasText ? '#07C160' : '#CFCFCF';
    this.drawRoundedRect(ctx, sendBtnX, inputY, sendBtnWidth, inputH, 6);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('发送', sendBtnX + sendBtnWidth / 2, inputY + Math.floor(inputH / 2) + 1);
    ctx.restore();
  }
  
  /**
   * 更新光标闪烁
   */
  updateCursorBlink() {
    if (this.isInputActive) {
      const now = Date.now();
      const elapsed = now - this.lastCursorUpdate;
      
      if (elapsed >= 500) { // 每500ms切换一次
        this.cursorVisible = !this.cursorVisible;
        this.lastCursorUpdate = now;
      }
    } else {
      this.cursorVisible = false;
      this.lastCursorUpdate = Date.now();
    }
  }
  
  /**
   * 绑定鼠标滚轮事件
   */
  setupMouseWheel() {
    // 浏览器环境下的鼠标滚轮事件处理
    if (typeof window !== 'undefined' && window.addEventListener && typeof document !== 'undefined' && document.getElementById) {
      const canvasElement = document.getElementById('canvas');
      if (canvasElement) {
        canvasElement.addEventListener('wheel', (event) => {
          event.preventDefault();
          // 根据滚轮方向调整滚动位置
          const delta = event.deltaY > 0 ? 50 : -50;
          this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + delta));
        });
      }
    }
  }
  
  /**
   * 绑定键盘高度变化事件
   */
  setupKeyboardHeightChange() {
    // 微信小游戏环境下的键盘高度变化事件处理
    if (typeof wx !== 'undefined' && wx.onKeyboardHeightChange) {
      // 保存原始的输入框位置
      this.originalInputY = this.inputY;
      
      // 监听键盘高度变化
      wx.onKeyboardHeightChange((res) => {
        // 根据键盘高度调整输入框位置
        if (res.height > 0) {
          // 键盘弹出，输入框上移，紧贴键盘顶部
          this.inputY = SCREEN_HEIGHT - res.height;
          this.isKeyboardVisible = true;
        } else {
          // 键盘收起，输入框恢复原始位置
          this.inputY = this.originalInputY;
          this.isKeyboardVisible = false;
        }
        
        // 更新滚动位置，确保消息不会被遮挡
        this.updateScrollPosition();
      });
    }
  }
  
  /**
   * 处理键盘输入（简化版）
   * 实际应该通过 wx.onKeyboardInput 等 API 获取
   */
  handleInput(char) {
    if (char === '\n' || char === '\r') {
      this.sendMessage();
    } else if (char === '\b') {
      this.inputText = this.inputText.slice(0, -1);
    } else {
      this.inputText += char;
    }
  }
  
  /**
   * 清理事件监听器
   */
  deactivate() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[ChatInterface] Canvas not found for deactivation');
      return;
    }
    
    // 移除事件监听器
    if (this.directTouchStartHandler) {
      canvas.removeEventListener('mousedown', this.directTouchStartHandler);
      canvas.removeEventListener('touchstart', this.directTouchStartHandler);
    }
    if (this.directTouchMoveHandler) {
      canvas.removeEventListener('mousemove', this.directTouchMoveHandler);
      canvas.removeEventListener('touchmove', this.directTouchMoveHandler);
    }
    if (this.directTouchEndHandler) {
      canvas.removeEventListener('mouseup', this.directTouchEndHandler);
      canvas.removeEventListener('touchend', this.directTouchEndHandler);
    }
    
    // 隐藏键盘
    const keyboardInput = document.getElementById('keyboard-input');
    if (keyboardInput) {
      keyboardInput.blur();
    }
    
    console.log('[ChatInterface] Event listeners removed');
  }
}

