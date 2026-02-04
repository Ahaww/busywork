export default class Emitter {
  constructor() {
    this.e = {};
  }

  on(event, fn, ctx) {
    (this.e[event] || (this.e[event] = [])).push({ fn, ctx });
    return this;
  }

  once(event, fn, ctx) {
    const self = this;
    function listener() {
      self.off(event, listener);
      fn.apply(ctx, arguments);
    }
    listener._ = fn;
    return this.on(event, listener, ctx);
  }

  emit(event, ...args) {
    const evts = (this.e[event] || []).slice();
    for (let i = 0; i < evts.length; i++) {
      evts[i].fn.apply(evts[i].ctx, args);
    }
    return this;
  }

  off(event, fn) {
    const evts = this.e[event] || [];
    const live = [];
    for (let i = 0; i < evts.length; i++) {
      if (evts[i].fn !== fn && evts[i].fn._ !== fn) {
        live.push(evts[i]);
      }
    }
    if (live.length) {
      this.e[event] = live;
    } else {
      delete this.e[event];
    }
    return this;
  }
}
