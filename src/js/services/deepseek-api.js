/**
 * DeepSeek API 服务
 */
class DeepSeekApiService {
  constructor() {
    this.config = {
      apiKey: 'sk-175c2d75f2c94cafa33c479891111571',
      apiUrl: 'https://api.deepseek.com/v1/chat/completions',
      model: 'deepseek-chat',
      maxTokens: 1000,
      temperature: 0.7
    };
  }

  /**
   * 设置API Key
   */
  setApiKey(apiKey) {
    this.config.apiKey = apiKey;
  }

  /**
   * 发送请求到DeepSeek API
   */
  async sendRequest(messages) {
    if (!this.config.apiKey) {
      return { error: 'API Key未设置' };
    }

    try {
      const requestData = {
        model: this.config.model,
        messages: messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      };

      const response = await this.fetchApi(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[DeepSeek] API请求错误:', error);
      return { error: error.message };
    }
  }

  /**
   * 封装fetch API
   */
  async fetchApi(url, options) {
    // 在微信小游戏环境中，使用wx.request
    if (typeof wx !== 'undefined' && wx.request) {
      return new Promise((resolve, reject) => {
        wx.request({
          url: url,
          method: options.method || 'GET',
          header: options.headers || {},
          data: options.body ? JSON.parse(options.body) : {},
          success: (res) => {
            // 模拟fetch API的Response对象
            const mockResponse = {
              ok: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              json: () => Promise.resolve(res.data)
            };
            resolve(mockResponse);
          },
          fail: (err) => {
            reject(err);
          }
        });
      });
    } else if (typeof fetch !== 'undefined') {
      // 在浏览器环境中，使用fetch API
      return fetch(url, options);
    } else {
      throw new Error('不支持的环境：没有可用的网络请求方法');
    }
  }
}

export default new DeepSeekApiService();