/* eslint-disable import/no-amd */
/* eslint-disable no-undef */
/*
* adapt-contrib-reveal
* License - http://github.com/adaptlearning/adapt_framework/LICENSE
* Maintainers - Brian Quinn <brian@learningpool.com>
*/
define([
  'core/js/adapt',
  'core/js/views/componentView',
  'libraries/jquery.dotdotdot'
], (Adapt, ComponentView) => {

  class Reveal extends ComponentView {

    events() {
      return {
        'click .reveal__widget-control': 'clickReveal',
        inview: 'inview',
        'click .reveal__popup-open': 'openPopup'
      };
    }

    initialize() {
      this.orientationStates = {
        Vertical: 'vertical',
        Horizontal: 'horizontal'
      };

      this.opposites = {
        left: 'right',
        right: 'left',
        up: 'down',
        down: 'up'
      };

      super.initialize();
    }

    preRender() {
      let orientation;
      this.listenTo(Adapt, 'device:resize', this.resizeControl, this);

      switch (this.model.get('_direction')) {
        case 'left':
        case 'right':
          orientation = this.orientationStates.Horizontal;
          break;
        case 'top':
        case 'bottom':
        default:
          orientation = this.orientationStates.Vertical;
      }

      this.model.set('_orientation', orientation);

      let defaultTextDirection = Adapt.config.get('_defaultDirection');
      defaultTextDirection = (defaultTextDirection === 'rtl') ? 'right' : 'left';
      this.model.set('_defaultTextDirection', defaultTextDirection);

      this.checkIfResetOnRevisit();
    }

    checkIfResetOnRevisit() {
      const isResetOnRevisit = this.model.get('_isResetOnRevisit');

      // If reset is enabled set defaults
      if (isResetOnRevisit) {
        this.model.reset(isResetOnRevisit);
      }
    }

    setupReveal() {
      const direction = !this.model.get('_direction') ? 'left' : this.model.get('_direction');
      const iconDirection = this.getIconDirection(direction);

      // Initialise the directional arrows
      this.$('.reveal__widget-item').addClass(`reveal__${this.model.get('_direction')}`);
      this.$('.reveal__widget-control').addClass(`reveal__${direction}`);
      this.$('.reveal__image').addClass(`reveal__${direction}`);
      this.$('div.reveal__widget-item-text').addClass(`reveal__${direction}`);

      this.$('div.reveal__widget-item-text-body').addClass(`reveal__${direction}`);
      this.$('.reveal__widget-icon').addClass(`icon-controls-${this.getOppositeDirection(iconDirection)}`);

      this.model.set('_direction', direction);
      this.model.set('_active', true);
      this.model.set('_revealed', false);

      this.setControlText(false);

      // Reverse reveal item order for the reveal bottom component.
      if (direction === 'bottom') {
        this.$('.first-item').insertBefore(this.$('.second-item'));
      }

      if (this.model.get('_orientation') === this.orientationStates.Horizontal) {
        this.calculateWidths();
      } else {
        this.calculateHeights();
      }

      this.$('.dot-ellipsis').each((index, element) => {
        // Checking if update on window resize required.
        const watchWindow = $(element).hasClass('dot-resize-update');

        // Checking if update on timer required.
        const watchTimer = $(element).hasClass('dot-timer-update');

        // Checking if height set.
        let height = 0;
        const classList = $(element).attr('class').split(/\s+/);
        $.each(classList, (index, item) => {
          const matchResult = item.match(/^dot-height-(\d+)$/);
          if (matchResult !== null) height = Number(matchResult[1]);
        });

        // Invoking jQuery.dotdotdot.
        const x = {};
        if (watchTimer) x.watch = true;
        if (watchWindow) x.watch = 'window';
        if (height > 0) x.height = height;

        // Selector for the 'More' button.
        x.after = 'a.reveal__popup-open';

        $(element).dotdotdot(x);
      });
    }

    setControlText(isRevealed) {
      if (!this.model.get('_control')) return;
      if (!isRevealed && this.model.get('control').showText) {
        this.$('.reveal__widget-control').attr('title', this.model.get('control').showText);
      }

      if (isRevealed && this.model.get('control').hideText) {
        this.$('.reveal__widget-control').attr('title', this.model.get('control').hideText);
      }
    }

    calculateWidths() {
      const direction = this.model.get('_direction');
      const $widget = this.$('.reveal__widget');
      const $slider = this.$('.reveal__widget-slider');
      const $control = this.$('.reveal__widget-control');

      const imageWidth = $widget.width();
      const controlWidth = $control.width();
      const margin = -imageWidth;

      $slider.css('width', imageWidth * 2);

      if (this.model.get('_revealed')) {
        $control.css(this.model.get('_direction'), imageWidth - controlWidth);
      }

      $slider.css(`margin-${direction}`, margin);

      // Ensure the text doesn't overflow the image
      this.$('div.reveal__widget-item-text').css('width', ($('img.reveal__image').width()));

      this.model.set('_scrollSize', imageWidth);
      this.model.set('_controlWidth', controlWidth);
    }

    calculateHeights() {
      const direction = this.model.get('_direction');

      // Cache the JQuery objects
      const $widget = this.$('.reveal__widget');
      const $image = this.$('.reveal__widget img');
      const $slider = this.$('.reveal__widget-slider');
      const $control = this.$('.reveal__widget-control');
      const imageHeight = $image.height();
      const controlHeight = $control.height();
      const margin = direction === 'top' ? -imageHeight : imageHeight;

      $widget.css('height', imageHeight);
      $slider.css('height', imageHeight);

      if (this.model.get('_revealed')) {
        $control.css(this.model.get('_direction'), imageHeight - controlHeight);
      }

      if (direction === 'bottom') {
        $slider.css('margin-top', 0);
      } else {
        $slider.css(`margin-${direction}`, margin);
      }

      // Ensure the text doesn't overflow the image
      this.$('div.reveal__widget-item-text').css('height', imageHeight);

      this.model.set('_scrollSize', imageHeight);
      this.model.set('_controlWidth', controlHeight);
    }

    getMarginType() {
      return this.model.get('_orientation') === this.orientationStates.Horizontal ? 'left' : 'top';
    }

    resizeControl() {
      const direction = this.model.get('_direction');
      const marginType = this.getMarginType();
      const $widget = this.$('.reveal__widget');
      const $slider = this.$('.reveal__widget-slider');
      const $widgetText = this.$('.reveal__widget-item-text');
      let imageSize;
      let controlSize;

      if (this.model.get('_orientation') === this.orientationStates.Horizontal) {
        const innerSize = this.$('.reveal__inner').width();

        imageSize = innerSize !== $widget.width() ? innerSize : $widget.width();
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

      if (direction === 'bottom') {
        $slider.css('margin-top', -imageSize);
      } else {
        $slider.css(`margin-${direction}`, -imageSize);
      }

      const sliderAnimation = {};

      if (this.model.get('_revealed')) {
        $slider.css(`margin-${marginType}`, (direction === marginType) ? -imageSize : 0);
        sliderAnimation[`margin-${marginType}`] = (direction === marginType) ? 0 : -imageSize;
        $slider.animate(sliderAnimation);
      } else {
        $slider.css(`margin-${marginType}`, (direction === marginType) ? -imageSize : 0);
      }

      this.model.set('_scrollSize', imageSize);
      this.model.set('_controlWidth', controlSize);
    }

    postRender() {
      this.$('.reveal__widget').imageready(() => {
        // IE hack - IE11 doesnt play nice with image sizes
        if ($('html').hasClass('ie')) {
          _.delay(() => {
            this.setupReveal();
            this.setReadyStatus();
          }, 400);

        } else {
          this.setupReveal();
          this.setReadyStatus();
        }
      });
    }

    getOppositeDirection(direction) {
      return this.opposites[direction];
    }

    getIconDirection(direction) {
      if (this.model.get('_orientation') === this.orientationStates.Vertical) {
        return (direction === 'top') ? 'up' : 'down';
      }

      return direction;
    }

    clickReveal(event) {
      event.preventDefault();

      const direction = this.model.get('_direction');
      let marginType = this.getMarginType();
      const scrollSize = this.model.get('_scrollSize');
      const controlWidth = this.model.get('_controlWidth');
      const controlMovement = (!this.model.get('_revealed')) ? scrollSize - controlWidth : scrollSize;
      const operator = !this.model.get('_revealed') ? '+=' : '-=';
      const iconDirection = this.getIconDirection(direction);
      const defaultTextDirection = this.model.get('_defaultTextDirection');
      const controlAnimation = {};
      const sliderAnimation = {};

      if (defaultTextDirection === 'right' && (direction === 'left' || direction === 'right')) {
        marginType = this.getOppositeDirection(marginType);
      }

      const firstItem = this.$('.first-item.reveal__widget-item');
      const secondItem = this.$('.second-item.reveal__widget-item');
      const isItemRevealed = this.model.get('_revealed');

       /**
         * Modify accessibility tab index and classes
         * to prevent hidden elements from being read before visible elements.
         */
      Adapt.a11y.toggleAccessibleEnabled(firstItem, isItemRevealed);
      Adapt.a11y.toggleAccessibleEnabled(secondItem, !isItemRevealed);

      // show first or reveal second item
      this.$('.reveal__widget').toggleClass('reveal__showing', !isItemRevealed);

      // Define the animations and new icon styles
      if (!isItemRevealed) {
        controlAnimation[direction] = operator + controlMovement;
        sliderAnimation[`margin-${marginType}`] = (direction === marginType) ? 0 : -scrollSize;

        this.setCompletionStatus();
      } else {
        controlAnimation[direction] = 0;
        sliderAnimation[`margin-${marginType}`] = (direction === marginType) ? operator + controlMovement : 0;
      }

      // Change the UI to handle the new state
      const classIconHide = `icon-controls-${this.getOppositeDirection(iconDirection)}`;
      const classIconReveal = `icon-controls-${iconDirection}`;

      this.$('.reveal__widget-slider').animate(sliderAnimation);
      this.$('.reveal__widget-icon').toggleClass(classIconHide, isItemRevealed);
      this.$('.reveal__widget-icon').toggleClass(classIconReveal, !isItemRevealed);

      this.model.set('_revealed', !isItemRevealed);
      this.setControlText(!isItemRevealed);

      // focus on the image after the transition has ended
      this.$('.reveal__widget-slider').one('transitionend', () => {
        Adapt.a11y.focusFirst(this.$('.reveal__widget-item:not(.aria-hidden)'));
      });
    }

    openPopup(event) {
      event.preventDefault();

      this.model.set('_active', false);

      const bodyText = this.model.get('_revealed')
        ? this.model.get('second').body
        : this.model.get('first').body;

      const popupObject = {
        title: '',
        body: bodyText
      };

      Adapt.notify.popup(popupObject);
    }
  }

  return Adapt.register('reveal', Reveal);
});
