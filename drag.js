(function(define){'use strict';define(function(require,exports,module){

/**
 * Exports
 */

module.exports = Drag;

/**
 * Pointer event abstraction to make
 * it work for touch and mouse.
 *
 * @type {Object}
 */
var pointer = [
  { down: 'touchstart', up: 'touchend', move: 'touchmove' },
  { down: 'mousedown', up: 'mouseup', move: 'mousemove' }
]['ontouchstart' in window ? 0 : 1];

/**
 * Simple logger
 *
 * @type {Function}
 */
var debug = 0 ? console.log.bind(console) : function() {};

/**
 * Drag creates a draggable 'handle' element,
 * constrained within a 'container' element.
 *
 * Drag instances dispatch useful events and provides
 * methods to support common draggable UI use-cases,
 * like `snapToClosestEdge`
 *
 * In Gaia we use `Drag` for our switch components.
 *
 * @param {Object} options
 */
function Drag(config) {
  debug('init', config);
  this.config(config);
  this.dragging = false;
  this.setupEvents();
}

Drag.prototype.config = function(config) {
  this.slideDuration = config.slideDuration || 140;
  this.container = config.container;
  this.handle = config.handle;
  this.max = {
    x: this.container.width - this.handle.width,
    y: this.container.height - this.handle.height
  };
};

Drag.prototype.setupEvents = function() {
  debug('setup events', pointer);
  this.onPointerStart = this.onPointerStart.bind(this);
  this.onPointerMove = this.onPointerMove.bind(this);
  this.onPointerEnd = this.onPointerEnd.bind(this);
  this.handle.el.addEventListener(pointer.down, this.onPointerStart);
};

Drag.prototype.onPointerStart = function(e) {
  debug('pointer start', e);
  this.point = getPoint(e);
  addEventListener(pointer.move, this.onPointerMove);
  addEventListener(pointer.up, this.onPointerEnd);
  clearTimeout(this.timeout);
  this.timeout = setTimeout(() => this.dragging = true);
};

Drag.prototype.onPointerEnd = function(e) {
  debug('pointer end', e);
  clearTimeout(this.timeout);
  this.timeout = setTimeout(() => this.dragging = false);
  removeEventListener(pointer.move, this.onPointerMove);
  removeEventListener(pointer.up, this.onPointerEnd);
  this.dispatch('ended', e);
};

Drag.prototype.onPointerMove = function(e) {
  debug('pointer move', e);
  e.preventDefault();
  var previous = this.point;
  this.point = getPoint(e);
  this.setDuration(0);
  this.translateBy(
    this.point.pageX - previous.pageX,
    this.point.pageY - previous.pageY
  );
};

Drag.prototype.translateBy = function(deltaX, deltaY) {
  debug('translate by', deltaX, deltaY);
  this.translate(
    this.handle.x + deltaX,
    this.handle.y + deltaY
  );
};

Drag.prototype.translate = function(x, y) {
  debug('translate', x, y);
  var position = this.clamp(this.normalize(x, y));
  var translate = 'translate(' + position.x + 'px,' + position.y + 'px)';
  var ratio = {
    x: (position.x / this.max.x) || 0,
    y: (position.y / this.max.y) || 0
  };

  // Set the transform to move the handle
  this.handle.el.style.transform = translate;

  // Update the handle position reference
  this.handle.x = position.x;
  this.handle.y = position.y;

  // dispatch event with useful data
  this.dispatch('translate', this.handle);
};

Drag.prototype.normalize = function(x, y) {
  return {
    x: typeof x == 'string' ? (Number(x) * this.max.x) : x,
    y: typeof y == 'string' ? (Number(y) * this.max.y) : y
  }
};

Drag.prototype.snap = function() {
  debug('snap');
  var edges = this.getClosestEdges();
  this.transitionTo(edges.x, edges.y)
  this.dispatch('snapped', edges);
};

Drag.prototype.transitionTo = function(x, y) {
  var pos = this.clamp(this.normalize(x, y));
  var duration = this.getDuration(this.handle, pos);
  this.setDuration(duration);
  this.translate(pos.x, pos.y);
};

Drag.prototype.clamp = function(pos) {
  return {
    x: Math.max(0, Math.min(this.max.x, pos.x)),
    y: Math.max(0, Math.min(this.max.y, pos.y)),
  };
};

Drag.prototype.getDuration = function(from, to) {
  var distanceX = Math.abs(from.x - to.x);
  var distanceY = Math.abs(from.y - to.y);
  var distance = Math.max(distanceX, distanceY);
  var axis = distanceY > distanceX ? 'y' : 'x';
  var ratio = distance / this.max[axis];
  return this.slideDuration * ratio;
};

Drag.prototype.setDuration = function(ms) {
  this.handle.el.style.transitionDuration = ms + 'ms';
}

Drag.prototype.getClosestEdges = function() {
  return {
    x: this.handle.x <= (this.max.x / 2) ?  '0' : '1',
    y: this.handle.y <= (this.max.y / 2) ?  '0' : '1'
  };
};

Drag.prototype.on = function(name, fn) {
  this.container.el.addEventListener('drag' + name, fn);
}

Drag.prototype.off = function(name, fn) {
  this.container.el.removeEventListener('drag' + name, fn);
}

Drag.prototype.dispatch = function(name, detail) {
  var e = new CustomEvent('drag' + name, { bubble: false, detail: detail })
  this.container.el.dispatchEvent(e);
  debug('dispatched', e);
};

/**
 * Utils
 */

function getPoint(e) {
  return ~e.type.indexOf('mouse') ? e : e.touches[0];
}

});})((function(n,w){'use strict';return typeof define=='function'&&define.amd?
define:typeof module=='object'?function(c){c(require,exports,module);}:
function(c){var m={exports:{}},r=function(n){return w[n];};
w[n]=c(r,m.exports,m)||m.exports;};})('drag',this));