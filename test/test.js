
suite('Drag', function() {
  'use strict';

  var Drag = window['drag'];

  setup(function() {
    this.sinon = sinon.sandbox.create();
    this.dom = document.createElement('div');
    document.body.appendChild(this.dom);

    this.container = document.createElement('div');
    this.container.className = 'container';
    this.handle = document.createElement('div');
    this.handle.className = 'handle';

    this.container.appendChild(this.handle);
    this.dom.appendChild(this.container);

    this.config = {
      container: {
        el: this.container,
        width: 400,
        height: 100
      },
      handle: {
        el: this.handle,
        width: 100,
        height: 100,
        x: 0,
        y: 0
      }
    };

    this.drag = new Drag(this.config);
  });

  teardown(function() {
    this.sinon.restore();
    this.dom.remove();
  });

  suite('dragging', function() {
    test('it moves with the pointer', function() {
      var style = this.handle.style;
      var x = this.handle.offsetLeft + 10;
      var y = this.handle.offsetTop;

      touch(this.handle,'touchstart', x, y);
      touch(window,'touchmove', x, y);
      touch(window,'touchmove', x+=5, y);
      assert.equal(style.transform, 'translate(5px, 0px)');
      touch(window,'touchmove', x+=5, y);
      assert.equal(style.transform, 'translate(10px, 0px)');
      touch(window,'touchmove', x+=5, y);
      assert.equal(style.transform, 'translate(15px, 0px)');
      touch(window,'touchmove', x+=5, y);
      assert.equal(style.transform, 'translate(20px, 0px)');
      touch(window,'touchend', x, y);
    });

    test('it stays within the bounds of the container', function() {
      var style = this.handle.style;
      var x = this.handle.offsetLeft + 10;
      var y = this.handle.offsetTop;

      touch(this.handle,'touchstart', x, y);
      touch(window,'touchmove', x, y);
      touch(window,'touchmove', x+=5, y);
      assert.equal(style.transform, 'translate(5px, 0px)');
      touch(window,'touchmove', x+=5, y);
      assert.equal(style.transform, 'translate(10px, 0px)');
      touch(window,'touchmove', x+=400, y+=100);
      assert.equal(style.transform, 'translate(300px, 0px)');
      touch(window,'touchend', x, y);
    });
  });

  suite('events', function() {
    test('it fires an `ended` event when interaction ends', function(done) {
      var style = this.handle.style;
      var x = this.handle.offsetLeft + 10;
      var y = this.handle.offsetTop;

      this.container.addEventListener('dragended', () => done());

      touch(this.handle,'touchstart', x, y);
      touch(window,'touchmove', x+=10, y);
      touch(window,'touchmove', x+=10, y);
      touch(window,'touchend', x, y);
    });

    test('it fires a `translate` event whenever the handle changes position', function() {
      var style = this.handle.style;
      var x = this.handle.offsetLeft + 10;
      var y = this.handle.offsetTop;
      var spy = sinon.spy();

      this.container.addEventListener('dragtranslate', spy);

      touch(this.handle,'touchstart', x, y);
      touch(window,'touchmove', x+=10, y);
      touch(window,'touchmove', x+=10, y);
      touch(window,'touchend', x, y);

      sinon.assert.calledTwice(spy);
    });
  });

  suite('Drag#translate()', function() {
    test('it will move the handle to the given position', function() {
      this.drag.translate(10, 0);
      assert.equal(this.handle.style.transform, 'translate(10px, 0px)');
    });

    test('string arguments will be interpreted as ratios', function() {
      this.drag.translate('0.5', 0);
      assert.equal(this.handle.style.transform, 'translate(150px, 0px)');

      this.drag.translate('1.0', 0);
      assert.equal(this.handle.style.transform, 'translate(300px, 0px)');

      this.drag.translate('2.0', '1');
      assert.equal(this.handle.style.transform, 'translate(300px, 0px)');
    });
  });

  suite('Drag#snap()', function() {
    test('it will translate to nearest edge', function() {
      var style = this.handle.style;
      this.drag.translate('0.25', 0);
      assert.equal(style.transform, 'translate(75px, 0px)');

      this.drag.snap();
      assert.equal(style.transform, 'translate(0px, 0px)');
    });
  });

  suite('clicks', function() {
    test('its possible to decern the difference between a click and drag', function() {
      this.sinon.useFakeTimers();

      var x = this.handle.offsetLeft + 10;
      var y = this.handle.offsetTop;

      // Click scenario
      touch(this.handle,'touchstart', x, y);
      touch(window,'touchmove', x, y);
      touch(window,'touchend', x, y);

      assert.isFalse(this.drag.dragging, 'not flagged dragging');

      // Drag scenario
      touch(this.handle,'touchstart', x, y);
      touch(window,'touchmove', x+=5, y);
      this.sinon.clock.tick(5);
      touch(window,'touchmove', x+=5, y);
      this.sinon.clock.tick(5);
      touch(window,'touchmove', x+=5, y);
      this.sinon.clock.tick(5);
      touch(window,'touchend', x, y);

      assert.isTrue(this.drag.dragging);

      this.sinon.clock.tick(1);

      assert.isFalse(this.drag.dragging);
    });
  });

  /**
   * Utils
   */

  function touch(el, type, x, y) {
    var touch = document.createTouch(
      window,
      el,
      0,
      x || 0,
      y || 0);

    var touchList = document.createTouchList([touch]);
    var event = document.createEvent('TouchEvent');

    event.initTouchEvent(
      type, // type
      true, // bubbles
      true, // cancelable
      window, // view
      null, // detail
      false, // ctrlKey
      false, // altKey
      false, // shiftKey
      false, // metaKey
      touchList, // touches
      touchList, // targetTouches
      touchList); // changedTouches

    // Set the timestamp to be sure
    Object.defineProperty(event, 'timeStamp', { value: Date.now() });

    el.dispatchEvent(event);
  }
});
