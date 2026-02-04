import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

export default class MoodAssessment extends Emitter {
  constructor() {
    super();
    
    this.isWxEnv = typeof wx !== 'undefined';
    this.statusBarHeight = 88;
    
    this.currentQuestionIndex = 0;
    this.answers = [];
    
    // 颜色主题配置
    this.theme = {
      primary: '#5B8BF7',
      primaryLight: '#E8EEFF',
      background: '#F8FAFF',
      cardBg: '#FFFFFF',
      textPrimary: '#2D3748',
      textSecondary: '#718096',
      border: '#E2E8F0',
      success: '#48BB78',
      warning: '#ED8936',
      error: '#F56565',
      good: '#4CAF50',
      medium: '#FF9800',
      poor: '#F44336'
    };
    
    this.questions = [
      {
        id: 1,
        text: '您最近一周的心情如何？',
        options: [
          { text: '非常愉快', score: 5, emoji: '😊' },
          { text: '比较愉快', score: 4, emoji: '🙂' },
          { text: '一般', score: 3, emoji: '😐' },
          { text: '比较低落', score: 2, emoji: '😔' },
          { text: '非常低落', score: 1, emoji: '😢' }
        ]
      },
      {
        id: 2,
        text: '您最近一周的睡眠质量如何？',
        options: [
          { text: '非常好', score: 5, emoji: '😴' },
          { text: '比较好', score: 4, emoji: '😌' },
          { text: '一般', score: 3, emoji: '😪' },
          { text: '比较差', score: 2, emoji: '😫' },
          { text: '非常差', score: 1, emoji: '🥱' }
        ]
      },
      {
        id: 3,
        text: '您最近一周的精力状态如何？',
        options: [
          { text: '非常充沛', score: 5, emoji: '💪' },
          { text: '比较充沛', score: 4, emoji: '👍' },
          { text: '一般', score: 3, emoji: '🤔' },
          { text: '比较疲惫', score: 2, emoji: '😴' },
          { text: '非常疲惫', score: 1, emoji: '😫' }
        ]
      },
      {
        id: 4,
        text: '您最近一周的压力水平如何？',
        options: [
          { text: '非常低', score: 5, emoji: '😌' },
          { text: '比较低', score: 4, emoji: '🙂' },
          { text: '一般', score: 3, emoji: '😐' },
          { text: '比较高', score: 2, emoji: '😰' },
          { text: '非常高', score: 1, emoji: '😫' }
        ]
      },
      {
        id: 5,
        text: '您最近一周的社交活动频率如何？',
        options: [
          { text: '非常频繁', score: 5, emoji: '👥' },
          { text: '比较频繁', score: 4, emoji: '👭' },
          { text: '一般', score: 3, emoji: '🙋' },
          { text: '比较少', score: 2, emoji: '🧍' },
          { text: '非常少', score: 1, emoji: '🏠' }
        ]
      }
    ];
    
    this.selectedOptionIndex = -1;
  }
  
  bindTouchEvents() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[MoodAssessment] Canvas not found');
      return;
    }
    
    // 统一的事件处理函数
    this.touchStartHandler = (e) => {
      e.preventDefault();
      const x = e.clientX || (e.touches && e.touches[0].clientX);
      const y = e.clientY || (e.touches && e.touches[0].clientY);
      if (x !== undefined && y !== undefined) {
        console.log('[MoodAssessment] Start event:', { x, y });
        this.handleTouchStart(x, y);
      }
    };
    
    this.touchEndHandler = (e) => {
      e.preventDefault();
      const x = e.clientX || (e.changedTouches && e.changedTouches[0].clientX);
      const y = e.clientY || (e.changedTouches && e.changedTouches[0].clientY);
      if (x !== undefined && y !== undefined) {
        console.log('[MoodAssessment] End event:', { x, y });
        this.handleTouchEnd(x, y);
      }
    };
    
    // 添加事件监听器
    canvas.addEventListener('mousedown', this.touchStartHandler);
    canvas.addEventListener('touchstart', this.touchStartHandler);
    
    canvas.addEventListener('mouseup', this.touchEndHandler);
    canvas.addEventListener('touchend', this.touchEndHandler);
    
    console.log('[MoodAssessment] Event listeners bound to canvas');
  }
  
  handleTouchStart(x, y) {
    // 检测顶部返回箭头
    const backIconX = 30;
    const backIconY = Math.floor(this.statusBarHeight * 0.65);
    
    if (x >= backIconX && x <= backIconX + 60 && 
        y >= backIconY - 20 && y <= backIconY + 20) {
      this.selectedOptionIndex = -3; // Back arrow
      return;
    }
    
    if (this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      const optionHeight = 70;
      const optionSpacing = 15;
      const startY = this.statusBarHeight + 200;
      
      for (let i = 0; i < question.options.length; i++) {
        const optionY = startY + i * (optionHeight + optionSpacing);
        if (x >= 30 && x <= SCREEN_WIDTH - 30 && 
            y >= optionY && y <= optionY + optionHeight) {
          this.selectedOptionIndex = i;
          break;
        }
      }
    } else {
      const backButtonX = SCREEN_WIDTH / 2 - 100;
      const backButtonY = this.statusBarHeight + 660;
      const backButtonWidth = 200;
      const backButtonHeight = 50;
      
      if (x >= backButtonX && x <= backButtonX + backButtonWidth && 
          y >= backButtonY && y <= backButtonY + backButtonHeight) {
        this.selectedOptionIndex = -2; // Back button
      }
    }
  }
  
  handleTouchEnd(x, y) {
    // 处理顶部返回箭头点击
    if (this.selectedOptionIndex === -3) {
      const backIconX = 30;
      const backIconY = Math.floor(this.statusBarHeight * 0.65);
      
      if (x >= backIconX && x <= backIconX + 60 && 
          y >= backIconY - 20 && y <= backIconY + 20) {
        this.emit('backToMenu');
      }
    } else if (this.selectedOptionIndex === -2) {
      const backButtonX = SCREEN_WIDTH / 2 - 100;
      const backButtonY = this.statusBarHeight + 660;
      const backButtonWidth = 200;
      const backButtonHeight = 50;
      
      if (x >= backButtonX && x <= backButtonX + backButtonWidth && 
          y >= backButtonY && y <= backButtonY + backButtonHeight) {
        this.emit('backToMenu');
      }
    } else if (this.selectedOptionIndex >= 0 && this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      const optionHeight = 70;
      const optionSpacing = 15;
      const startY = this.statusBarHeight + 200;
      
      for (let i = 0; i < question.options.length; i++) {
        const optionY = startY + i * (optionHeight + optionSpacing);
        if (x >= 30 && x <= SCREEN_WIDTH - 30 && 
            y >= optionY && y <= optionY + optionHeight) {
          this.answers.push({
            questionId: question.id,
            selectedOption: i,
            score: question.options[i].score
          });
          
          this.currentQuestionIndex++;
          this.selectedOptionIndex = -1;
          break;
        }
      }
    }
  }
  
  calculateResult() {
    const totalScore = this.answers.reduce((sum, answer) => sum + answer.score, 0);
    const averageScore = totalScore / this.questions.length;
    
    if (averageScore >= 4) {
      return {
        level: '良好',
        emoji: '😊',
        message: '您的情绪状态良好，继续保持积极的生活态度！',
        suggestion: '建议您继续保持规律的作息和适量的运动，多与朋友家人交流，保持乐观的心态。',
        color: this.theme.good,
        gradientStart: '#E8F5E9',
        gradientEnd: '#F1F8E9'
      };
    } else if (averageScore >= 3) {
      return {
        level: '一般',
        emoji: '😐',
        message: '您的情绪状态一般，需要适当关注和调整。',
        suggestion: '建议您尝试一些放松技巧，如深呼吸、冥想或瑜伽，保持充足的睡眠，必要时与心理咨询师交流。',
        color: this.theme.medium,
        gradientStart: '#FFF3E0',
        gradientEnd: '#FFECB3'
      };
    } else {
      return {
        level: '需要关注',
        emoji: '😔',
        message: '您的情绪状态需要特别关注，建议寻求专业帮助。',
        suggestion: '建议您尽快与专业心理咨询师联系，同时尝试一些情绪管理技巧，如写日记、听音乐、进行适度的运动等。',
        color: this.theme.poor,
        gradientStart: '#FFEBEE',
        gradientEnd: '#FFCDD2'
      };
    }
  }
  
  render(ctx) {
    this.renderBackground(ctx);
    this.renderStatusBar(ctx);
    
    if (this.currentQuestionIndex < this.questions.length) {
      this.renderQuestion(ctx);
    } else {
      this.renderResult(ctx);
    }
  }
  
  renderBackground(ctx) {
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    gradient.addColorStop(0, '#F8FAFF');
    gradient.addColorStop(0.5, '#FFFFFF');
    gradient.addColorStop(1, '#F0F4FF');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  }
  
  renderStatusBar(ctx) {
    const barHeight = this.statusBarHeight;
    
    // 状态栏背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, barHeight);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(1, '#F8FAFF');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SCREEN_WIDTH, barHeight);
    
    // 底部阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, barHeight - 1, SCREEN_WIDTH, 1);
    
    // 返回按钮
    const backIconX = 30;
    const backIconY = Math.floor(barHeight * 0.65);
    
    ctx.fillStyle = this.theme.primary;
    ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('←', backIconX, backIconY);
    
    // 标题
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('情绪状态评估', SCREEN_WIDTH / 2, backIconY);
  }
  
  renderQuestion(ctx) {
    const question = this.questions[this.currentQuestionIndex];
    const progress = (this.currentQuestionIndex + 1) / this.questions.length;
    
    // 进度指示器
    ctx.fillStyle = this.theme.border;
    this.drawRoundedRect(ctx, 30, this.statusBarHeight + 80, SCREEN_WIDTH - 60, 10, 5);
    ctx.fill();
    
    ctx.fillStyle = this.theme.primary;
    this.drawRoundedRect(ctx, 30, this.statusBarHeight + 80, (SCREEN_WIDTH - 60) * progress, 10, 5);
    ctx.fill();
    
    // 进度文字
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`问题 ${this.currentQuestionIndex + 1} / ${this.questions.length}`, 
                 SCREEN_WIDTH / 2, this.statusBarHeight + 105);
    
    // 修复：问题文本显示区域增加，字体调整
    const questionText = question.text;
    const questionX = 40; // 增加左边距
    const questionY = this.statusBarHeight + 130;
    const questionWidth = SCREEN_WIDTH - 80; // 增加可用宽度
    const lineHeight = 28;
    
    // 问题文本容器
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    this.drawRoundedRect(ctx, 30, this.statusBarHeight + 120, SCREEN_WIDTH - 60, 80, 12);
    ctx.fill();
    
    // 阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.05)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    
    // 边框
    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, 30, this.statusBarHeight + 120, SCREEN_WIDTH - 60, 80, 12);
    ctx.stroke();
    
    // 问题图标
    ctx.fillStyle = this.theme.primary;
    ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❓', 50, this.statusBarHeight + 160);
    
    ctx.restore();
    
    // 问题文本
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; // 减小字体大小
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // 使用改进的文本换行函数
    this.renderWrappedTextFixed(ctx, questionText, questionX + 40, questionY, questionWidth - 40, lineHeight);
    
    // 选项
    const optionHeight = 70;
    const optionSpacing = 12; // 减小选项间距
    const startY = this.statusBarHeight + 210; // 调整起始位置
    
    question.options.forEach((option, index) => {
      const optionY = startY + index * (optionHeight + optionSpacing);
      
      ctx.save();
      
      // 悬停效果
      if (this.selectedOptionIndex === index) {
        ctx.fillStyle = this.theme.primaryLight;
      } else {
        ctx.fillStyle = '#FFFFFF';
      }
      
      this.drawRoundedRect(ctx, 30, optionY, SCREEN_WIDTH - 60, optionHeight, 14);
      ctx.fill();
      
      // 阴影
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 3;
      
      // 边框
      ctx.strokeStyle = this.selectedOptionIndex === index ? this.theme.primary : this.theme.border;
      ctx.lineWidth = this.selectedOptionIndex === index ? 2 : 1;
      this.drawRoundedRect(ctx, 30, optionY, SCREEN_WIDTH - 60, optionHeight, 14);
      ctx.stroke();
      
      // Emoji图标
      ctx.fillStyle = this.theme.textPrimary;
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(option.emoji, 50, optionY + optionHeight / 2);
      
      // 选项文本 - 确保文本完全显示
      ctx.fillStyle = this.theme.textPrimary;
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // 测量文本宽度
      const textMetrics = ctx.measureText(option.text);
      const textWidth = textMetrics.width;
      const maxTextWidth = SCREEN_WIDTH - 120; // 留出足够的空间
      
      if (textWidth > maxTextWidth) {
        // 如果文本太长，缩小字体
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      }
      
      ctx.fillText(option.text, 90, optionY + optionHeight / 2);
      
      // 选中标记
      if (this.selectedOptionIndex === index) {
        ctx.fillStyle = this.theme.primary;
        ctx.beginPath();
        ctx.arc(SCREEN_WIDTH - 50, optionY + optionHeight / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', SCREEN_WIDTH - 50, optionY + optionHeight / 2);
      }
      
      ctx.restore();
    });
  }
  
  renderResult(ctx) {
    const result = this.calculateResult();
    
    ctx.save();
    
    // 结果卡片背景
    const gradient = ctx.createLinearGradient(30, this.statusBarHeight + 120, 30, this.statusBarHeight + 580);
    gradient.addColorStop(0, result.gradientStart);
    gradient.addColorStop(1, result.gradientEnd);
    
    ctx.fillStyle = gradient;
    this.drawRoundedRect(ctx, 30, this.statusBarHeight + 120, SCREEN_WIDTH - 60, 460, 20);
    ctx.fill();
    
    // 卡片阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    
    ctx.strokeStyle = this.theme.border;
    ctx.lineWidth = 1;
    this.drawRoundedRect(ctx, 30, this.statusBarHeight + 120, SCREEN_WIDTH - 60, 460, 20);
    ctx.stroke();
    
    // 结果表情和标题
    ctx.fillStyle = result.color;
    ctx.font = '48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(result.emoji, SCREEN_WIDTH / 2, this.statusBarHeight + 180);
    
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('评估完成', SCREEN_WIDTH / 2, this.statusBarHeight + 230);
    
    // 状态级别
    ctx.fillStyle = result.color;
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(result.level, SCREEN_WIDTH / 2, this.statusBarHeight + 270);
    
    // 消息
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const messageEndY = this.renderWrappedTextFixed(ctx, result.message, 50, 
                                               this.statusBarHeight + 320, SCREEN_WIDTH - 100, 20);
    
    // 建议标题
    ctx.fillStyle = this.theme.textPrimary;
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('💡 建议', 50, messageEndY + 25);
    
    // 建议内容
    ctx.fillStyle = this.theme.textSecondary;
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    this.renderWrappedTextFixed(ctx, result.suggestion, 50, messageEndY + 55, SCREEN_WIDTH - 100, 18);
    
    ctx.restore();
    
    // 返回按钮
    const backButtonX = SCREEN_WIDTH / 2 - 100;
    const backButtonY = this.statusBarHeight + 660;
    const backButtonWidth = 200;
    const backButtonHeight = 50;
    
    // 按钮渐变
    const buttonGradient = ctx.createLinearGradient(backButtonX, backButtonY, 
                                                    backButtonX, backButtonY + backButtonHeight);
    buttonGradient.addColorStop(0, this.theme.primary);
    buttonGradient.addColorStop(1, '#3A6FEF');
    
    ctx.fillStyle = buttonGradient;
    this.drawRoundedRect(ctx, backButtonX, backButtonY, backButtonWidth, backButtonHeight, 25);
    ctx.fill();
    
    // 按钮阴影
    ctx.shadowColor = 'rgba(91, 139, 247, 0.25)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // 按钮文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('返回主菜单', backButtonX + backButtonWidth / 2, backButtonY + backButtonHeight / 2);
  }
  
  // 改进的文本换行函数 - 修复文字遮挡问题
  renderWrappedTextFixed(ctx, text, x, y, maxWidth, lineHeight) {
    const characters = text.split('');
    let line = '';
    let lineCount = 0;
    const maxLines = 6;
    let currentY = y;
    
    for (let i = 0; i < characters.length; i++) {
      const testLine = line + characters[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      // 如果宽度超过最大宽度或者遇到换行符
      if (testWidth > maxWidth || characters[i] === '\n') {
        if (lineCount < maxLines - 1) {
          // 绘制当前行
          ctx.fillText(line, x, currentY);
          line = characters[i] === '\n' ? '' : characters[i];
          currentY += lineHeight;
          lineCount++;
        } else {
          // 最后一行，添加省略号
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
    
    // 绘制最后一行
    if (line) {
      ctx.fillText(line, x, currentY);
    }
    
    return currentY;
  }
  
  // 原来的文本换行函数（备用）
  renderWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let lineCount = 0;
    const maxLines = 4;
    let currentY = y;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        if (lineCount < maxLines - 1) {
          ctx.fillText(line, x, currentY);
          line = words[i];
          currentY += lineHeight;
          lineCount++;
        } else {
          // 最后一行添加省略号
          line = line.substring(0, line.length - 3) + '...';
          ctx.fillText(line, x, currentY);
          return currentY;
        }
      } else {
        line = testLine;
      }
    }
    
    ctx.fillText(line, x, currentY);
    return currentY;
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
  
  destroy() {
    this.deactivate();
  }
  
  activate() {
    this.bindTouchEvents();
  }
  
  deactivate() {
    const canvas = document.getElementById('gameCanvas');
    
    if (!canvas) {
      console.error('[MoodAssessment] Canvas not found for deactivation');
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
    
    console.log('[MoodAssessment] Event listeners removed');
  }
}