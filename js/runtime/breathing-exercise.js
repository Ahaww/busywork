import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class BreathingExercise extends Emitter {
  constructor() {
    super();
    
    this.isWxEnv = typeof wx !== 'undefined';
    this.statusBarHeight = 88;
    
    this.isRunning = false;
    this.phase = 'idle';
    this.phaseStartTime = 0;
    this.circleRadius = 100;
    this.targetRadius = 100;
    this.animationSpeed = 0.05;
    
    this.phases = [
      { 
        name: '吸气', 
        duration: 4000, 
        targetRadius: 180, 
        color: '#66BB6A', // 浅绿色
        gradientStart: '#A5D6A7',
        gradientEnd: '#66BB6A',
        instruction: '慢慢地、深深地吸气'
      },
      { 
        name: '屏息', 
        duration: 2000, 
        targetRadius: 180, 
        color: '#FFB74D', // 橙色，用于醒目标识屏息
        gradientStart: '#FFCC80',
        gradientEnd: '#FFB74D',
        instruction: '保持呼吸，感受平静'
      },
      { 
        name: '呼气', 
        duration: 4000, 
        targetRadius: 100, 
        color: '#4DB6AC', // 青色
        gradientStart: '#80CBC4',
        gradientEnd: '#4DB6AC',
        instruction: '缓慢地、完全地呼气'
      },
      { 
        name: '屏息', 
        duration: 2000, 
        targetRadius: 100, 
        color: '#FFB74D', // 橙色，用于醒目标识屏息
        gradientStart: '#FFCC80',
        gradientEnd: '#FFB74D',
        instruction: '保持呼吸，准备下一次'
      }
    ];
    this.currentPhaseIndex = 0;
    
    this.buttons = [];
    this.selectedButtonIndex = -1;
    
    this.pulseAnim = 0;
    this.rippleEffects = [];
    
    // 浅绿色主题配置
    this.theme = {
      primary: '#66BB6A', // 主绿色
      primaryLight: '#E8F5E9', // 浅绿色背景
      secondary: '#81C784', // 次绿色
      accent: '#4DB6AC', // 青色
      background: '#F1F8E9', // 非常浅的绿色背景
      cardBg: '#FFFFFF',
      textPrimary: '#33691E', // 深绿色文字
      textSecondary: '#689F38', // 中等绿色文字
      border: '#C8E6C9', // 浅绿色边框
      success: '#66BB6A',
      warning: '#FFB74D',
      error: '#EF9A9A' // 浅红色
    };
    
    this.initButtons();
  }
  
  initButtons() {
    const buttonWidth = 140;
    const buttonHeight = 55;
    const buttonSpacing = 25;
    const startX = (SCREEN_WIDTH - buttonWidth * 2 - buttonSpacing) / 2;
    const startY = SCREEN_HEIGHT - 120;
    
    this.buttons = [
      {
        id: 'start',
        label: '开始练习',
        icon: '▶',
        x: startX,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#66BB6A', // 浅绿色
        gradientStart: '#81C784',
        gradientEnd: '#66BB6A',
        textColor: '#FFFFFF',
        shadowColor: 'rgba(102, 187, 106, 0.3)'
      },
      {
        id: 'stop',
        label: '暂停',
        icon: '⏸',
        x: startX + buttonWidth + buttonSpacing,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: '#EF9A9A', // 浅红色
        gradientStart: '#FFAB91',
        gradientEnd: '#EF9A9A',
        textColor: '#FFFFFF',
        shadowColor: 'rgba(239, 154, 154, 0.3)'
      }
    ];
  }
  
  bindTouchEvents() {
    this.touchStartHandler = (event) => {
      const touch = event.touches[0];
      this.handleTouchStart(touch.clientX, touch.clientY);
    };
    
    this.touchEndHandler = (event) => {
      const touch = event.changedTouches[0];
      this.handleTouchEnd(touch.clientX, touch.clientY);
    };
    
    if (wx.onTouchStart) {
      wx.onTouchStart(this.touchStartHandler);
    }
    if (wx.onTouchEnd) {
      wx.onTouchEnd(this.touchEndHandler);
    }
  }
  
  handleTouchStart(x, y) {
    this.selectedButtonIndex = -1;
    
    // 检测返回按钮
    const backBtnX = 30;
    const backBtnY = Math.floor(this.statusBarHeight * 0.65);
    
    if (x >= backBtnX && x <= backBtnX + 60 && 
        y >= backBtnY - 20 && y <= backBtnY + 20) {
      this.selectedButtonIndex = -2; // Back button
      return;
    }
    
    // 检测操作按钮
    for (let i = 0; i < this.buttons.length; i++) {
      const btn = this.buttons[i];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        this.selectedButtonIndex = i;
        break;
      }
    }
  }
  
  handleTouchEnd(x, y) {
    // 处理返回按钮点击
    if (this.selectedButtonIndex === -2) {
      const backBtnX = 30;
      const backBtnY = Math.floor(this.statusBarHeight * 0.65);
      
      if (x >= backBtnX && x <= backBtnX + 60 && 
          y >= backBtnY - 20 && y <= backBtnY + 20) {
        this.stopBreathing();
        this.emit('backToMenu');
      }
    }
    // 处理操作按钮点击
    else if (this.selectedButtonIndex >= 0) {
      const btn = this.buttons[this.selectedButtonIndex];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        if (btn.id === 'start') {
          this.startBreathing();
        } else if (btn.id === 'stop') {
          this.stopBreathing();
        }
      }
    }
    
    this.selectedButtonIndex = -1;
  }
  
  startBreathing() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.currentPhaseIndex = 0;
      this.phaseStartTime = Date.now();
      this.phase = this.phases[0].name;
      this.targetRadius = this.phases[0].targetRadius;
      
      // 添加波纹效果
      this.rippleEffects = [];
      this.addRippleEffect();
    }
  }
  
  stopBreathing() {
    this.isRunning = false;
    this.phase = 'idle';
    this.circleRadius = 100;
    this.targetRadius = 100;
    this.rippleEffects = [];
  }
  
  addRippleEffect() {
    if (this.isRunning) {
      this.rippleEffects.push({
        radius: this.circleRadius,
        opacity: 0.8,
        lineWidth: 3,
        color: this.phases[this.currentPhaseIndex].color
      });
      
      // 每2秒添加一个波纹效果
      setTimeout(() => this.addRippleEffect(), 2000);
    }
  }
  
  update() {
    // 更新脉动动画
    this.pulseAnim = (this.pulseAnim + 0.03) % (Math.PI * 2);
    
    if (this.isRunning) {
      const now = Date.now();
      const currentPhase = this.phases[this.currentPhaseIndex];
      const elapsed = now - this.phaseStartTime;
      
      // 更新波纹效果
      this.rippleEffects = this.rippleEffects.filter(effect => {
        effect.radius += 2;
        effect.opacity -= 0.02;
        effect.lineWidth = Math.max(1, effect.lineWidth - 0.1);
        return effect.opacity > 0;
      });
      
      if (elapsed >= currentPhase.duration) {
        this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
        this.phaseStartTime = now;
        this.phase = this.phases[this.currentPhaseIndex].name;
        this.targetRadius = this.phases[this.currentPhaseIndex].targetRadius;
      }
      
      // 平滑过渡圆圈半径
      const diff = this.targetRadius - this.circleRadius;
      this.circleRadius += diff * this.animationSpeed;
    }
  }
  
  render(ctx) {
    this.update();
    this.renderBackground(ctx);
    this.renderStatusBar(ctx);
    this.renderDecorations(ctx);
    this.renderBreathingCircle(ctx);
    this.renderInstructions(ctx);
    this.renderButtons(ctx);
  }
  
  renderBackground(ctx) {
    // 创建浅绿色渐变背景
    const gradient = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    gradient.addColorStop(0, '#F1F8E9'); // 非常浅的绿色
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(1, '#E8F5E9'); // 浅绿色
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  
  renderDecorations(ctx) {
    ctx.save();
    
    // 左上角装饰 - 浅绿色
    ctx.fillStyle = 'rgba(165, 214, 167, 0.1)';
    ctx.beginPath();
    ctx.arc(-30, -30, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // 右下角装饰 - 青色
    ctx.fillStyle = 'rgba(77, 182, 172, 0.1)';
    ctx.beginPath();
    ctx.arc(SCREEN_WIDTH + 40, SCREEN_HEIGHT + 40, 100, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加浅绿色小圆点装饰
    ctx.fillStyle = 'rgba(129, 199, 132, 0.2)';
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const distance = 60;
      const x = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
      const y = SCREEN_HEIGHT / 2 - 50 + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 添加一些叶子装饰
    ctx.fillStyle = 'rgba(129, 199, 132, 0.3)';
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i + 0.5;
      const distance = 120;
      const x = SCREEN_WIDTH / 2 + Math.cos(angle) * distance;
      const y = SCREEN_HEIGHT / 2 - 50 + Math.sin(angle) * distance;
      
      // 绘制简单的叶子形状
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    ctx.restore();
  }
  
  renderStatusBar(ctx) {
    const barHeight = this.statusBarHeight;
    
    // 状态栏背景渐变 - 浅绿色
    const gradient = ctx.createLinearGradient(0, 0, 0, barHeight);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#F1F8E9');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, barHeight);
    
    // 底部阴影
    ctx.fillStyle = 'rgba(200, 230, 201, 0.5)'; // 浅绿色阴影
    ctx.fillRect(0, barHeight - 1, SCREEN_WIDTH, 1);
    
    // 返回按钮 - 浅绿色
    const backBtnX = 30;
    const backBtnY = Math.floor(barHeight * 0.65);
    
    ctx.fillStyle = this.theme.primary;
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', backBtnX, backBtnY);
    
    // 标题 - 深绿色
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('呼吸放松练习', SCREEN_WIDTH / 2, backBtnY);
  }
  
  renderBreathingCircle(ctx) {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2 - 50;
    
    // 渲染波纹效果
    this.rippleEffects.forEach(effect => {
      ctx.save();
      ctx.strokeStyle = `rgba(${this.hexToRgb(effect.color)}, ${effect.opacity})`;
      ctx.lineWidth = effect.lineWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, effect.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    
    // 主呼吸圆圈
    ctx.save();
    
    // 脉动光环效果
    if (this.isRunning) {
      const pulseRadius = this.circleRadius + Math.sin(this.pulseAnim) * 5;
      const currentPhase = this.phases[this.currentPhaseIndex];
      
      // 创建径向渐变
      const gradient = ctx.createRadialGradient(
        centerX, centerY, this.circleRadius * 0.7,
        centerX, centerY, this.circleRadius
      );
      gradient.addColorStop(0, currentPhase.gradientStart);
      gradient.addColorStop(1, currentPhase.gradientEnd);
      
      ctx.fillStyle = gradient;
      
      // 外发光效果
      ctx.shadowColor = currentPhase.color;
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else {
      // 静态渐变 - 浅绿色
      const gradient = ctx.createRadialGradient(
        centerX, centerY, this.circleRadius * 0.7,
        centerX, centerY, this.circleRadius
      );
      gradient.addColorStop(0, '#C8E6C9'); // 浅绿色
      gradient.addColorStop(1, '#A5D6A7'); // 中等浅绿色
      ctx.fillStyle = gradient;
    }
    
    // 绘制主圆圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.circleRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 圆圈边框
    ctx.strokeStyle = this.isRunning ? this.phases[this.currentPhaseIndex].color : '#81C784';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 内圆圈（呼吸指示器）
    const innerRadius = this.circleRadius * 0.6;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 呼吸指示器动画
    if (this.isRunning) {
      const breathScale = 0.8 + Math.sin(this.pulseAnim * 2) * 0.2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius * breathScale, 0, Math.PI * 2);
      ctx.fill();
      
      // 添加内圈脉动效果
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(this.pulseAnim) * 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  renderInstructions(ctx) {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2 - 50;
    
    // 当前阶段指示器
    if (this.isRunning) {
      const currentPhase = this.phases[this.currentPhaseIndex];
      
      // 阶段名称
      ctx.fillStyle = currentPhase.color;
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(currentPhase.name, centerX, centerY);
      
      // 倒计时指示器
      const now = Date.now();
      const elapsed = now - this.phaseStartTime;
      const remaining = Math.max(0, currentPhase.duration - elapsed);
      const seconds = (remaining / 1000).toFixed(1);
      
      ctx.fillStyle = this.theme.textSecondary;
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${seconds}s`, centerX, centerY + 40);
      
      // 阶段说明
      ctx.fillStyle = this.theme.textSecondary;
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(currentPhase.instruction, centerX, centerY + 180);
    } else {
      // 欢迎/暂停状态
      ctx.fillStyle = this.theme.textPrimary;
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('呼吸放松', centerX, centerY - 10);
      
      ctx.fillStyle = this.theme.textSecondary;
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('跟随圆圈节奏深呼吸', centerX, centerY + 30);
      
      // 呼吸周期说明
      ctx.fillStyle = this.theme.textSecondary;
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('吸气4秒 → 屏息2秒 → 呼气4秒 → 屏息2秒', centerX, centerY + 180);
    }
    
    // 进度指示器
    if (this.isRunning) {
      const totalDuration = this.phases.reduce((sum, phase) => sum + phase.duration, 0);
      const elapsedTotal = this.getElapsedTime();
      const progress = (elapsedTotal % totalDuration) / totalDuration;
      
      ctx.fillStyle = this.theme.border;
      ctx.fillRect(centerX - 100, centerY + 220, 200, 6);
      
      ctx.fillStyle = this.phases[this.currentPhaseIndex].color;
      ctx.fillRect(centerX - 100, centerY + 220, 200 * progress, 6);
    }
  }
  
  getElapsedTime() {
    if (!this.isRunning) return 0;
    
    const now = Date.now();
    const phaseElapsed = now - this.phaseStartTime;
    let totalElapsed = phaseElapsed;
    
    for (let i = 0; i < this.currentPhaseIndex; i++) {
      totalElapsed += this.phases[i].duration;
    }
    
    return totalElapsed;
  }
  
  renderButtons(ctx) {
    this.buttons.forEach((btn, index) => {
      const isSelected = index === this.selectedButtonIndex;
      const isActive = (btn.id === 'start' && !this.isRunning) || (btn.id === 'stop' && this.isRunning);
      
      ctx.save();
      
      // 按钮渐变
      const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
      gradient.addColorStop(0, btn.gradientStart);
      gradient.addColorStop(1, btn.gradientEnd);
      
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 28);
      ctx.fill();
      
      // 按钮阴影
      ctx.shadowColor = isSelected ? btn.shadowColor : 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = isSelected ? 20 : 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isSelected ? 8 : 4;
      
      // 按钮边框
      ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = isSelected ? 3 : 2;
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 28);
      ctx.stroke();
      
      // 按钮图标
      ctx.fillStyle = btn.textColor;
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.icon, btn.x + 25, btn.y + btn.height / 2);
      
      // 按钮文字
      ctx.fillStyle = btn.textColor;
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.width / 2 + 10, btn.y + btn.height / 2);
      
      // 悬停效果
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 28);
        ctx.fill();
      }
      
      // 禁用状态
      if (!isActive) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 28);
        ctx.fill();
      }
      
      ctx.restore();
    });
  }
  
  // 辅助函数：将十六进制颜色转换为rgba字符串
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '102, 187, 106';
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
    if (this.isWxEnv) {
      this.bindTouchEvents();
    }
  }
  
  deactivate() {
    if (this.isWxEnv) {
      if (wx.offTouchStart && this.touchStartHandler) {
        wx.offTouchStart(this.touchStartHandler);
      }
      if (wx.offTouchEnd && this.touchEndHandler) {
        wx.offTouchEnd(this.touchEndHandler);
      }
    }
  }
}