import Main from './js/main';

// 添加全局点击测试
const canvas = document.getElementById('gameCanvas');

if (canvas) {
  canvas.addEventListener('click', (e) => {
    console.log('Canvas clicked!', {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: e.offsetX,
      offsetY: e.offsetY
    });
  });
  
  canvas.addEventListener('mousedown', (e) => {
    console.log('Canvas mousedown!', {
      clientX: e.clientX,
      clientY: e.clientY
    });
  });
  
  console.log('Global canvas event listeners added');
} else {
  console.error('Canvas not found for global listeners');
}

new Main();
