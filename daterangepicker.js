/* eslint-disable no-var */
window.rangePicker = function (dateFns, $) {
  let DateRangePicker = function (element, options, cb) {
    this.parentEl = 'body';
    this.element = $(element);
    this.startDate = dateFns.startOfToday();
    this.endDate = dateFns.endOfToday();
    this.minDate = false;
    this.maxDate = false;
    this.singleDatePicker = false;
    this.timePicker = false;
    this.timePickerIncrement = 1;
    this.autoUpdateInput = true;
    this.ranges = {};

    this.opens = 'right';
    if (this.element.hasClass('pull-right'))
      this.opens = 'left';

    this.drops = 'down';
    if (this.element.hasClass('dropup'))
      this.drops = 'up';

    this.buttonClasses = 'btn btn-sm';
    this.applyButtonClasses = 'btn-primary';
    this.cancelButtonClasses = 'btn-default';

    this.locale = {
      direction: 'ltr',
      format: 'MM/dd/yyyy',
      inputFormat: 'dd.MM.yyyy',
      separator: ' - ',
      applyLabel: 'Apply',
      cancelLabel: 'Cancel',
      weekLabel: 'W',
      customRangeLabel: 'Custom Range',
      daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      firstDay: 0,
    };

    this.callback = function () { };

    //some state information
    this.isShowing = false;
    this.leftCalendar = {};
    this.rightCalendar = {};

    //custom options from user
    if (typeof options !== 'object' || options === null)
      options = {};

    //allow setting options with data attributes
    //data-api options will be overwritten with custom javascript options
    options = $.extend(this.element.data(), options);

    //html template for the picker UI
    if (typeof options.template !== 'string' && !(options.template instanceof $))
      options.template =
        '<div class="daterangepicker">' +
        '<div class="ranges"></div>' +
        '<div class="drp-calendar left">' +
        '<div class="calendar-table"></div>' +
        '<div class="calendar-time"></div>' +
        '</div>' +
        '<div class="drp-calendar right">' +
        '<div class="calendar-table"></div>' +
        '<div class="calendar-time"></div>' +
        '</div>' +
        '<div class="drp-buttons">' +
        '<div class="drp-buttons__input">' +
        '<div class="daterangepicker-input">' +
        '<input class="input-mini form-control" type="text" name="daterangepicker_start" value="" />' +
        '<span class="dash">—</span>' +
        '<input class="input-mini form-control" type="text" name="daterangepicker_end" value="" />' +
        '</div>' +
        '</div>' +
        '<button class="cancelBtn btn btn-secondary" type="button"></button>' +
        '<button class="applyBtn btn btn-primary" disabled="disabled" type="button"></button> ' +
        '</div>' +
        '</div>';

    this.parentEl = (options.parentEl && $(options.parentEl).length) ? $(options.parentEl) : $(this.parentEl);
    this.container = $(options.template).appendTo(this.parentEl);

    //
    // handle all the possible options overriding defaults
    //

    if (typeof options.locale === 'object') {

      if (typeof options.locale.direction === 'string')
        this.locale.direction = options.locale.direction;

      if (typeof options.locale.format === 'string')
        this.locale.format = options.locale.format;

      if (typeof options.locale.inputFormat === 'string')
        this.locale.inputFormat = options.locale.inputFormat;

      if (typeof options.locale.separator === 'string')
        this.locale.separator = options.locale.separator;

      if (typeof options.locale.daysOfWeek === 'object')
        this.locale.daysOfWeek = options.locale.daysOfWeek.slice();

      if (typeof options.locale.monthNames === 'object')
        this.locale.monthNames = options.locale.monthNames.slice();

      if (typeof options.locale.firstDay === 'number')
        this.locale.firstDay = options.locale.firstDay;

      if (typeof options.locale.applyLabel === 'string')
        this.locale.applyLabel = options.locale.applyLabel;

      if (typeof options.locale.cancelLabel === 'string')
        this.locale.cancelLabel = options.locale.cancelLabel;

      if (typeof options.locale.weekLabel === 'string')
        this.locale.weekLabel = options.locale.weekLabel;

      if (typeof options.locale.customRangeLabel === 'string') {
        //Support unicode chars in the custom range name.
        var elem = document.createElement('textarea');
        elem.innerHTML = options.locale.customRangeLabel;
        var rangeHtml = elem.value;
        this.locale.customRangeLabel = rangeHtml;
      }
    }
    this.container.addClass(this.locale.direction);

    if (typeof options.startDate === 'string')
      this.startDate = dateFns.format(new Date(options.startDate), this.locale.format);

    if (typeof options.endDate === 'string')
      this.endDate = dateFns.format(new Date(options.endDate), this.locale.format);

    if (typeof options.minDate === 'string')
      this.minDate = dateFns.format(new Date(options.minDate), this.locale.format);

    if (typeof options.maxDate === 'string')
      this.maxDate = dateFns.format(new Date(options.maxDate), this.locale.format);

    if (typeof options.startDate === 'object')
      this.startDate = options.startDate;

    if (typeof options.endDate === 'object')
      this.endDate = options.endDate;

    if (typeof options.minDate === 'object')
      this.minDate = options.minDate;

    if (typeof options.maxDate === 'object')
      this.maxDate = options.maxDate;

    // sanity check for bad options
    if (this.minDate && dateFns.isBefore(this.startDate, this.minDate))
      this.startDate = new Date(this.minDate);

    // sanity check for bad options
    if (this.maxDate && dateFns.isAfter(this.endDate, this.maxDate))
      this.endDate = new Date(this.maxDate)

    if (typeof options.applyButtonClasses === 'string')
      this.applyButtonClasses = options.applyButtonClasses;

    if (typeof options.applyClass === 'string') //backwards compat
      this.applyButtonClasses = options.applyClass;

    if (typeof options.cancelButtonClasses === 'string')
      this.cancelButtonClasses = options.cancelButtonClasses;

    if (typeof options.cancelClass === 'string') //backwards compat
      this.cancelButtonClasses = options.cancelClass;

    if (typeof options.opens === 'string')
      this.opens = options.opens;

    if (typeof options.drops === 'string')
      this.drops = options.drops;

    if (typeof options.buttonClasses === 'string')
      this.buttonClasses = options.buttonClasses;

    if (typeof options.buttonClasses === 'object')
      this.buttonClasses = options.buttonClasses.join(' ');

    if (typeof options.autoUpdateInput === 'boolean')
      this.autoUpdateInput = options.autoUpdateInput;

    // update day names order to firstDay
    if (this.locale.firstDay != 0) {
      var iterator = this.locale.firstDay;
      while (iterator > 0) {
        this.locale.daysOfWeek.push(this.locale.daysOfWeek.shift());
        iterator--;
      }
    }

    var start, end;

    //if no start/end dates set, check if an input element contains initial values
    if (typeof options.startDate === 'undefined' && typeof options.endDate === 'undefined') {
      if ($(this.element).is(':text')) {
        var val = $(this.element).val(),
          split = val.split(this.locale.separator);

        start = end = null;

        if (split.length == 2) {
          start = dateFns.format(split[0], this.locale.format);
          end = dateFns.format(split[1], this.locale.format);
        }
        if (start !== null && end !== null) {
          this.setStartDate(start);
          this.setEndDate(end);
        }
      }
    }

    if (typeof cb === 'function') {
      this.callback = cb;
    }

    if (!this.timePicker) {
      this.startDate = dateFns.startOfDay(new Date(this.startDate));
      this.endDate = dateFns.startOfDay(new Date(this.endDate));
      this.container.find('.calendar-time').hide();
    }
    if (typeof options.ranges === 'object')
      this.container.addClass('show-ranges');

    if (typeof options.ranges === 'undefined' && !this.singleDatePicker) {
      this.container.addClass('show-calendar');
    }

    this.container.addClass('opens' + this.opens);

    //apply CSS classes and labels to buttons
    this.container.find('.applyBtn, .cancelBtn').addClass(this.buttonClasses);
    if (this.applyButtonClasses.length)
      this.container.find('.applyBtn').addClass(this.applyButtonClasses);
    if (this.cancelButtonClasses.length)
      this.container.find('.cancelBtn').addClass(this.cancelButtonClasses);
    this.container.find('.applyBtn').html(this.locale.applyLabel);
    this.container.find('.cancelBtn').html(this.locale.cancelLabel);

    //
    // event listeners
    //

    this.container.find('.drp-calendar')
      .on('click.daterangepicker', '.prev', $.proxy(this.clickPrev, this))
      .on('click.daterangepicker', '.next', $.proxy(this.clickNext, this))
      .on('mousedown.daterangepicker', 'td.available', $.proxy(this.clickDate, this))
      .on('mouseenter.daterangepicker', 'td.available', $.proxy(this.hoverDate, this))

    this.container.find('.ranges')
      .on('click.daterangepicker', 'li', $.proxy(this.clickRange, this))

    this.container.find('.drp-buttons')
      .on('click.daterangepicker', 'button.applyBtn', $.proxy(this.clickApply, this))
      .on('click.daterangepicker', 'button.cancelBtn', $.proxy(this.clickCancel, this))
      .on('change.daterangepicker', '.daterangepicker-input input', $.proxy(this.formInputsChanged, this))
      .on('keydown.daterangepicker', '.daterangepicker-input input', $.proxy(this.formInputsKeydown, this))
      .on('focus.daterangepicker', '.daterangepicker-input input', $.proxy(this.toggleFocusedClassToInput, this))
      .on('blur.daterangepicker', '.daterangepicker-input input', $.proxy(this.toggleFocusedClassToInput, this));

    if (this.element.is('input') || this.element.is('button')) {
      this.element.on({
        'click.daterangepicker': $.proxy(this.show, this),
        'focus.daterangepicker': $.proxy(this.show, this),
        'keyup.daterangepicker': $.proxy(this.elementChanged, this),
        'keydown.daterangepicker': $.proxy(this.keydown, this) //IE 11 compatibility
      });
    } else {
      this.element.on('click.daterangepicker', $.proxy(this.toggle, this));
      this.element.on('keydown.daterangepicker', $.proxy(this.toggle, this));
    }

    //
    // if attached to a text input, set the initial value
    //
    this.updateElement();

  };

  DateRangePicker.prototype = {

    constructor: DateRangePicker,

    setStartDate: function (startDate) {
      if (typeof startDate === 'object')
        this.startDate = startDate;

      if (!this.timePicker)
        this.startDate = dateFns.startOfDay(new Date(this.startDate));

      if (this.timePicker && this.timePickerIncrement)
        this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

      if (this.minDate && dateFns.isBefore(this.startDate, this.minDate)) {
        this.startDate = new Date(this.minDate.clone);
        if (this.timePicker && this.timePickerIncrement)
          this.startDate.minute(Math.round(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
      }

      if (this.maxDate && this.startDate.isAfter(this.maxDate)) {
        this.startDate = new Date(this.maxDate.clone);
        if (this.timePicker && this.timePickerIncrement)
          this.startDate.minute(Math.floor(this.startDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);
      }

      if (!this.isShowing)
        this.updateElement();

      this.updateMonthsInView();
    },

    setEndDate: function (endDate) {
      if (typeof endDate === 'object')
        this.endDate = new Date(endDate);

      if (!this.timePicker)
        this.endDate = dateFns.endOfDay(new Date(this.endDate));

      if (this.timePicker && this.timePickerIncrement)
        this.endDate.minute(Math.round(this.endDate.minute() / this.timePickerIncrement) * this.timePickerIncrement);

      if (dateFns.isBefore(this.endDate, this.startDate))
        this.endDate = new Date(this.startDate);

      if (this.maxDate && dateFns.isAfter(this.endDate, this.maxDate))
        this.endDate = new Date(this.maxDate);

      this.previousRightTime = new Date(this.endDate);

      this.container.find('.drp-selected').html(dateFns.format(this.startDate, this.locale.format) + this.locale.separator + dateFns.format(this.endDate, this.locale.format));

      if (!this.isShowing)
        this.updateElement();

      this.updateMonthsInView();
    },

    updateView: function () {
      if (this.endDate) {
        this.container.find('input[name="daterangepicker_end"]').removeClass('active');
        this.container.find('input[name="daterangepicker_start"]').addClass('active');
      } else {
        this.container.find('input[name="daterangepicker_end"]').addClass('active');
        this.container.find('input[name="daterangepicker_start"]').removeClass('active');
      }
      this.updateMonthsInView();
      this.updateCalendars();
      this.updateFormInputs();

      this.element.trigger('update.daterangepicker', this);
    },

    updateMonthsInView: function () {
      if (this.endDate) {

        //if both dates are visible already, do nothing
        if (!this.singleDatePicker && this.leftCalendar.month && this.rightCalendar.month &&
          (dateFns.format(this.startDate, 'yyyy-MM') == dateFns.format(this.leftCalendar.month, 'yyyy-MM') || dateFns.format(this.startDate, 'yyyy-MM') == dateFns.format(this.rightCalendar.month, 'yyyy-MM')) &&
          (dateFns.format(this.endDate, 'yyyy-MM') == dateFns.format(this.leftCalendar.month, 'yyyy-MM') || dateFns.format(this.endDate, 'yyyy-MM') == dateFns.format(this.rightCalendar.month, 'yyyy-MM'))
        ) {
          return;
        }

        this.leftCalendar.month = dateFns.setDay(new Date(this.startDate), 2);
        if ((dateFns.getMonth(this.endDate) != dateFns.getMonth(this.startDate) || dateFns.getYear(this.endDate) != dateFns.getYear(this.startDate))) {
          this.rightCalendar.month = dateFns.setDay(new Date(this.endDate), 2);
        } else {
          this.rightCalendar.month = dateFns.addMonths(dateFns.setDay(new Date(this.startDate), 2), 1);
        }

      } else {
        if (dateFns.format(this.leftCalendar.month, 'yyyy-MM') != dateFns.format(this.startDate, 'yyyy-MM') && dateFns.format(this.rightCalendar.month, 'yyyy-MM') != dateFns.format(this.startDate, 'yyyy-MM')) {
          this.leftCalendar.month = dateFns.setDay(new Date(this.startDate), 2);
          this.rightCalendar.month = dateFns.addMonths(dateFns.setDay(new Date(this.startDate), 2), 1);
        }
      }
    },

    updateCalendars: function () {
      this.renderCalendar('left');
      this.renderCalendar('right');

      //highlight any predefined range matching the current start and end dates
      this.container.find('.ranges li').removeClass('active');
      if (this.endDate == null) return;

      this.calculateChosenLabel();
    },

    renderCalendar: function (side) {

      //
      // Build the matrix of dates that will populate the calendar
      //

      var calendar = side == 'left' ? this.leftCalendar : this.rightCalendar;
      var month = dateFns.getMonth(calendar.month);
      var year = dateFns.getYear(calendar.month);
      var hour = dateFns.getHours(calendar.month);
      var minute = dateFns.getMinutes(calendar.month);
      var second = dateFns.getSeconds(calendar.month);
      var daysInMonth = dateFns.getDaysInMonth(new Date(year, month));
      var firstDay = new Date(year, month, 1);
      var lastDay = new Date(year, month, daysInMonth);
      var lastMonth = dateFns.getMonth(dateFns.subMonths(firstDay, 1));
      var lastYear = dateFns.getYear(dateFns.subMonths(firstDay, 1));
      var daysInLastMonth = dateFns.getDaysInMonth(new Date(lastYear, lastMonth));
      var dayOfWeek = dateFns.getDay(firstDay);

      //initialize a 6 rows x 7 columns array for the calendar
      var calendar = [];
      calendar.firstDay = firstDay;
      calendar.lastDay = lastDay;

      for (var i = 0; i < 6; i++) {
        calendar[i] = [];
      }

      //populate the calendar with date objects
      var startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
      if (startDay > daysInLastMonth)
        startDay -= 7;

      if (dayOfWeek == this.locale.firstDay)
        startDay = daysInLastMonth - 6;

      var curDate = new Date(lastYear, lastMonth, startDay, 12, minute, second);

      var col, row;
      for (var i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = dateFns.addHours(new Date(curDate), 24)) {
        if (i > 0 && col % 7 === 0) {
          col = 0;
          row++;
        }
        calendar[row][col] = dateFns.setHours(dateFns.setMinutes(dateFns.setSeconds(new Date(curDate), second), minute), hour)
        dateFns.setHours(curDate, 12);

        if (this.minDate && dateFns.format(calendar[row][col], 'yyyy-MM-dd') == dateFns.format(this.minDate, 'yyyy-MM-dd') && dateFns.isBefore(calendar[row][col], this.minDate) && side == 'left') {
          calendar[row][col] = new Date(this.minDate);
        }

        if (this.maxDate && dateFns.format(calendar[row][col], 'yyyy-MM-dd') == dateFns.format(this.maxDate, 'yyyy-MM-dd') && dateFns.isAfter(calendar[row][col], this.maxDate) && side == 'right') {
          calendar[row][col] = new Date(this.maxDate);
        }

      }

      //make the calendar object available to hoverDate/clickDate
      if (side == 'left') {
        this.leftCalendar.calendar = calendar;
      } else {
        this.rightCalendar.calendar = calendar;
      }

      //
      // Display the calendar
      //

      var minDate = side == 'left' ? this.minDate : this.startDate;
      var maxDate = this.maxDate;
      var selected = side == 'left' ? this.startDate : this.endDate;
      var arrow = this.locale.direction == 'ltr' ? {
        left: 'chevron-left',
        right: 'chevron-right'
      } : {
          left: 'chevron-right',
          right: 'chevron-left'
        };

      var html = '<table class="table-condensed">';
      html += '<thead>';
      html += '<tr>';

      if ((!minDate || dateFns.isBefore(minDate, calendar.firstDay)) && side == 'left') {
        html += '<th class="prev available"><span></span></th>';
      } else {
        html += '<th></th>';
      }

      var dateHtml = this.locale.monthNames[dateFns.getMonth(calendar[1][1])] + dateFns.format(calendar[1][1], " yyyy");

      html += '<th colspan="5" class="month">' + dateHtml + '</th>';
      if ((!maxDate || maxDate.isAfter(calendar.lastDay)) && (side == 'right' || this.singleDatePicker)) {
        html += '<th class="next available"><span></span></th>';
      } else {
        html += '<th></th>';
      }

      html += '</tr>';
      html += '<tr>';

      $.each(this.locale.daysOfWeek, function (index, dayOfWeek) {
        html += '<th>' + dayOfWeek + '</th>';
      });

      html += '</tr>';
      html += '</thead>';
      html += '<tbody>';

      for (var row = 0; row < 6; row++) {
        html += '<tr>';

        for (var col = 0; col < 7; col++) {

          var classes = [];

          //highlight today's date
          if (dateFns.isSameDay(calendar[row][col], new Date()))
            classes.push('today');

          //highlight weekends
          if (dateFns.getISOWeek(calendar[row][col]) > 5)
            classes.push('weekend');

          //grey out the dates in other months displayed at beginning and end of this calendar
          if (dateFns.getMonth(calendar[row][col]) != dateFns.getMonth(calendar[1][1]))
            classes.push('off', 'ends');

          //don't allow selection of dates before the minimum date
          if (this.minDate && dateFns.isBefore(calendar[row][col], this.minDate))
            classes.push('off', 'disabled');

          //don't allow selection of dates after the maximum date
          if (maxDate && dateFns.isAfter(calendar[row][col], maxDate))
            classes.push('off', 'disabled');

          //highlight the currently selected start date
          if (dateFns.format(calendar[row][col], 'yyyy-MM-dd') == dateFns.format(this.startDate, 'yyyy-MM-dd'))
            classes.push('active', 'start-date');

          //highlight the currently selected end date
          if (this.endDate != null && dateFns.format(calendar[row][col], 'yyyy-MM-dd') == dateFns.format(this.endDate, 'yyyy-MM-dd'))
            classes.push('active', 'end-date');

          //highlight dates in-between the selected dates
          if (this.endDate != null && calendar[row][col] > this.startDate && calendar[row][col] < this.endDate)
            classes.push('in-range');

          var cname = '',
            disabled = false;
          for (var i = 0; i < classes.length; i++) {
            cname += classes[i] + ' ';
            if (classes[i] == 'disabled')
              disabled = true;
          }
          if (!disabled)
            cname += 'available';

          html += '<td class="' + cname.replace(/^\s+|\s+$/g, '') + '" data-title="' + 'r' + row + 'c' + col + '">' + dateFns.getDate(calendar[row][col]) + '</td>';

        }
        html += '</tr>';
      }

      html += '</tbody>';
      html += '</table>';

      this.container.find('.drp-calendar.' + side + ' .calendar-table').html(html);

    },

    toggleFocusedClassToInput: function () {
      this.container.find('.daterangepicker-input').toggleClass('__is-focused');
    },

    updateFormInputs: function () {
      if (this.container.find('input[name=daterangepicker_start]').is(":focus") || this.container.find('input[name=daterangepicker_end]').is(":focus")) {
        return;
      }

      this.container.find('input[name=daterangepicker_start]').val(dateFns.format(this.startDate, this.locale.inputFormat));
      if (this.endDate) {
        this.container.find('input[name=daterangepicker_end]').val(dateFns.format(this.endDate, this.locale.inputFormat));
      }

      if (this.singleDatePicker || (this.endDate && (dateFns.isBefore(this.startDate, this.endDate) || this.startDate.isSame(this.endDate)))) {
        this.container.find('button.applyBtn').prop('disabled', false);
      } else {
        this.container.find('button.applyBtn').prop('disabled', true);
      }
    },

    move: function () {
      var parentOffset = {
        top: 0,
        left: 0
      },
        containerTop;
      var parentRightEdge = $(window).width();
      if (!this.parentEl.is('body')) {
        parentOffset = {
          top: this.parentEl.offset().top - this.parentEl.scrollTop(),
          left: this.parentEl.offset().left - this.parentEl.scrollLeft()
        };
        parentRightEdge = this.parentEl[0].clientWidth + this.parentEl.offset().left;
      }

      if (this.drops == 'up')
        containerTop = this.element.offset().top - this.container.outerHeight() - parentOffset.top;
      else
        containerTop = this.element.offset().top + this.element.outerHeight() - parentOffset.top;

      // Force the container to it's actual width
      this.container.css({
        top: 0,
        left: 0,
        right: 'auto'
      });
      var containerWidth = this.container.outerWidth();

      this.container[this.drops == 'up' ? 'addClass' : 'removeClass']('drop-up');

      if (this.opens == 'left') {
        var containerRight = parentRightEdge - this.element.offset().left - this.element.outerWidth();
        if (containerWidth + containerRight > $(window).width()) {
          this.container.css({
            top: containerTop,
            right: 'auto',
            left: 9
          });
        } else {
          this.container.css({
            top: containerTop,
            right: containerRight,
            left: 'auto'
          });
        }
      } else if (this.opens == 'center') {
        var containerLeft = this.element.offset().left - parentOffset.left + this.element.outerWidth() / 2 -
          containerWidth / 2;
        if (containerLeft < 0) {
          this.container.css({
            top: containerTop,
            right: 'auto',
            left: 9
          });
        } else if (containerLeft + containerWidth > $(window).width()) {
          this.container.css({
            top: containerTop,
            left: 'auto',
            right: 0
          });
        } else {
          this.container.css({
            top: containerTop,
            left: containerLeft,
            right: 'auto'
          });
        }
      } else {
        var containerLeft = this.element.offset().left - parentOffset.left;
        if (containerLeft + containerWidth > $(window).width()) {
          this.container.css({
            top: containerTop,
            left: 'auto',
            right: 0
          });
        } else {
          this.container.css({
            top: containerTop,
            left: containerLeft,
            right: 'auto'
          });
        }
      }
    },

    show: function (e) {
      if (this.isShowing) return;

      // Create a click proxy that is private to this instance of datepicker, for unbinding
      this._outsideClickProxy = $.proxy(function (e) {
        this.outsideClick(e);
      }, this);

      // Bind global datepicker mousedown for hiding and
      $(document)
        .on('mousedown.daterangepicker', this._outsideClickProxy)
        // also support mobile devices
        .on('touchend.daterangepicker', this._outsideClickProxy)
        // also explicitly play nice with Bootstrap dropdowns, which stopPropagation when clicking them
        .on('click.daterangepicker', '[data-toggle=dropdown]', this._outsideClickProxy)
        // and also close when focus changes to outside the picker (eg. tabbing between controls)
        .on('focusin.daterangepicker', this._outsideClickProxy);

      // Reposition the picker if the window is resized while it's open
      $(window).on('resize.daterangepicker', $.proxy(function (e) {
        this.move(e);
      }, this));

      this.oldStartDate = new Date(this.startDate);
      this.oldEndDate = new Date(this.endDate);
      this.previousRightTime = new Date(this.endDate);

      this.updateView();
      this.container.show();
      this.move();
      this.element.trigger('show.daterangepicker', this);
      this.isShowing = true;

      this.setMasks();
    },

    setMasks: function () {
      var startDateInput = $('input[name="daterangepicker_start"]:first')[0];
      var endDateInput = $('input[name="daterangepicker_end"]:first')[0];

      var _this = this;

      var startDateInputMaxLength = 10;

      // eslint-disable-next-line no-undef
      var inputMask = new Inputmask({
        alias: 'datetime',
        inputFormat: 'dd.mm.yyyy',
        placeholder: '__.__.____',
        positionCaretOnClick: 'none',
        oncomplete: function (element) {
          if (startDateInput === element.target && $(startDateInput).prop('selectionStart') === startDateInputMaxLength) {
            $(endDateInput).focus();
            endDateInput.setSelectionRange(0, 0);
          }
          if (endDateInput === element.target) {
            var end = dateFns.format(new Date($(endDateInput).val()), _this.locale.inputFormat);
            _this.setEndDate(end);
            _this.updateCalendars();
          }
        }
      });

      inputMask.mask(startDateInput);
      inputMask.mask(endDateInput);
    },

    hide: function (e) {
      if (!this.isShowing) return;

      //incomplete date selection, revert to last values
      if (!this.endDate) {
        this.startDate = this.oldStartDate.clone();
        this.endDate = this.oldEndDate.clone();
      }

      //if a new date range was selected, invoke the user callback function
      if (!this.startDate.isSame(this.oldStartDate) || !this.endDate.isSame(this.oldEndDate))
        this.callback(this.startDate.clone(), this.endDate.clone(), this.chosenLabel);

      //if picker is attached to a text input, update it
      this.updateElement();

      $(document).off('.daterangepicker');
      $(window).off('.daterangepicker');
      this.container.hide();
      this.element.trigger('hide.daterangepicker', this);
      this.isShowing = false;
    },

    toggle: function (e) {
      if (this.isShowing) {
        this.hide();
      } else {
        this.show();
      }
    },

    outsideClick: function (e) {
      var target = $(e.target);
      // if the page is clicked anywhere except within the daterangerpicker/button
      // itself then call this.hide()
      if (
        // ie modal dialog fix
        e.type == "focusin" ||
        target.closest(this.element).length ||
        target.closest(this.container).length ||
        target.closest('.calendar-table').length
      ) return;
      this.hide();
      this.element.trigger('outsideClick.daterangepicker', this);
    },

    showCalendars: function () {
      this.container.addClass('show-calendar');
      this.move();
      this.element.trigger('showCalendar.daterangepicker', this);
    },

    hideCalendars: function () {
      this.container.removeClass('show-calendar');
      this.element.trigger('hideCalendar.daterangepicker', this);
    },

    clickRange: function (e) {
      var label = e.target.getAttribute('data-range-key');
      this.chosenLabel = label;
      if (label == this.locale.customRangeLabel) {
        this.showCalendars();
      } else {
        var dates = this.ranges[label];
        this.startDate = new Date(dates[0]);
        this.endDate = new Date(dates[1]);

        if (!this.timePicker) {
          this.startDate = dateFns.startOfDay(new Date(this.startDate));
          this.endDate = dateFns.endOfDay(new Date(this.endDate));
        }

        this.hideCalendars();
        this.clickApply();
      }
    },

    clickPrev: function (e) {
      var cal = $(e.target).parents('.drp-calendar');
      if (cal.hasClass('left')) {
        this.leftCalendar.month = dateFns.subMonths(this.leftCalendar.month, 1);
      } else {
        this.rightCalendar.month = dateFns.subMonths(this.rightCalendar.month, 1);
      }
      this.updateCalendars();
    },

    clickNext: function (e) {
      var cal = $(e.target).parents('.drp-calendar');
      if (cal.hasClass('left')) {
        this.leftCalendar.month = dateFns.addMonths(this.leftCalendar.month, 1);
      } else {
        this.rightCalendar.month = dateFns.addMonths(this.rightCalendar.month, 1);
      }
      this.updateCalendars();
    },

    hoverDate: function (e) {

      //ignore dates that can't be selected
      if (!$(e.target).hasClass('available')) return;

      var title = $(e.target).attr('data-title');
      var row = title.substr(1, 1);
      var col = title.substr(3, 1);
      var cal = $(e.target).parents('.drp-calendar');
      var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

      //highlight the dates between the start date and the date being hovered as a potential end date
      var leftCalendar = this.leftCalendar;
      var rightCalendar = this.rightCalendar;
      var startDate = this.startDate;
      if (!this.endDate) {
        this.container.find('.drp-calendar tbody td').each(function (index, el) {

          //skip week numbers, only look at dates
          if ($(el).hasClass('week')) return;

          var title = $(el).attr('data-title');
          var row = title.substr(1, 1);
          var col = title.substr(3, 1);
          var cal = $(el).parents('.drp-calendar');
          var dt = cal.hasClass('left') ? leftCalendar.calendar[row][col] : rightCalendar.calendar[row][col];

          if ((dateFns.isAfter(dt, startDate) && dateFns.isBefore(dt, date)) || dateFns.isSameDay(dt, date)) {
            $(el).addClass('in-range');
          } else {
            $(el).removeClass('in-range');
          }

        });
      }

    },

    clickDate: function (e) {

      if (!$(e.target).hasClass('available')) return;

      var title = $(e.target).attr('data-title');
      var row = title.substr(1, 1);
      var col = title.substr(3, 1);
      var cal = $(e.target).parents('.drp-calendar');
      var date = cal.hasClass('left') ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

      //
      // this function needs to do a few things:
      // * alternate between selecting a start and end date for the range,
      // * if the time picker is enabled, apply the hour/minute/second from the select boxes to the clicked date
      // * if single date picker mode, and time picker isn't enabled, apply the selection immediately
      // * if one of the inputs above the calendars was focused, cancel that manual input
      //

      if (this.endDate || dateFns.isBefore(date, this.startDate)) { //picking start
        this.endDate = null;
        this.setStartDate(new Date(date));
      } else if (!this.endDate && dateFns.isBefore(date, this.startDate)) {
        //special case: clicking the same date for start/end,
        //but the time of the end date is before the start date
        this.setEndDate(new Date(this.startDate));
      } else { // picking end
        this.setEndDate(new Date(date));
      }

      this.updateView();

      //This is to cancel the blur event handler if the mouse was in one of the inputs
      e.stopPropagation();

    },

    calculateChosenLabel: function () {
      var customRange = true;
      var i = 0;
      for (var range in this.ranges) {
        //ignore times when comparing dates if time picker is not enabled
        if (dateFns.format(this.startDate, 'yyyy-MM-dd') == this.ranges[range][0].format('yyyy-MM-dd') && dateFns.format(this.endDate, 'yyyy-MM-dd') == this.ranges[range][1].format('yyyy-MM-dd')) {
          customRange = false;
          this.chosenLabel = this.container.find('.ranges li:eq(' + i + ')').addClass('active').attr('data-range-key');
          break;
        }
        i++;
      }
      if (customRange) {
        this.chosenLabel = null;
        this.showCalendars();
      }
    },

    clickApply: function (e) {
      this.hide();
      this.element.trigger('apply.daterangepicker', this);
    },

    clickCancel: function (e) {
      this.startDate = this.oldStartDate;
      this.endDate = this.oldEndDate;
      this.hide();
      this.element.trigger('cancel.daterangepicker', this);
    },

    formInputsChanged: function (e, applyIfValid = false) {
      var isRight = $(e.target).closest('.calendar').hasClass('right');
      var start = dateFns.parse(this.container.find('input[name="daterangepicker_start"]').val(), this.locale.inputFormat, new Date());
      var end = dateFns.parse(this.container.find('input[name="daterangepicker_end"]').val(), this.locale.inputFormat, new Date());

      if (dateFns.isValid(start) && dateFns.isValid(end)) {

        if (isRight && dateFns.isBefore(end, start))
          start = new Date(end);

        this.setStartDate(start);
        this.setEndDate(end);

        if (isRight) {
          this.container.find('input[name="daterangepicker_start"]').val(dateFns.format(this.startDate, this.locale.inputFormat));
        } else {
          this.container.find('input[name="daterangepicker_end"]').val(dateFns.format(this.endDate, this.locale.inputFormat));
        }

        if (applyIfValid) {
          return this.clickApply();
        }
      }

      this.updateView();
    },

    formInputsKeydown: function (e) {
      // This function ensures that if the 'enter' key was pressed in the input, then the calendars
      // are updated with the startDate and endDate.
      // This behaviour is automatic in Chrome/Firefox/Edge but not in IE 11 hence why this exists.
      // Other browsers and versions of IE are untested and the behaviour is unknown.
      if (e.keyCode === 13) {
        // Prevent the calendar from being updated twice on Chrome/Firefox/Edge
        e.preventDefault();
        this.formInputsChanged(e, true);
      }

      // Tab
      if (e.keyCode === 9) {
        // Prevent the calendar from being updated twice on Chrome/Firefox/Edge
        this.container.find('input[name="daterangepicker_end"]').focus(function (focusEvent) {
          focusEvent.target.setSelectionRange(0, 0);
          focusEvent.preventDefault();
        });
      }
    },

    elementChanged: function () {
      if (!this.element.is('input')) return;
      if (!this.element.val().length) return;

      var dateString = this.element.val().split(this.locale.separator),
        start = null,
        end = null;

      if (dateString.length === 2) {
        start = dateFns.format(dateString[0], this.locale.format);
        end = dateFns.format(dateString[1], this.locale.format);
      }

      if (this.singleDatePicker || start === null || end === null) {
        start = dateFns.format(this.element.val(), this.locale.format);
        end = start;
      }

      if (!start.isValid() || !end.isValid()) return;

      this.setStartDate(start);
      this.setEndDate(end);
      this.updateView();
    },

    keydown: function (e) {
      //hide on tab or enter
      if ((e.keyCode === 9) || (e.keyCode === 13)) {
        this.hide();
      }

      //hide on esc and prevent propagation
      if (e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();

        this.hide();
      }
    },

    updateElement: function () {
      if (this.element.is('input') && this.autoUpdateInput) {
        var newValue = dateFns.format(this.startDate, this.locale.format);
        if (!this.singleDatePicker) {
          newValue += this.locale.separator + dateFns.format(this.endDate, this.locale.format);
        }
        if (newValue !== this.element.val()) {
          this.element.val(newValue).trigger('change');
        }
      }
    },

    remove: function () {
      this.container.remove();
      this.element.off('.daterangepicker');
      this.element.removeData();
    }
  };

  $.fn.daterangepicker = function (options, callback) {
    var implementOptions = $.extend(true, {}, $.fn.daterangepicker.defaultOptions, options);
    this.each(function () {
      var el = $(this);
      if (el.data('daterangepicker'))
        el.data('daterangepicker').remove();
      el.data('daterangepicker', new DateRangePicker(el, implementOptions, callback));
    });
    return this;
  };

  return DateRangePicker;
}
