
suite('Drag', function() {
  'use strict';

  var Drag = window['drag'];

  setup(function() {
    this.els = {
      container: fakeElement(),
      handle: fakeElement()
    };

    this.els.container.getBoundingClientRect.returns({
      width: 100,
      height: 50,
      top: 100,
      right: 200,
      bottom: 150,
      left: 100
    });

    this.els.handle.getBoundingClientRect.returns({
      width: 50,
      height: 50,
      top: 100,
      right: 200,
      bottom: 150,
      left: 100
    });

    this.drag = new Drag(this.els);
    this.drag.updateDimensions();
  });

  test('it listens for touch events', function() {
    sinon.assert.calledWith(this.els.container.addEventListener, 'touchstart');
  });

  suite('Drag#onTouchMove()', function() {
    setup(function() {
      var event = { type: 'touchstart', touches: [{ clientX: 100, clientY: 100 }] };
      this.drag.onTouchStart(event);
      sinon.stub(this.drag, 'move');
    });

    test('It moves the handle', function() {
      var event = { type: 'touchmove', touches: [{ clientX: 110, clientY: 110 }] };
      this.drag.onTouchMove(event);
      sinon.assert.calledWith(this.drag.move, { x: 10, y: 10 });

      event = { type: 'touchmove', touches: [{ clientX: 100, clientY: 100 }] };
      this.drag.onTouchMove(event);
      sinon.assert.calledWith(this.drag.move, { x: -10, y: -10 });
    });
  });

  suite('Drag#onTouchEnd()', function() {
    setup(function() {
      sinon.spy(this.drag, 'emit');

      var event = {
        type: 'touchstart',
        touches: [{ clientX: 100, clientY: 100 }],
        timeStamp: Date.now()
      };

      this.drag.onTouchStart(event);
    });

    test('It emits a `tapped` event if for quick `touchstart` => `touchend`', function() {
      var quickTap = this.drag.tapTime - 50;
      var event = { timeStamp: Date.now() + quickTap };
      this.drag.onTouchEnd(event);
      sinon.assert.calledWith(this.drag.emit, 'tapped');
      this.drag.emit.reset();

      var longTouch = this.drag.tapTime + 50;
      event = { timeStamp: Date.now() + longTouch };
      this.drag.onTouchEnd(event);
      assert.isFalse(this.drag.emit.calledWith('tapped'));
    });

    test('It emits a `ended` event for longer drags above the `tapTime`', function() {
      var longTouch = this.drag.tapTime + 50;
      var event = { timeStamp: Date.now() + longTouch };
      this.drag.onTouchEnd(event);
      sinon.assert.calledWith(this.drag.emit, 'ended');
    });
  });

  suite('Drag#set()', function() {
    setup(function() {
      sinon.stub(this.drag, 'translate');
    });

    test('It accepts edge keys', function() {
      this.drag.set({ x: 'right', y: 'bottom' });
      sinon.assert.calledWith(this.drag.translate, { x: 50, y: 0 });
    });

    test('It accepts pixel coordinates', function() {
      this.drag.set({ x: 200, y: 100 });
      sinon.assert.calledWith(this.drag.translate, { x: 200, y: 100 });
    });
  });

  suite('Drag#translate()', function() {
    setup(function() {
      this.drag.handle.position = { x: 0, y: 0 };
    });

    test('It translates the handle to the given position', function() {
      this.drag.translate({ x: 30, y: 0 });
      assert.equal(this.drag.handle.el.style.transform, 'translate(30px,0px)');
    });

    test('It clamps the coordinates to prevent the handle overflowing the container', function() {
      this.drag.translate({ x: 100, y: 100 });
      assert.equal(this.drag.handle.el.style.transform, 'translate(50px,0px)');
    });

    test('It calculates a duration relative to the distance moved', function() {
      this.drag.translate({ x: 50, y: 0 });
      assert.equal(
        this.drag.handle.el.style.transitionDuration,
        this.drag.slideDuration + 'ms');

      this.drag.translate({ x: 25, y: 0 });
      assert.equal(
        this.drag.handle.el.style.transitionDuration,
        (this.drag.slideDuration / 2) + 'ms');
    });

    test('It emits a `translate` event with useful data', function() {
      sinon.spy(this.drag, 'emit');
      this.drag.translate({ x: 50, y: 0 });
      sinon.assert.calledWith(this.drag.emit, 'translate', {
        position: {
          px: { x: 50, y: 0 },
          ratio: { x: 1, y: 0 }
        }
      });
    });
  });

  suite('Drag#snapToClosestEdge()', function() {
    setup(function() {
      sinon.spy(this.drag, 'translate');
      sinon.spy(this.drag, 'emit');
    });

    test('It translates to the closest edge', function() {
      this.drag.translate({ x: 20, y: 0 });
      this.drag.translate.reset();
      this.drag.snapToClosestEdge();
      sinon.assert.calledWith(this.drag.translate, { x: 0, y: 0 });

      this.drag.translate({ x: 26, y: 0 });
      this.drag.translate.reset();
      this.drag.snapToClosestEdge();
      sinon.assert.calledWith(this.drag.translate, { x: 50, y: 0 });
    });

    test('It emits a `snapped` event with useful data', function() {
      this.drag.translate({ x: 20, y: 0 });
      this.drag.snapToClosestEdge();
      sinon.assert.calledWith(this.drag.emit, 'snapped', {
        x: 'left',
        y: 'top'
      });
    });
  });

  function fakeElement() {
    return  {
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
      style: {},
      getBoundingClientRect: sinon.stub()
    };
  }
});
