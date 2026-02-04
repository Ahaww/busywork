import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class MainMenu extends Emitter {
  constructor() {
    super();
    
    this.isWxEnv = typeof wx !== 'undefined';
    this.statusBarHeight = 88;
    
    this.buttons = [];
    this.selectedButtonIndex = -1;
    this.selectedFeatureButton = false;
    
    // 简化颜色主题
    this.theme = {
      primary: '#5B8BF7',
      primaryLight: '#E8EEFF',
      background: '#F8FAFF',
      cardBg: '#FFFFFF',
      textPrimary: '#2D3748',
      textSecondary: '#718096',
      border: '#E2E8F0'
    };
    
    this.initButtons();
  }
  
  initButtons() {
    // 两行布局，每行两个按钮
    console.log('[MainMenu] SCREEN_WIDTH:', SCREEN_WIDTH, 'SCREEN_HEIGHT:', SCREEN_HEIGHT);
    const buttonWidth = (SCREEN_WIDTH - 90) / 2; // 更大的间距
    const buttonHeight = 120;
    const startX = 30;
    const startY = this.statusBarHeight + 120; // 更大的顶部间距
    
    console.log('[MainMenu] Button dimensions:', { buttonWidth, buttonHeight, startX, startY });
    
    this.buttons = [
      {
        id: 'chat',
        label: '情绪倾诉',
        icon: 'chat',
        x: startX,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#F0F7FF',
        iconColor: '#5B8BF7'
      },
      {
        id: 'breathing',
        label: '呼吸放松',
        icon: 'breathing',
        x: startX + buttonWidth + 30,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#F0FFF4',
        iconColor: '#48BB78'
      },
      {
        id: 'tips',
        label: '心理科普',
        icon: 'lightbulb',
        x: startX,
        y: startY + buttonHeight + 20, // 第二行
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#FFFAF0',
        iconColor: '#ED8936'
      },
      {
        id: 'diary',
        label: '心情日记',
        icon: 'book',
        x: startX + buttonWidth + 30,
        y: startY + buttonHeight + 20, // 第二行
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#FAF5FF',
        iconColor: '#9F7AEA'
      }
    ];
  }
  
  bindTouchEvents() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[MainMenu] Canvas not found');
      return;
    }
    
    // 移除旧的事件监听器
    if (this.touchStartHandler) {
      canvas.removeEventListener('mousedown', this.touchStartHandler);
      canvas.removeEventListener('touchstart', this.touchStartHandler);
    }
    if (this.touchEndHandler) {
      canvas.removeEventListener('mouseup', this.touchEndHandler);
      canvas.removeEventListener('touchend', this.touchEndHandler);
    }
    if (this.touchMoveHandler) {
      canvas.removeEventListener('mousemove', this.touchMoveHandler);
      canvas.removeEventListener('touchmove', this.touchMoveHandler);
    }
    
    // 统一的事件处理函数
    this.touchStartHandler = (e) => {
      e.preventDefault();
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      if (x !== undefined && y !== undefined) {
        console.log('[MainMenu] Start event:', { x, y });
        this.handleTouchStart(x, y);
      }
    };
    
    this.touchEndHandler = (e) => {
      e.preventDefault();
      const x = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const y = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      if (x !== undefined && y !== undefined) {
        console.log('[MainMenu] End event:', { x, y });
        this.handleTouchEnd(x, y);
      }
    };
    
    this.touchMoveHandler = (e) => {
      e.preventDefault();
    };
    
    // 添加事件监听器
    canvas.addEventListener('mousedown', this.touchStartHandler);
    canvas.addEventListener('touchstart', this.touchStartHandler);
    
    canvas.addEventListener('mouseup', this.touchEndHandler);
    canvas.addEventListener('touchend', this.touchEndHandler);
    
    canvas.addEventListener('mousemove', this.touchMoveHandler);
    canvas.addEventListener('touchmove', this.touchMoveHandler);
    
    console.log('[MainMenu] Event listeners bound to canvas');
  }
  
  handleTouchStart(x, y) {
    this.selectedButtonIndex = -1;
    this.selectedFeatureButton = false;
    
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        this.selectedButtonIndex = i;
        break;
      }
    }
    
    const featureY = this.statusBarHeight + 400;
    const featureHeight = 180;
    const featureWidth = SCREEN_WIDTH - 60;
    const featureX = 30;
    const buttonX = featureX + 20;
    const buttonY = featureY + featureHeight - 60;
    const buttonWidth = 140;
    const buttonHeight = 45;
    
    if (x >= buttonX && x <= buttonX + buttonWidth && 
        y >= buttonY && y <= buttonY + buttonHeight) {
      this.selectedFeatureButton = true;
    }
  }
  
  handleTouchEnd(x, y) {
    if (this.selectedButtonIndex >= 0) {
      const btn = this.buttons[this.selectedButtonIndex];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        this.emit('buttonClick', btn.id);
      }
    }
    
    if (this.selectedFeatureButton) {
      const featureY = this.statusBarHeight + 400;
      const featureHeight = 180;
      const featureWidth = SCREEN_WIDTH - 60;
      const featureX = 30;
      const buttonX = featureX + 20;
      const buttonY = featureY + featureHeight - 60;
      const buttonWidth = 140;
      const buttonHeight = 45;
      
      if (x >= buttonX && x <= buttonX + buttonWidth && 
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.emit('startAssessment');
      }
    }
    
    this.selectedButtonIndex = -1;
    this.selectedFeatureButton = false;
  }
  
  render(ctx) {
    this.renderBackground(ctx);
    this.renderStatusBar(ctx);
    this.renderTitle(ctx);
    this.renderButtons(ctx);
    this.renderMainFeature(ctx);
  }
  
  renderBackground(ctx) {
    // 纯色背景，更简洁
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  
  renderStatusBar(ctx) {
    const barHeight = this.statusBarHeight;
    
    // 状态栏背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, SCREEN_WIDTH, barHeight);
    
    // 应用名称（更大间距）
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('心灵伙伴', SCREEN_WIDTH / 2, Math.floor(barHeight * 0.5));
    
    // 副标题（更小，更低）
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '14px Arial';
    ctx.fillText('心理健康助手', SCREEN_WIDTH / 2, Math.floor(barHeight * 0.8));
  }
  
  renderTitle(ctx) {
    // 欢迎语（更大的顶部间距）
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('您好，今天感觉如何？', 30, this.statusBarHeight + 40);
  }
  
  renderButtons(ctx) {
    this.buttons.forEach((btn, index) => {
      const isSelected = index === this.selectedButtonIndex;
      
      ctx.save();
      
      // 简单的纯色背景
      ctx.fillStyle = btn.bgColor;
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 16);
      ctx.fill();
      
      // 简单的边框
      ctx.strokeStyle = isSelected ? btn.iconColor : this.theme.border;
      ctx.lineWidth = isSelected ? 2 : 1;
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 16);
      ctx.stroke();
      
      // 渲染图标（更大，更居中）
      const iconSize = 36;
      const iconX = btn.x + btn.width / 2;
      const iconY = btn.y + 45;
      
      this.renderIcon(ctx, btn.icon, iconX, iconY, iconSize, btn.iconColor);
      
      // 按钮标签
      ctx.fillStyle = this.theme.textPrimary;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.width / 2, btn.y + 90);
      
      ctx.restore();
    });
  }
  
  renderIcon(ctx, iconType, x, y, size, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    
    switch (iconType) {
      case 'chat':
        // 简单的聊天图标
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💬', x, y);
        break;
        
      case 'breathing':
        // 简单的波浪线
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = color;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌬️', x, y);
        break;
        
      case 'lightbulb':
        // 简单的灯泡
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💡', x, y);
        break;
        
      case 'book':
        // 简单的书本
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📖', x, y);
        break;
    }
    
    ctx.restore();
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
  
  renderMainFeature(ctx) {
    // 更大的间距
    const featureY = this.statusBarHeight + 400;
    const featureHeight = 180;
    const featureWidth = SCREEN_WIDTH - 60;
    const featureX = 30;
    
    ctx.save();
    
    // 卡片背景
    ctx.fillStyle = this.theme.cardBg;
    this.drawRoundedRect(ctx, featureX, featureY, featureWidth, featureHeight, 20);
    ctx.fill();
    
    // 边框
    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, featureX, featureY, featureWidth, featureHeight, 20);
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('情绪状态评估', featureX + 20, featureY + 25);
    
    // 简化的描述（单行）
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '15px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('了解情绪状态，获取个性化支持建议', featureX + 20, featureY + 65);
    
    // 评估按钮
    const buttonX = featureX + 20;
    const buttonY = featureY + featureHeight - 60;
    const buttonWidth = 140;
    const buttonHeight = 45;
    
    ctx.fillStyle = this.theme.primary;
    this.drawRoundedRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 22);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开始评估', buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);
    
    ctx.restore();
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
      console.error('[MainMenu] Canvas not found for deactivation');
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
    if (this.touchMoveHandler) {
      canvas.removeEventListener('mousemove', this.touchMoveHandler);
      canvas.removeEventListener('touchmove', this.touchMoveHandler);
    }
    
    console.log('[MainMenu] Event listeners removed');
  }
}