import './render'; // 初始化Canvas
import ChatInterface from './runtime/chat'; // 导入聊天界面类

const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文

/**
 * 聊天应用主函数
 */
export default class Main {
  aniId = 0; // 用于存储动画帧的ID
  chat = new ChatInterface(); // 创建聊天界面

  constructor() {
    // 开始渲染循环
    this.start();
  }

  /**
   * 开始渲染循环
   */
  start() {
    cancelAnimationFrame(this.aniId); // 清除上一局的动画
    this.aniId = requestAnimationFrame(this.loop.bind(this)); // 开始新的动画循环
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制聊天界面
   */
  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清空画布
    this.chat.render(ctx); // 绘制聊天界面
  }

  // 实现渲染循环
  loop() {
    this.render(); // 渲染聊天界面

    // 请求下一帧动画
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
