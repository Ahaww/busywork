import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import deepseekApi from '../services/deepseek-api';

export default class MentalTips extends Emitter {
  constructor() {
    super();
    
    this.isWxEnv = typeof wx !== 'undefined';
    this.statusBarHeight = 88;
    
    this.tips = [];
    this.currentTipIndex = 0;
    this.isLoading = false;
    this.errorMessage = '';
    
    this.buttons = [];
    this.selectedButtonIndex = -1;
    
    // 优化的蓝色主题配置 - 更专业美观
    this.theme = {
      primary: '#4A69BD', // 主蓝色
      primaryLight: '#6A89CC', // 浅蓝色
      secondary: '#FF9F43', // 橙色强调色
      accent: '#4DB6AC', // 青绿色
      background: '#F5F7FA', // 浅灰蓝色背景
      cardBg: '#FFFFFF',
      textPrimary: '#2C3E50', // 深蓝色文字
      textSecondary: '#485460', // 中灰色文字
      textLight: '#747D8C', // 浅灰色文字
      border: '#E8ECF1', // 浅灰色边框
      success: '#26DE81', // 绿色
      warning: '#FFB74D', // 橙色
      error: '#FC5C65', // 红色
      loading: '#4A69BD', // 加载动画颜色
      shadow: 'rgba(74, 105, 189, 0.1)', // 阴影颜色
      gradientStart: '#6A89CC', // 渐变开始
      gradientEnd: '#4A69BD'  // 渐变结束
    };
    
    // 本地备用小贴士库
    this.backupTips = [
      {
        title: '渐进式肌肉放松法',
        category: '放松技巧',
        content: '这是一种通过系统性地紧张和放松身体不同肌肉群来减轻压力与焦虑的技巧。首先，找一个安静舒适的地方坐下或躺下。从脚部开始，用力绷紧肌肉5-7秒，然后彻底放松10-15秒。接着依次向上进行：小腿、大腿、腹部、手臂、肩膀、面部等肌群。整个过程约10-15分钟。',
        icon: '🌿'
      },
      {
        title: '正念呼吸法',
        category: '放松技巧',
        content: '专注于呼吸的练习，每次感觉分心时，温和地将注意力带回呼吸。每天练习5-10分钟，可以有效降低压力水平，提高专注力。',
        icon: '🌬️'
      },
      {
        title: '感恩日记',
        category: '积极心理',
        content: '每天写下三件你感激的事情，无论大小。这个习惯能帮助你重新关注生活中的积极面，培养乐观心态。',
        icon: '📓'
      },
      {
        title: '社交连接',
        category: '人际关系',
        content: '每周至少与一位朋友或家人进行深度交流，分享彼此的感受和经历。良好的人际关系是心理健康的重要支柱。',
        icon: '👥'
      },
      {
        title: '数字排毒',
        category: '生活习惯',
        content: '每天设定一段不使用电子设备的时间，比如睡前一小时。这有助于改善睡眠质量，减少信息过载带来的焦虑。',
        icon: '📵'
      }
    ];
    
    this.initButtons();
    this.loadLocalTips();
  }
  
  // 加载本地备用小贴士
  loadLocalTips() {
    this.tips = [...this.backupTips];
    this.currentTipIndex = Math.floor(Math.random() * this.tips.length);
  }
  
  initButtons() {
    const buttonWidth = 180;
    const buttonHeight = 60;
    const startX = (SCREEN_WIDTH - buttonWidth) / 2;
    const startY = SCREEN_HEIGHT - 120;
    
    this.buttons = [
      {
        id: 'refresh',
        label: '换一条',
        icon: '🔄',
        x: startX,
        y: startY,
        width: buttonWidth,
        height: buttonHeight,
        bgColor: this.theme.primary,
        gradientStart: this.theme.gradientStart,
        gradientEnd: this.theme.gradientEnd,
        textColor: '#FFFFFF',
        shadowColor: 'rgba(74, 105, 189, 0.3)'
      }
    ];
  }
  
  bindTouchEvents() {
    if (!this.isWxEnv) return;
    
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
    
    // 检测重试按钮
    if (this.errorMessage) {
      const retryBtnX = SCREEN_WIDTH / 2 - 75;
      const retryBtnY = SCREEN_HEIGHT / 2 + 40;
      const retryBtnWidth = 150;
      const retryBtnHeight = 45;
      
      if (x >= retryBtnX && x <= retryBtnX + retryBtnWidth && 
          y >= retryBtnY && y <= retryBtnY + retryBtnHeight) {
        this.selectedButtonIndex = -3; // Retry button
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
        this.emit('backToMenu');
      }
    }
    // 处理刷新按钮点击
    else if (this.selectedButtonIndex >= 0) {
      const btn = this.buttons[this.selectedButtonIndex];
      if (x >= btn.x && x <= btn.x + btn.width && 
          y >= btn.y && y <= btn.y + btn.height) {
        if (btn.id === 'refresh') {
          this.generateTips();
        }
      }
    }
    // 处理重试按钮点击
    else if (this.selectedButtonIndex === -3) {
      const retryBtnX = SCREEN_WIDTH / 2 - 75;
      const retryBtnY = SCREEN_HEIGHT / 2 + 40;
      const retryBtnWidth = 150;
      const retryBtnHeight = 45;
      
      if (x >= retryBtnX && x <= retryBtnX + retryBtnWidth && 
          y >= retryBtnY && y <= retryBtnY + retryBtnHeight) {
        this.generateTips();
      }
    }
    
    this.selectedButtonIndex = -1;
  }
  
  async generateTips() {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const categories = ['放松技巧', '积极心理', '生活习惯', '身体健康', '人际关系', '自我成长', '自我认知', '压力管理'];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      
      const messages = [
        {
          role: 'system',
          content: '你是一个心理健康专家，专注于提供实用的心理健康建议和技巧。请生成1条心理健康小贴士，包含明确的标题、分类和详细内容。分类可以是：放松技巧、积极心理、生活习惯、身体健康、人际关系、自我成长、自我认知、压力管理等。贴士的格式应该是：标题|分类|内容。请确保内容实用、科学、易于理解，内容长度在100-200字之间。'
        },
        {
          role: 'user',
          content: `请生成一条关于${randomCategory}的心理健康小贴士，格式为：标题|分类|内容`
        }
      ];
      
      const response = await deepseekApi.sendRequest(messages, { timeout: 10000 });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const aiContent = response.choices?.[0]?.message?.content || '';
      
      if (aiContent) {
        this.parseAIContent(aiContent);
      } else {
        throw new Error('AI返回内容为空');
      }
    } catch (error) {
      console.error('生成心理小贴士失败:', error);
      this.errorMessage = error.message || '网络连接失败，请稍后重试';
      // 失败时随机显示一条本地备用小贴士
      this.loadLocalTips();
    } finally {
      this.isLoading = false;
    }
  }
  
  parseAIContent(content) {
    const lines = content.split('\n');
    const parsedTips = [];
    
    lines.forEach(line => {
      line = line.trim();
      if (line) {
        const parts = line.split('|');
        if (parts.length >= 3) {
          parsedTips.push({
            title: parts[0].trim(),
            category: parts[1].trim(),
            content: parts.slice(2).join('|').trim(),
            icon: this.getCategoryIcon(parts[1].trim())
          });
        }
      }
    });
    
    if (parsedTips.length > 0) {
      this.tips = parsedTips;
      this.currentTipIndex = 0;
    } else {
      this.loadLocalTips();
    }
  }
  
  getCategoryIcon(category) {
    const iconMap = {
      '放松技巧': '🌿',
      '积极心理': '😊',
      '生活习惯': '📝',
      '身体健康': '💪',
      '人际关系': '👥',
      '自我成长': '🌱',
      '自我认知': '🧠',
      '压力管理': '⚖️'
    };
    
    return iconMap[category] || '💡';
  }
  
  render(ctx) {
    this.renderBackground(ctx);
    this.renderStatusBar(ctx);
    
    if (this.isLoading) {
      this.renderLoading(ctx);
    } else if (this.errorMessage) {
      this.renderError(ctx);
    } else {
      this.renderTipCard(ctx);
      this.renderButtons(ctx);
    }
  }
  
  renderLoading(ctx) {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2;
    
    ctx.save();
    
    // 加载动画背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    this.drawRoundedRect(ctx, centerX - 100, centerY - 80, 200, 160, 16);
    ctx.fill();
    
    // 加载动画
    ctx.translate(centerX, centerY - 30);
    
    // 旋转圆圈
    const time = Date.now() / 1000;
    const rotation = time * 2 % (Math.PI * 2);
    ctx.rotate(rotation);
    
    // 绘制加载圆圈
    ctx.strokeStyle = this.theme.loading;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 1.8);
    ctx.stroke();
    
    ctx.restore();
    
    // 加载文字
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('正在生成小贴士...', centerX, centerY + 20);
    
    // 提示文字
    ctx.fillStyle = this.theme.textLight;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('正在调用AI生成个性化建议', centerX, centerY + 50);
  }
  
  renderError(ctx) {
    const centerX = SCREEN_WIDTH / 2;
    const centerY = SCREEN_HEIGHT / 2 - 50;
    
    // 错误卡片
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, centerX - 140, centerY - 70, 280, 200, 16);
    ctx.fill();
    
    // 错误图标
    ctx.fillStyle = this.theme.error;
    ctx.font = '48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️', centerX, centerY - 30);
    
    // 错误标题
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('生成失败', centerX, centerY + 10);
    
    // 错误信息
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.renderWrappedText(ctx, this.errorMessage, centerX - 120, centerY + 40, 240, 20);
    
    // 重试按钮
    const retryBtnX = SCREEN_WIDTH / 2 - 75;
    const retryBtnY = centerY + 90;
    const retryBtnWidth = 150;
    const retryBtnHeight = 48;
    
    // 按钮渐变
    const gradient = ctx.createLinearGradient(retryBtnX, retryBtnY, retryBtnX, retryBtnY + retryBtnHeight);
    gradient.addColorStop(0, this.theme.gradientStart);
    gradient.addColorStop(1, this.theme.gradientEnd);
    
    ctx.fillStyle = gradient;
    this.drawRoundedRect(ctx, retryBtnX, retryBtnY, retryBtnWidth, retryBtnHeight, 24);
    ctx.fill();
    
    // 按钮阴影
    ctx.shadowColor = this.theme.shadow;
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // 按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重试', SCREEN_WIDTH / 2, retryBtnY + retryBtnHeight / 2);
    
    ctx.shadowBlur = 0;
  }
  
  renderBackground(ctx) {
    // 创建渐变背景
    const gradient = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    gradient.addColorStop(0, '#F5F7FA');
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(1, '#E4EDF5');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // 添加装饰元素
    this.renderDecorations(ctx);
  }
  
  renderDecorations(ctx) {
    ctx.save();
    
    // 背景装饰 - 柔和几何形状
    ctx.fillStyle = 'rgba(106, 137, 204, 0.03)';
    
    // 圆形装饰
    ctx.beginPath();
    ctx.arc(SCREEN_WIDTH * 0.8, SCREEN_HEIGHT * 0.2, 60, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(SCREEN_WIDTH * 0.1, SCREEN_HEIGHT * 0.7, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // 线条装饰
    ctx.strokeStyle = 'rgba(74, 105, 189, 0.05)';
    ctx.lineWidth = 1;
    
    // 横线
    for (let i = 0; i < 5; i++) {
      const y = SCREEN_HEIGHT * (0.1 + i * 0.2);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SCREEN_WIDTH, y);
      ctx.stroke();
    }
    
    ctx.restore();
  }
  
  renderStatusBar(ctx) {
    const barHeight = this.statusBarHeight;
    
    // 状态栏背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, barHeight);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#F8FAFD');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, barHeight);
    
    // 底部阴影
    ctx.fillStyle = this.theme.border;
    ctx.fillRect(0, barHeight - 1, SCREEN_WIDTH, 1);
    
    // 返回按钮
    const backBtnX = 30;
    const backBtnY = Math.floor(barHeight * 0.65);
    
    ctx.fillStyle = this.theme.primary;
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', backBtnX, backBtnY);
    
    // 标题
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('心理知识', SCREEN_WIDTH / 2, backBtnY);
    
    // 副标题
    ctx.fillStyle = this.theme.textLight;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('心理健康小贴士', SCREEN_WIDTH / 2, backBtnY + 28);
  }
  
  renderTipCard(ctx) {
    if (this.tips.length === 0) {
      ctx.fillStyle = this.theme.textSecondary;
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无小贴士，请稍后再试', SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
      return;
    }
    
    const tip = this.tips[this.currentTipIndex];
    const cardX = 25;
    const cardY = this.statusBarHeight + 25;
    const cardWidth = SCREEN_WIDTH - 50;
    const cardHeight = SCREEN_HEIGHT - this.statusBarHeight - 160;
    
    ctx.save();
    
    // 卡片阴影
    ctx.shadowColor = this.theme.shadow;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    
    // 卡片背景
    ctx.fillStyle = this.theme.cardBg;
    this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fill();
    
    // 卡片边框
    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    const padding = 30;
    let currentY = cardY + padding;
    
    // 分类标签
    ctx.save();
    const tagWidth = ctx.measureText(tip.category).width + 60;
    ctx.fillStyle = 'rgba(106, 137, 204, 0.1)';
    this.drawRoundedRect(ctx, cardX + padding, currentY, tagWidth, 34, 17);
    ctx.fill();
    
    ctx.fillStyle = this.theme.primary;
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(tip.icon, cardX + padding + 12, currentY + 17);
    ctx.fillText(tip.category, cardX + padding + 42, currentY + 17);
    ctx.restore();
    
    currentY += 50;
    
    // 标题
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(tip.title, cardX + padding, currentY);
    
    currentY += 40;
    
    // 分隔线
    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + padding, currentY);
    ctx.lineTo(cardX + cardWidth - padding, currentY);
    ctx.stroke();
    
    currentY += 25;
    
    // 内容
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    this.renderWrappedText(ctx, tip.content, cardX + padding, currentY, cardWidth - padding * 2, 24);
    
    // 卡片底部信息
    const bottomY = cardY + cardHeight - 15;
    ctx.fillStyle = this.theme.textLight;
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`💡 心理健康小贴士 ${this.currentTipIndex + 1}/${this.tips.length}`, cardX + cardWidth - padding, bottomY);
    
    ctx.restore();
  }
  
  renderWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let lineCount = 0;
    const maxLines = 10;
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const testWidth = ctx.measureText(testLine).width;
      
      if (testWidth > maxWidth || words[i] === '\n') {
        if (lineCount < maxLines - 1) {
          ctx.fillText(line, x, currentY);
          line = words[i] === '\n' ? '' : words[i];
          currentY += lineHeight;
          lineCount++;
        } else {
          let truncatedLine = line;
          while (ctx.measureText(truncatedLine + '...').width > maxWidth && truncatedLine.length > 0) {
            truncatedLine = truncatedLine.substring(0, truncatedLine.length - 1);
          }
          ctx.fillText(truncatedLine + '...', x, currentY);
          return currentY;
        }
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      ctx.fillText(line, x, currentY);
    }
    
    return currentY;
  }
  
  renderButtons(ctx) {
    if (this.tips.length === 0) return;
    
    this.buttons.forEach((btn, index) => {
      const isSelected = index === this.selectedButtonIndex;
      
      ctx.save();
      
      // 按钮阴影
      ctx.shadowColor = isSelected ? 'rgba(74, 105, 189, 0.4)' : this.theme.shadow;
      ctx.shadowBlur = isSelected ? 16 : 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isSelected ? 6 : 4;
      
      // 按钮渐变
      const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height);
      gradient.addColorStop(0, btn.gradientStart);
      gradient.addColorStop(1, btn.gradientEnd);
      
      ctx.fillStyle = gradient;
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 30);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // 按钮边框
      ctx.strokeStyle = isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = isSelected ? 3 : 2;
      this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 30);
      ctx.stroke();
      
      // 按钮图标
      ctx.fillStyle = btn.textColor;
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.icon, btn.x + 35, btn.y + btn.height / 2);
      
      // 按钮文字
      ctx.fillStyle = btn.textColor;
      ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, btn.x + btn.width / 2 + 10, btn.y + btn.height / 2);
      
      // 悬停效果
      if (isSelected) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.drawRoundedRect(ctx, btn.x, btn.y, btn.width, btn.height, 30);
        ctx.fill();
      }
      
      ctx.restore();
    });
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
  
  nextTip() {
    if (this.tips.length === 0) return;
    this.currentTipIndex = (this.currentTipIndex + 1) % this.tips.length;
  }
  
  prevTip() {
    if (this.tips.length === 0) return;
    this.currentTipIndex = (this.currentTipIndex - 1 + this.tips.length) % this.tips.length;
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