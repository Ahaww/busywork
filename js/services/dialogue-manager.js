/**
 * 对话管理器
 */
class DialogueManager {
  constructor() {
    this.history = [];
    this.historyLimit = 10;
    this.historyTruncationEnabled = true;
    this.personality = '';
    this.personalityFile = 'personality.txt';
  }

  /**
   * 初始化对话历史
   */
  initializeHistory() {
    // 清空历史
    this.history = [];
    
    // 添加系统提示（性格描述）
    if (this.personality) {
      this.history.push({
        role: 'system',
        content: this.personality
      });
    }
  }

  /**
   * 加载性格描述
   */
  async loadPersonality() {
    try {
      let personalityContent = '';
      
      // 尝试从不同来源读取personality.txt文件
      if (typeof wx !== 'undefined' && wx.getFileSystemManager) {
        // WeChat Mini-Game环境
        const fs = wx.getFileSystemManager();
        
        // 尝试从项目路径读取
        const projectFilePath = `js/services/${this.personalityFile}`;
        
        try {
          personalityContent = fs.readFileSync(projectFilePath, 'utf8');
        } catch (err) {
          // 尝试从用户数据目录读取
          const userDataPath = `${wx.env.USER_DATA_PATH}/${this.personalityFile}`;
          try {
            personalityContent = fs.readFileSync(userDataPath, 'utf8');
          } catch (err) {
            // 直接使用personality.txt文件的内容
            personalityContent = this.getPersonalityFileContent();
          }
        }
      } else if (typeof fetch !== 'undefined') {
        // 浏览器环境
        try {
          const response = await fetch('../services/personality.txt');
          if (response.ok) {
            personalityContent = await response.text();
          } else {
            personalityContent = this.getPersonalityFileContent();
          }
        } catch (err) {
          personalityContent = this.getPersonalityFileContent();
        }
      } else {
        // 其他环境
        personalityContent = this.getPersonalityFileContent();
      }
      
      // 分析文件内容，提取关键属性
      this.personality = this.analyzePersonalityContent(personalityContent);
    } catch (err) {
      console.error('[DeepSeek] 加载性格描述失败:', err);
      this.personality = '';
    }
  }

  /**
   * 获取personality.txt文件的内容
   * @returns {string} personality.txt文件内容
   */
  getPersonalityFileContent() {
    return `# 语言适配规则
你是一个能够自动适配用户语言的AI助手，必须严格遵循以下语言使用规则：

## 核心规则
- **语言匹配**：用户使用哪种语言提问，你就使用哪种语言回答
- **混杂语言处理**：当用户输入包含多种语言时，选择其中使用最多的语言进行回复
- **语言识别**：基于输入文本中各语言的字符数量、单词数量或句子数量判断主要语言

## 优先级设置
1. **主要语言优先**：优先使用用户输入中占比最高的语言
2. **上下文一致性**：如果用户之前使用某一语言，后续回复尽量保持该语言（除非用户明确切换）
3. **明确指令优先**：如果用户明确要求使用特定语言，必须遵循该要求

## 示例场景
- **示例1**：用户输入"你好，how are you?" → 识别为中文占比更高 → 用中文回复
- **示例2**：用户输入"Hello, 今天天气怎么样？" → 识别为中文占比更高 → 用中文回复
- **示例3**：用户输入"How's the weather today?" → 识别为英文 → 用英文回复
- **示例4**：用户输入"请用英语回答我：今天天气如何？" → 遵循明确指令 → 用英文回复

## 执行要求
- 无论用户的问题内容是什么，都必须严格遵循上述语言适配规则
- 回复时确保语言流畅自然，符合该语言的表达习惯
- 不要在回复中提及语言判断的过程，直接使用判断后的语言回复

## 交流风格要求
- **语气轻松**：使用轻松、友好的语气进行交流，避免过于正式或生硬的表达
- **朋友般对话**：像朋友之间聊天一样回复用户，使用口语化的表达
- **简洁明了**：回复可以尽量简短，直击要点，避免冗长的解释
- **情感表达**：适当使用表情符号或语气词，增强对话的亲切感
- **个性化**：根据不同的话题，调整回复的风格，保持自然和真实`;
  }

  /**
   * 分析性格描述内容
   * @param {string} content - 性格描述文件内容
   * @returns {string} 处理后的性格描述
   */
  analyzePersonalityContent(content) {
    // 检查内容是否为空
    if (!content || content.trim() === '') {
      return '';
    }
    
    // 返回完整的处理后的内容
    return content;
  }

  /**
   * 添加消息到对话历史
   */
  addMessage(role, content) {
    this.history.push({ role, content });
    this.manageHistoryLength();
  }

  /**
   * 管理对话历史长度
   */
  manageHistoryLength() {
    if (!this.historyTruncationEnabled) {
      return;
    }

    const systemMessages = this.history.filter(msg => msg.role === 'system');
    const conversationMessages = this.history.filter(msg => msg.role !== 'system');

    if (conversationMessages.length > this.historyLimit) {
      const trimmedConversation = conversationMessages.slice(-this.historyLimit);
      this.history = [...systemMessages, ...trimmedConversation];
    }
  }

  /**
   * 获取对话历史
   */
  getHistory() {
    return this.history;
  }

  /**
   * 设置历史限制
   */
  setHistoryLimit(limit) {
    this.historyLimit = Math.max(1, limit);
  }

  /**
   * 启用/禁用历史截断
   */
  setHistoryTruncation(enabled) {
    this.historyTruncationEnabled = enabled;
  }
}

export default new DialogueManager();