import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

/**
 * 微信聊天界面
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
    
    // 消息列表相关
    this.messageStartY = 40; // 消息列表起始位置（留出顶部状态栏）
    this.messagePadding = 15; // 消息间距
    this.messageMaxWidth = SCREEN_WIDTH * 0.7; // 消息最大宽度
    this.messageBubblePadding = 12; // 消息气泡内边距（增加内边距确保文字不贴边）
    this.messageLineHeight = 22; // 行高（稍微减小以更好适配）
    
    // 滚动位置
    this.scrollY = 0;
    this.maxScrollY = 0;
    
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
      this.measureCtx.font = '16px Arial';
    } else {
      this.measureCtx = null;
    }
    
    // 绑定触摸事件
    if (typeof wx !== 'undefined') {
      this.bindWxTouchEvents();
    } else {
      console.warn('[ChatInterface] wx 未定义，触摸事件不可用');
    }
    
    // 绑定键盘输入（微信小游戏环境）
    this.setupKeyboard();
    
    // 添加欢迎消息
    this.addMessage('对方', '你好！', false);
    
    this.autoReplyEnabled = true;
    this.autoReplyDelay = 600;
    this.autoReplyText = '1';
    this.autoReplyTimer = null;
  }
  
  setupKeyboard() {
    // 微信小游戏环境下的键盘输入处理
    if (typeof wx !== 'undefined') {
      // 监听键盘输入
      if (wx.onKeyboardInput) {
        wx.onKeyboardInput((res) => {
          if (this.isInputActive) {
            if (res.value !== undefined) {
              this.inputText = res.value;
            }
          }
        });
      }
      
      // 监听键盘确认（Enter键或发送按钮）
      // 当用户按下键盘上的 Enter 键或点击键盘上的"发送"按钮时触发
      if (wx.onKeyboardConfirm) {
        wx.onKeyboardConfirm(() => {
          // 如果输入框激活且有内容，则发送消息
          if (this.isInputActive) {
            this.sendMessage();
          }
        });
      }
      
      // 监听键盘完成（键盘关闭）
      if (wx.onKeyboardComplete) {
        wx.onKeyboardComplete(() => {
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
    
    if (isMe && this.autoReplyEnabled) {
      if (this.autoReplyTimer) {
        clearTimeout(this.autoReplyTimer);
      }
      
      this.autoReplyTimer = setTimeout(() => {
        this.addMessage('对方', this.autoReplyText, false);
      }, this.autoReplyDelay);
    }
  }
  
  /**
   * 更新滚动位置
   */
  updateScrollPosition() {
    const wasNearBottom = this.scrollY >= this.maxScrollY - 5;
    
    // 计算总内容高度
    let totalHeight = 0;
    this.messages.forEach(msg => {
      const metrics = this.getMessageMetrics(msg);
      totalHeight += metrics.totalHeight + this.messagePadding;
    });
    
    // 计算最大滚动位置
    const visibleHeight = this.inputY - this.messageStartY - 20;
    this.maxScrollY = Math.max(0, totalHeight - visibleHeight);
    
    if (wasNearBottom) {
      // 自动滚动到底部
      this.scrollY = this.maxScrollY;
    } else {
      // 确保当前滚动位置不超过最大值
      this.scrollY = Math.min(this.scrollY, this.maxScrollY);
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
    
    // 检查是否点击输入框区域
    if (touch.clientY >= this.inputY - 10) {
      this.showInput();
    }
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
      // 可能是点击，检查是否点击发送按钮或输入框
      const touch = event.changedTouches[0];
      
      // 如果输入框未激活，检查是否点击发送按钮
      if (!this.isInputActive && 
          touch.clientY >= this.inputY + 10 && 
          touch.clientY <= this.inputY + this.inputHeight - 10 &&
          touch.clientX >= SCREEN_WIDTH - 80 && 
          touch.clientX <= SCREEN_WIDTH - 10) {
        this.sendMessage();
      } 
      // 检查是否点击输入框区域 - 点击后立即激活键盘
      else if (touch.clientY >= this.inputY && 
               touch.clientY <= this.inputY + this.inputHeight &&
               touch.clientX >= 10) {
        // 立即激活键盘输入
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
    
    // 在微信小游戏环境中，调用 wx.showKeyboard 立即激活键盘
    if (typeof wx !== 'undefined' && wx.showKeyboard) {
      // 立即显示键盘，配置为发送模式
      wx.showKeyboard({
        defaultValue: this.inputText || '',
        maxLength: 200,
        multiple: false,
        confirmHold: false, // 点击确认键不保持键盘，直接发送
        confirmType: 'send' // 键盘确认键显示为"发送"
      });
    } else {
      // 如果没有 wx.showKeyboard，保持激活状态但不自动发送
      // 用户可以通过点击发送按钮发送消息
    }
  }
  
  /**
   * 发送消息
   */
  sendMessage() {
    const messageText = this.inputText.trim();
    if (messageText) {
      // 添加消息
      this.addMessage('我', messageText, true);
      
      // 清空输入框
      this.inputText = '';
      this.isInputActive = false;
      this.lastCursorUpdate = Date.now(); // 重置光标闪烁时间
      
      // 隐藏键盘
      if (typeof wx !== 'undefined' && wx.hideKeyboard) {
        wx.hideKeyboard();
      }
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
    // 绘制背景（微信绿色）
    const bgGradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    bgGradient.addColorStop(0, '#F7F8FC');
    bgGradient.addColorStop(1, '#ECEEF6');
    ctx.fillStyle = bgGradient;
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
    const gradient = ctx.createLinearGradient(0, 0, 0, 40);
    gradient.addColorStop(0, '#2F3033');
    gradient.addColorStop(1, '#3C3D41');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, 40);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('微信聊天', SCREEN_WIDTH / 2, 28);
    
    const nowLabel = this.formatTimestamp(Date.now());
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(nowLabel, 16, 22);
   
  }
  
  /**
   * 绘制消息列表
   */
  renderMessages(ctx) {
    let currentY = this.messageStartY - this.scrollY;
    
    this.messages.forEach(msg => {
      const metrics = this.getMessageMetrics(msg);
      
      // 只渲染可见的消息
      if (currentY + metrics.totalHeight > 0 && currentY < this.inputY) {
        this.renderMessage(ctx, msg, metrics, currentY);
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
    
    const bubbleX = isMe 
      ? SCREEN_WIDTH - finalBubbleWidth - 20
      : 20;
    const bubbleY = y;
    
    ctx.save();
    ctx.fillStyle = isMe ? '#9FE579' : '#FFFFFF';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    this.drawRoundedRect(
      ctx,
      bubbleX,
      bubbleY,
      finalBubbleWidth,
      bubbleHeight,
      8
    );
    ctx.restore();
    
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    const textStartY = bubbleY + this.messageBubblePadding + this.messageLineHeight;
    lines.forEach((line, index) => {
      ctx.fillText(
        line,
        bubbleX + this.messageBubblePadding,
        textStartY + index * this.messageLineHeight
      );
    });
    
    if (msg.timestamp) {
      const timestampText = this.formatTimestamp(msg.timestamp);
      const timestampY = bubbleY + bubbleHeight + (metadataHeight ? 2 + timestampHeight / 2 : 0);
      
      ctx.save();
      ctx.font = '12px Arial';
      ctx.fillStyle = '#8D8D93';
      ctx.textAlign = isMe ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      const timeX = isMe
        ? bubbleX + finalBubbleWidth - this.messageBubblePadding
        : bubbleX + this.messageBubblePadding;
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
  
  /**
   * 绘制输入区域
   */
  renderInputArea(ctx) {
    // 更新光标闪烁
    this.updateCursorBlink();
    
    const hasText = this.inputText.trim().length > 0;
    
    // 顶部分割线
    ctx.fillStyle = '#D8D8DE';
    ctx.fillRect(0, this.inputY - 1, SCREEN_WIDTH, 1);
    
    // 绘制输入框背景（浅蓝色/紫色调）
    ctx.fillStyle = '#F5F5F9';
    ctx.fillRect(0, this.inputY, SCREEN_WIDTH, SCREEN_HEIGHT - this.inputY);
    
    // 如果输入框激活，显示全宽输入框（图一的样子）
    if (this.isInputActive) {
      // 绘制全宽输入框（没有发送按钮）
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, 10, this.inputY + 10, SCREEN_WIDTH - 20, this.inputHeight - 20, 8);
      
      // 绘制输入文本
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      const textX = 20;
      const textY = this.inputY + 35;
      
      // 绘制文本（如果有）
      if (this.inputText) {
        ctx.fillText(this.inputText, textX, textY);
      }
      
      // 绘制闪烁的光标（紫色）- 始终显示，即使没有文本
      if (this.cursorVisible) {
        const textWidth = this.inputText ? ctx.measureText(this.inputText).width : 0;
        ctx.fillStyle = '#8B5CF6'; // 紫色光标
        ctx.fillRect(textX + textWidth + 1, textY - 18, 2, 20);
      }
    } else {
      // 如果输入框未激活，显示输入框+发送按钮（图二的样子）
      // 绘制输入框边框
      ctx.fillStyle = '#FFFFFF';
      this.drawRoundedRect(ctx, 10, this.inputY + 10, SCREEN_WIDTH - 100, this.inputHeight - 20, 8);
      
      // 绘制输入文本
      ctx.fillStyle = '#000000';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      const displayText = this.inputText || '点击输入消息...';
      ctx.fillStyle = this.inputText ? '#000000' : '#999999';
      ctx.fillText(displayText, 20, this.inputY + 35);
      
      // 绘制发送按钮
      ctx.fillStyle = hasText ? '#07C160' : '#C7C7CC';
      this.drawRoundedRect(ctx, SCREEN_WIDTH - 80, this.inputY + 10, 70, this.inputHeight - 20, 8);
      
      ctx.fillStyle = hasText ? '#FFFFFF' : '#F5F5F5';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('发送', SCREEN_WIDTH - 45, this.inputY + 35);
      ctx.textAlign = 'left';
    }
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
}

