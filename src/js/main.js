import './render';
import ChatInterface from './runtime/chat';
import MainMenu from './runtime/main-menu';
import BreathingExercise from './runtime/breathing-exercise';
import MentalTips from './runtime/mental-tips';
import DiaryBook from './runtime/diary-book';
import MoodAssessment from './runtime/mood-assessment';

const ctx = canvas.getContext('2d');

export default class Main {
  aniId = 0;
  currentScreen = 'menu';
  previousScreen = null;
  mainMenu = null;
  chat = null;
  breathing = null;
  tips = null;
  diary = null;

  constructor() {
    this.initScreens();
    this.start();
  }

  initScreens() {
    this.mainMenu = new MainMenu();
    this.chat = new ChatInterface();
    this.breathing = new BreathingExercise();
    this.tips = new MentalTips();
    this.diary = new DiaryBook();
    this.moodAssessment = new MoodAssessment();
    
    this.mainMenu.on('buttonClick', (buttonId) => {
      this.handleMenuButtonClick(buttonId);
    });
    
    this.mainMenu.on('startAssessment', () => {
      this.switchToScreen('mood-assessment');
    });
    
    this.chat.on('backToMenu', () => {
      this.switchToScreen('menu');
    });
    
    this.breathing.on('backToMenu', () => {
      this.switchToScreen('menu');
    });
    
    this.tips.on('backToMenu', () => {
      this.switchToScreen('menu');
    });
    
    this.diary.on('backToMenu', () => {
      this.switchToScreen('menu');
    });
    
    this.moodAssessment.on('backToMenu', () => {
      this.switchToScreen('menu');
    });
    
    this.mainMenu.activate();
  }

  handleMenuButtonClick(buttonId) {
    if (buttonId === 'chat') {
      this.switchToScreen('chat');
    } else if (buttonId === 'breathing') {
      this.switchToScreen('breathing');
    } else if (buttonId === 'tips') {
      this.switchToScreen('tips');
    } else if (buttonId === 'diary') {
      this.switchToScreen('diary');
    } else if (buttonId === 'settings') {
      console.log('Settings clicked');
    }
  }

  switchToScreen(screenName) {
    this.previousScreen = this.currentScreen;
    this.currentScreen = screenName;
    
    if (wx && wx.hideKeyboard) {
      wx.hideKeyboard();
    }
    
    if (this.previousScreen) {
      switch (this.previousScreen) {
      case 'menu':
        if (this.mainMenu && this.mainMenu.deactivate) {
          this.mainMenu.deactivate();
        }
        break;
      case 'breathing':
        if (this.breathing && this.breathing.deactivate) {
          this.breathing.deactivate();
        }
        break;
      case 'tips':
        if (this.tips && this.tips.deactivate) {
          this.tips.deactivate();
        }
        break;
      case 'diary':
        if (this.diary && this.diary.deactivate) {
          this.diary.deactivate();
        }
        break;
      case 'mood-assessment':
        if (this.moodAssessment && this.moodAssessment.deactivate) {
          this.moodAssessment.deactivate();
        }
        break;
    }
    }
    
    switch (screenName) {
      case 'menu':
        if (this.mainMenu && this.mainMenu.activate) {
          this.mainMenu.activate();
        }
        break;
      case 'breathing':
        if (this.breathing && this.breathing.activate) {
          this.breathing.activate();
        }
        break;
      case 'tips':
        if (this.tips && this.tips.activate) {
          this.tips.activate();
        }
        break;
      case 'diary':
        if (this.diary && this.diary.activate) {
          this.diary.activate();
        }
        break;
      case 'mood-assessment':
        if (this.moodAssessment && this.moodAssessment.activate) {
          this.moodAssessment.activate();
        }
        break;
    }
  }

  start() {
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (this.currentScreen === 'menu') {
      this.mainMenu.render(ctx);
    } else if (this.currentScreen === 'chat') {
      this.chat.render(ctx);
    } else if (this.currentScreen === 'breathing') {
      this.breathing.render(ctx);
    } else if (this.currentScreen === 'tips') {
      this.tips.render(ctx);
    } else if (this.currentScreen === 'diary') {
      this.diary.render(ctx);
    } else if (this.currentScreen === 'mood-assessment') {
      this.moodAssessment.render(ctx);
    }
  }

  loop() {
    this.render();
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
