/* Chinese initialisation for the jQuery UI date picker plugin. */
/* Written by Cloudream (cloudream@gmail.com). */
//(function($) {
//        $.ui.datepicker.regional['zh-CN'] = {
//                renderer: $.extend({}, $.ui.datepicker.defaultRenderer,
//                        {month: $.ui.datepicker.defaultRenderer.month.
//                                replace(/monthHeader:M yyyy/, 'monthHeader:yyyy年 M')}),
//                monthNames: ['一月','二月','三月','四月','五月','六月',
//                '七月','八月','九月','十月','十一月','十二月'],
//                monthNamesShort: ['一','二','三','四','五','六',
//                '七','八','九','十','十一','十二'],
//                dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
//                dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
//                dayNamesMin: ['日','一','二','三','四','五','六'],
//                dateFormat: 'yyyy-mm-dd',
//                firstDay: 1,
//                prevText: '&#x3c;上月', prevStatus: '',
//                prevJumpText: '&#x3c;&#x3c;', prevJumpStatus: '',
//                nextText: '下月&#x3e;', nextStatus: '',
//                nextJumpText: '&#x3e;&#x3e;', nextJumpStatus: '',
//                currentText: '今天', currentStatus: '',
//                todayText: '今天', todayStatus: '',
//                clearText: '-', clearStatus: '',
//                closeText: '关闭', closeStatus: '',
//                yearStatus: '', monthStatus: '',
//                weekText: '周', weekStatus: '',
//                dayStatus: 'DD d MM',
//                defaultStatus: '',
//                isRTL: false
//        };
//        $.extend($.ui.datepicker.defaults, $.ui.datepicker.regional['zh-CN']);
//})(jQuery);

/* Chinese initialisation for the jQuery UI date picker plugin. */
/* Written by Ressol (ressol@gmail.com). */
jQuery(function($){
	$.datepicker.regional['zh-CN'] = {
		closeText: '关闭',
		prevText: '&#x3C;上月',
		nextText: '下月&#x3E;',
		currentText: '今天',
		monthNames: ['一月','二月','三月','四月','五月','六月',
		'七月','八月','九月','十月','十一月','十二月'],
		monthNamesShort: ['1月','2月','3月','4月','5月','6月',
		'7月','8月','9月','10月','11月','12月'],
		dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
		dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
		dayNamesMin: ['日','一','二','三','四','五','六'],
		weekHeader: '周',
		dateFormat: 'yy-mm-dd',
		firstDay: 1,
		isRTL: false,
		showMonthAfterYear: true,
		yearSuffix: '年'};
	$.datepicker.setDefaults($.datepicker.regional['zh-CN']);
});