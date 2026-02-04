import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class DiaryBook extends Emitter {
  constructor() {
    super();
    
    this.isWxEnv = typeof wx !== 'undefined';
    this.statusBarHeight = 88;
    
    this.content = '';
    this.isContentFocused = false;
    this.isSaving = false;
    this.saveSuccess = false;
    
    this.buttons = [];
    this.selectedButtonIndex = -1;
    
    this.initButtons();
  }
  
  initButtons() {
    const buttonWidth = 120;
    const buttonHeight = 50;
    const buttonSpacing = 20;
    const startX = (SCREEN_WIDTH - buttonWidth * 2 - buttonSpacing) / 2;
    const startY = SCREEN_HEIGHT - 100;
    
    this.buttons = [
      {
        id: 'publish',
        label: '保留',
        x: startX,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#4CAF50',
        textColor: '#FFFFFF'
      },
      {
        id: 'clear',
        label: '清空',
        x: startX + buttonWidth + buttonSpacing,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#F44336',
        textColor: '#FFFFFF'
      }
    ];
  }
  
  bindTouchEvents() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[DiaryBook] Canvas not found');
      return;
    }
    
    // 统一的事件处理函数
    this.touchStartHandler = (e) => {
      e.preventDefault();
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      if (x !== undefined && y !== undefined) {
        console.log('[DiaryBook] Start event:', { x, y });
        this.handleTouchStart(x, y);
      }
    };
    
    this.touchEndHandler = (e) => {
      e.preventDefault();
      const x = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const y = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      if (x !== undefined && y !== undefined) {
        console.log('[DiaryBook] End event:', { x, y });
        this.handleTouchEnd(x, y);
      }
    };
    
    // 添加事件监听器
    canvas.addEventListener('mousedown', this.touchStartHandler);
    canvas.addEventListener('touchstart', this.touchStartHandler);
    
    canvas.addEventListener('mouseup', this.touchEndHandler);
    canvas.addEventListener('touchend', this.touchEndHandler);
    
    console.log('[DiaryBook] Event listeners bound to canvas');
  }
  
  handleTouchStart(x, y) {
    this.selectedButtonIndex = -1;
    
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        this.selectedButtonIndex = i;
        return;
      }
    }
    
    if (x >= 10 && x <= 40 && y >= 30 && y <= 60) {
      return;
    }
    
    const contentX = 20;
    const contentY = this.statusBarHeight + 30;
    const contentWidth = SCREEN_WIDTH - 40;
    const contentHeight = 350;
    
    if (x >= contentX && x <= contentX + contentWidth && 
        y >= contentY && y <= contentY + contentHeight) {
      this.isContentFocused = true;
      this.showKeyboard(this.content);
    } else {
      this.isContentFocused = false;
      this.hideKeyboard();
    }
  }
  
  handleTouchEnd(x, y) {
    if (this.selectedButtonIndex >= 0) {
      const btn = this.buttons[this.selectedButtonIndex];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        if (btn.id === 'publish') {
          this.saveDiary();
        } else if (btn.id === 'clear') {
          this.clearDiary();
        }
      }
      this.selectedButtonIndex = -1;
      return;
    }
    
    const contentX = 20;
    const contentY = this.statusBarHeight + 30;
    const contentWidth = SCREEN_WIDTH - 40;
    const contentHeight = 350;
    
    if (x >= contentX && x <= contentX + contentWidth && 
        y >= contentY && y <= contentY + contentHeight) {
      this.selectedButtonIndex = -1;
      return;
    }
    
    if (x >= 10 && x <= 40 && y >= 30 && y <= 60) {
      this.emit('backToMenu');
    }
    
    this.selectedButtonIndex = -1;
  }
  
  showKeyboard(text) {
    if (this.isWxEnv && wx.showKeyboard) {
      wx.showKeyboard({
        defaultValue: text || '',
        maxLength: 500,
        multiple: true,
        confirmHold: false,
        confirmType: 'done',
        confirmText: '完成'
      });
      
      if (wx.onKeyboardInput) {
        wx.onKeyboardInput((res) => {
          this.content = res.value;
        });
      }
      
      if (wx.onKeyboardComplete) {
        wx.onKeyboardComplete(() => {
          this.isContentFocused = false;
        });
      }
    }
  }
  
  hideKeyboard() {
    if (this.isWxEnv && wx.hideKeyboard) {
      wx.hideKeyboard();
    }
  }
  
  saveDiary() {
    if (!this.content.trim()) {
      return;
    }
    
    this.isSaving = true;
    
    setTimeout(() => {
      this.isSaving = false;
      this.saveSuccess = true;
      this.content = '';
      
      setTimeout(() => {
        this.saveSuccess = false;
      }, 2000);
    }, 1000);
  }
  
  clearDiary() {
    this.content = '';
    this.isContentFocused = false;
    this.saveSuccess = false;
    this.hideKeyboard();
  }
  
  render(ctx) {
    this.renderBackground(ctx);
    this.renderStatusBar(ctx);
    this.renderDate(ctx);
    this.renderContentInput(ctx);
    if (this.isSaving) {
      this.renderSaving(ctx);
    } else if (this.saveSuccess) {
      this.renderSaveSuccess(ctx);
    } else {
      this.renderButtons(ctx);
    }
  }
  
  renderBackground(ctx) {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  
  renderStatusBar(ctx) {
    const barHeight = this.statusBarHeight;
    
    ctx.fillStyle = '#F7F7F7';
    ctx.fillRect(0, 0, SCREEN_WIDTH, barHeight);
    ctx.fillStyle = '#DADADA';
    ctx.fillRect(0, barHeight - 1, SCREEN_WIDTH, 1);
    
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
    
    ctx.fillStyle = '#111111';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('日记书', SCREEN_WIDTH / 2, Math.floor(barHeight * 0.65));
  }
  
  renderDate(ctx) {
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateStr, SCREEN_WIDTH / 2, this.statusBarHeight + 15);
  }
  
  renderContentInput(ctx) {
    const contentX = 20;
    const contentY = this.statusBarHeight + 30;
    const contentWidth = SCREEN_WIDTH - 40;
    const contentHeight = 350;
    
    ctx.save();
    
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, contentX, contentY, contentWidth, contentHeight, 16);
    ctx.fill();
    
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    
    ctx.strokeStyle = this.isContentFocused ? '#4CAF50' : '#E0E0E0';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#999999';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    if (!this.content.trim()) {
      ctx.fillText('今天发生了什么事...', contentX + 15, contentY + 15);
    } else {
      ctx.fillStyle = '#333333';
      const lines = this.wrapText(ctx, this.content, contentWidth - 30);
      lines.forEach((line, index) => {
        ctx.fillText(line, contentX + 15, contentY + 15 + index * 25);
      });
    }
    
    ctx.restore();
  }
  
  renderSaving(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    const boxWidth = 200;
    const boxHeight = 100;
    const boxX = (SCREEN_WIDTH - boxWidth) / 2;
    const boxY = (SCREEN_HEIGHT - boxHeight) / 2;
    
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);
    ctx.fill();
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('保留中...', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  }
  
  renderSaveSuccess(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    const boxWidth = 200;
    const boxHeight = 100;
    const boxX = (SCREEN_WIDTH - boxWidth) / 2;
    const boxY = (SCREEN_HEIGHT - boxHeight) / 2;
    
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, boxX, boxY, boxWidth, boxHeight, 10);
    ctx.fill();
    
    ctx.fillStyle = '#4CAF50';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('保留成功！', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  }
  
  renderButtons(ctx) {
    this.buttons.forEach((btn, index) => {
      const isSelected = index === this.selectedButtonIndex;
      
      ctx.save();
      
      if (isSelected) {
        ctx.fillStyle = this.darkenColor(btn.bgColor, 20);
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 16);
      ctx.fill();
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 2;
      
      ctx.strokeStyle = btn.bgColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = btn.bgColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + btn.height / 2);
      
      ctx.restore();
    });
  }
  
  wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = word + ' ';
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine !== '') {
      lines.push(currentLine);
    }
    
    return lines;
  }
  
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
  }
  
  darkenColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }
  
  destroy() {
    this.deactivate();
  }
  
  activate() {
    this.bindTouchEvents();
  }
  
  deactivate() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[DiaryBook] Canvas not found for deactivation');
      return;
    }
    
    // 移除事件监听器
    if (this.touchStartHandler) {
      canvas.removeEventListener('mousedown', this.touchStartHandler);
      canvas.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      canvas.removeEventListener('mouseup', this.touchEndHandler);
      canvas.removeEventListener('touchend', this.touchEndHandler);
    }
    
    // 隐藏键盘
    const keyboardInput = document.getElementById('keyboard-input');
    if (keyboardInput) {
      keyboardInput.blur();
    }
    
    console.log('[DiaryBook] Event listeners removed');
  }
}
