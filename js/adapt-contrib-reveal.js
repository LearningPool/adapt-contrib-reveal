/*
* adapt-contrib-reveal
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>
*/
define([
  'core/js/adapt',
  'core/js/views/componentView',
  'libraries/jquery.dotdotdot'
], function (Adapt, ComponentView, dotdotdot) {
  'use strict';

  class Reveal extends ComponentView {
    events() {
      return Adapt.device.touch == true ? {
        'click .reveal__widget-control': 'clickReveal',
        'inview': 'inview',
        'click .reveal__popup-open': 'openPopup'
      } : {
          'click .reveal__widget-control': 'clickReveal',
          'inview': 'inview',
          'click .reveal__popup-open': 'openPopup'
        }
    }

    get orientationStates() {
      return {
        Vertical: 'vertical',
        Horizontal: 'horizontal'
      }
    }

    preRender() {
      var orientation;
      this.listenTo(Adapt, 'device:resize', this.resizeControl, this);

      switch (this.model.get('_direction')) {
        case 'left':
        case 'right':
          orientation = this.orientationStates.Horizontal;
          break;
        case 'top':
        case 'bottom':
          orientation = this.orientationStates.Vertical;
      }

      this.model.set('_orientation', orientation);

      var defaultTextDirection = Adapt.config.get('_defaultDirection');
      defaultTextDirection = (defaultTextDirection === 'rtl') ? 'right' : 'left';
      this.model.set('_defaultTextDirection', defaultTextDirection);

      this.checkIfResetOnRevisit();
    }

    checkIfResetOnRevisit() {
      var isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    }

    setupReveal() {
      var direction = !this.model.get('_direction') ? "left" : this.model.get('_direction');
      var iconDirection = this.getIconDirection(direction);

      // Initialise the directional arrows
      this.$('.reveal__widget-item').addClass('reveal__' + this.model.get('_direction'));
      this.$('.reveal__widget-control').addClass('reveal__' + direction);
      this.$('.reveal__image').addClass('reveal__' + direction);
      this.$('div.reveal__widget-item-text').addClass('reveal__' + direction);

      this.$('div.reveal__widget-item-text-body').addClass('reveal__' + direction);
      this.$('.reveal__widget-icon').addClass('icon-controls-' + this.getOppositeDirection(iconDirection));

      // Change accessibility tab index on page load.
      this.$('.first .reveal__widget-item-text-body .reveal__popup-open').attr('tabindex', '0');
      this.$('.second .reveal__widget-item-text-body .accessible-text-block').attr('tabindex', '-1');
      this.$('.second .reveal__widget-item-text-body .reveal__popup-open').attr('tabindex', '-1');

      this.model.set('_direction', direction);
      this.model.set('_active', true);
      this.model.set('_revealed', false);

      this.setControlText(false);

      // Reverse reveal item order for the reveal bottom component.
      if (direction == "bottom") {
        this.$('.first-item').insertBefore(this.$('.second-item'));
      }

      if (this.model.get('_orientation') === this.orientationStates.Horizontal) {
        this.calculateWidths();
      } else {
        this.calculateHeights();
      }

      this.$('.dot-ellipsis').each(function () {
        // Checking if update on window resize required.
        var watchWindow = $(this).hasClass('dot-resize-update');

        // Checking if update on timer required.
        var watchTimer = $(this).hasClass('dot-timer-update');

        // Checking if height set.
        var height = 0;
        var classList = $(this).attr('class').split(/\s+/);
        $.each(classList, function (index, item) {
          var matchResult = item.match(/^dot-height-(\d+)$/);
          if (matchResult !== null)
            height = Number(matchResult[1]);
        });

        // Invoking jQuery.dotdotdot.
        var x = {};
        if (watchTimer)
          x.watch = true;
        if (watchWindow)
          x.watch = 'window';
        if (height > 0)
          x.height = height;

        // Selector for the 'More' button.
        x.after = 'a.reveal__popup-open';

        $(this).dotdotdot(x);
      });
    }

    setControlText(isRevealed) {
      if (this.model.get('_control')) {
        if (!isRevealed && this.model.get('control').showText) {
          this.$('.reveal__widget-control').attr('title', this.model.get('control').showText);
        }

        if (isRevealed && this.model.get('control').hideText) {
          this.$('.reveal__widget-control').attr('title', this.model.get('control').hideText);
        }
      }
    }

    calculateWidths() {
      var direction = this.model.get('_direction');
      var $widget = this.$('.reveal__widget');
      var $slider = this.$('.reveal__widget-slider');
      var $control = this.$('.reveal__widget-control');

      var imageWidth = $widget.width();
      var controlWidth = $control.width();
      var margin = -imageWidth;

      $slider.css('width', imageWidth * 2);

      if (this.model.get('_revealed')) {
        $control.css(this.model.get('_direction'), imageWidth - controlWidth);
      }

      $slider.css('margin-' + direction, margin);

      // Ensure the text doesn't overflow the image
      this.$('div.reveal__widget-item-text').css('width', ($('img.reveal__image').width()));

      this.model.set('_scrollSize', imageWidth);
      this.model.set('_controlWidth', controlWidth);
    }

    calculateHeights() {
      var direction = this.model.get('_direction');

      // Cache the JQuery objects
      var $widget = this.$('.reveal__widget');
      var $image = this.$('.reveal__widget img');
      var $slider = this.$('.reveal__widget-slider');
      var $control = this.$('.reveal__widget-control');
      var imageHeight = $image.height();
      var controlHeight = $control.height();
      var margin = direction == "top" ? -imageHeight : imageHeight;

      $widget.css('height', imageHeight);
      $slider.css('height', imageHeight);

      if (this.model.get('_revealed')) {
        $control.css(this.model.get('_direction'), imageHeight - controlHeight);
      }

      if (direction == 'bottom') {
        $slider.css('margin-top', 0);
      } else {
        $slider.css('margin-' + direction, margin);
      }

      // Ensure the text doesn't overflow the image
      this.$('div.reveal__widget-item-text').css("height", imageHeight);

      this.model.set('_scrollSize', imageHeight);
      this.model.set('_controlWidth', controlHeight);
    }

    getMarginType() {
      return this.model.get('_orientation') == this.orientationStates.Horizontal ? 'left' : 'top';
    }

    resizeControl() {
      var direction = this.model.get('_direction');
      var marginType = this.getMarginType();
      var $widget = this.$('.reveal__widget');
      var $slider = this.$('.reveal__widget-slider');
      var $widgetText = this.$('.reveal__widget-item-text');
      var imageSize;
      var controlSize;

      if (this.model.get('_orientation') == this.orientationStates.Horizontal) {
        var innerSize = this.$('.reveal__inner').width();

        imageSize = innerSize != $widget.width() ? innerSize : $widget.width();
        controlSize = this.$('.reveal__widget-control').width();
        $widget.css('width', imageSize);
        $widgetText.css('width', imageSize);
        $slider.css('width', imageSize * 2);
      } else {
        imageSize = this.$('.reveal__widget img').height();
        controlSize = this.$('.reveal__widget-control').height();
        $widget.css('height', imageSize);
        $widgetText.css('height', imageSize);
        $slider.css('height', imageSize);
      }

      if (direction == 'bottom') {
        $slider.css('margin-top', -imageSize);
      } else {
        $slider.css('margin-' + direction, -imageSize);
      }

      var sliderAnimation = {};

      if (this.model.get('_revealed')) {
        $slider.css('margin-' + marginType, (direction == marginType) ? -imageSize : 0);
        sliderAnimation['margin-' + marginType] = (direction == marginType) ? 0 : -imageSize
        $slider.animate(sliderAnimation);
      } else {
        $slider.css('margin-' + marginType, (direction == marginType) ? -imageSize : 0);
      }

      this.model.set('_scrollSize', imageSize);
      this.model.set('_controlWidth', controlSize);
    }

    postRender() {
      this.$('.reveal__widget').imageready(_.bind(function () {
        // IE hack - IE10/11 doesnt play nice with image sizes but it works on IE 9 which is nice. Because the universe doesnt make sense.
        if ($('html').hasClass('ie')) {

          var self = this;

          _.delay(function () {
            self.setupReveal();
            self.setReadyStatus();
          }, 400);

        } else {
          this.setupReveal();
          this.setReadyStatus();
        }
      }, this));
    }

    getOppositeDirection(direction) {
      var o = {
        'left': 'right',
        'right': 'left',
        'up': 'down',
        'down': 'up'
      };

      return o[direction];
    }

    getIconDirection(direction) {
      if (this.model.get('_orientation') == this.orientationStates.Vertical) {
        return (direction == 'top') ? 'up' : 'down';
      } else {
        return direction;
      }
    }

    clickReveal(event) {
      event.preventDefault();

      var direction = this.model.get('_direction');
      var marginType = this.getMarginType();
      var scrollSize = this.model.get('_scrollSize');
      var controlWidth = this.model.get('_controlWidth');
      var controlMovement = (!this.model.get('_revealed')) ? scrollSize - controlWidth : scrollSize;
      var operator = !this.model.get('_revealed') ? '+=' : '-=';
      var iconDirection = this.getIconDirection(direction);
      var defaultTextDirection = this.model.get('_defaultTextDirection');
      var controlAnimation = {};
      var sliderAnimation = {};
      var classToAdd;
      var classToRemove;

      // Clear all disabled accessibility settings 
      this.$('.reveal__widget-item-text-body').removeClass('a11y-ignore').removeAttr('aria-hidden').removeAttr('tab-index');

      if (defaultTextDirection === 'right' && (direction == 'left' || direction == 'right')) {
        marginType = this.getOppositeDirection(marginType);
      }

      // Define the animations and new icon styles
      if (!this.model.get('_revealed')) {
        // reveal second
        this.model.set('_revealed', true);
        this.$('.reveal__widget').addClass('reveal__showing');

        // Modify accessibility tab index and classes to prevent hidden elements from being read before visible elements.
        this.$('.first .reveal__widget-item-text-body').addClass('a11y-ignore').attr('aria-hidden', 'true').attr('tabindex', '-1');
        this.$('.second .reveal__widget-item-text-body .accessible-text-block').attr('tabindex', '0');
        this.$('.second .reveal__widget-item-text-body .reveal__popup-open').attr('tabindex', '0');
        this.$('.first .reveal__widget-item-text-body .accessible-text-block').attr('tabindex', '-1');
        this.$('.first .reveal__widget-item-text-body .reveal__popup-open').attr('tabindex', '-1');

        controlAnimation[direction] = operator + controlMovement;
        classToAdd = 'icon-controls-' + iconDirection;
        classToRemove = 'icon-controls-' + this.getOppositeDirection(iconDirection);

        sliderAnimation['margin-' + marginType] = (direction == marginType) ? 0 : -scrollSize;

        this.setCompletionStatus();
      } else {
        //show first
        this.model.set('_revealed', false);
        this.$('.reveal__widget').removeClass('reveal__showing');

        // Modify accessibility tab index to prevent hidden elements from being read before visible elements.
        this.$('.second .reveal__widget-item-text-body').addClass('a11y-ignore').attr('aria-hidden', 'true').attr('tabindex', '-1');
        this.$('.first .reveal__widget-item-text-body .accessible-text-block').attr('tabindex', '0');
        this.$('.first .reveal__widget-item-text-body .reveal__popup-open').attr('tabindex', '0');
        this.$('.second .reveal__widget-item-text-body .accessible-text-block').attr('tabindex', '-1');
        this.$('.second .reveal__widget-item-text-body .reveal__popup-open').attr('tabindex', '-1');

        controlAnimation[direction] = 0;
        classToAdd = 'icon-controls-' + this.getOppositeDirection(iconDirection);
        classToRemove = 'icon-controls-' + iconDirection;

        sliderAnimation['margin-' + marginType] = (direction == marginType) ? operator + controlMovement : 0;
      }
      // Change the UI to handle the new state
      this.$('.reveal__widget-slider').animate(sliderAnimation);
      this.$('.reveal__widget-icon').removeClass(classToRemove).addClass(classToAdd);

      this.setControlText(this.model.get('_revealed'));
    }

    openPopup(event) {
      event.preventDefault();

      this.model.set('_active', false);

      var bodyText = this.model.get('_revealed')
        ? this.model.get('second').body
        : this.model.get('first').body;

      var popupObject = {
        title: '',
        body: bodyText
      };

      Adapt.notify.popup(popupObject);
    }
  };

  return Adapt.register("reveal", Reveal);
});