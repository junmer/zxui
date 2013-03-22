/**
 * Copyright 2013 Baidu Inc. All rights reserved.
 * @file  知心中间页日志统计模块
 * @see 点击统计规范(新版/xpath)
 * @see <a href="http://fe.baidu.com/doc/aladdin/#standard/aladdin_click.text">点击统计规范(新版/xpath)</a>
 * @author  chris(wfsr@foxmail.com)
 */

define(function (require) {
	var T = baidu;
	var DOM = T.dom;
	var TO = T.object;

	/**
	 * 发送日志请求
	 * 
	 * @inner
	 * @type {string} url 日志完事地址
	 */
	var send = (function () {
	    var list = [];
	    return function (url) {
	        var index = list.push(new Image) - 1;

	        list[index].onload = list[index].onerror =function () {
	            list[index] = list[index].onload = list[index].onerror = null;
	            delete list[index];
	        };

	        list[index].src = url;
	    };
	})();

	/**
	 * 填充数据
	 * 根据当前点击对象，解释对象所处XPath及url
	 * @inner
	 * @param {Object.<string, *>} data待发送的数据对象
	 * @param {HTMLElement} from 当前点击对象
	 * @param {HTMLElement} to 统计日志最上层容器
	 */
	var fill = function (data, from, to) {
		var type = 'other';
		var tag = from.tagName.toLowerCase();
		var path = [tag];
		var i = 1;
		var url;

		DOM.getAncestorBy(from, function (el) {
			if ( el !== to ) {
				path[i ++] = el.tagName;

				if ( el.href ) {
					url = el.href;
					type = 'link';
				}
			}
			else {
				return true;
			}
		});

		path.reverse();

		if ( /^a|img|input|button$/.test(tag) ) {
			type = {a: 'link', button: 'btn'}[tag] || tag;

			if ( from.type && /^button|submit|reset|image$/.test(from.type) ){
				type = 'btn';
			}

			url = from.href || from.src || url;
			if ( url ) {
				data.url = url;
			}
		} else {
			T.each('title,link,img,btn,others'.split(','), function (key) {
				if ( DOM.hasClass(from, options[key]) ) {
					type = key;
				}
			});
		}

		data.rsv_xpath = path.join('-').toLowerCase() + '(' + type + ')';
	};

	/**
	 * 配置项
	 * 
	 * @type {Object}
	 * @type {string} options.action 日志统计服务接口地址
	 * @type {string} options.main 日志统计顶层容器className
	 * @type {string} options.title xpath中title类型的className
	 * @type {string} options.link xpath中link类型的className
	 * @type {string} options.img xpath中img类型的className
	 * @type {string} options.btn xpath中btn类型的className
	 * @type {string} options.others xpath中others类型的className
	 * @type {Object} options.data 统计公共数据部分
	 */
	var options = /** @lends log.options */ {

		// 日志统计服务接口地址
		action: 'http://sclick.baidu1.com/w.gif?',

		// 日志统计顶层容器className
		main: 'result-op',

		// xpath中title类型的className
		title: 'OP_LOG_TITLE',

		// xpath中link类型的className
		link: 'OP_LOG_LINK',

		// xpath中img类型的className
		img: 'OP_LOG_IMG',

		// xpath中btn类型的className
		btn: 'OP_LOG_BTN',

		// xpath中others类型的className
		others: 'OP_LOG_OTHERS',

		// 统计公共数据部分
		data: {}
	};

	/**
	 * 页面点击监听
	 * 
	 * @inner
	 * @param {DOMEvent} e DOM事件对象
	 */
	var onClick = function (e) {
		var target = T.event.getTarget(e);
		var main = DOM.getAncestorByClass(target, options.main);
		var nolog = target.getAttribute('data-nolog') === '1';

		if ( nolog || !main ) {
			return;
		}

		var data = T.extend({}, options.data);
		var clickData = main.getAttribute('data-click');

		if ( clickData != null ) {
			clickData = T.json.parse(clickData);
			data = T.extend(data, clickData);
		}

		data.t = +new Date;
		fill(data, target, main);

		send(options.action + T.url.jsonToQuery(data));
	};

	/**
	 * 日志模块对象
	 * 
	 * @type {Object}
	 */
	var log = {

		/**
		 * 配置项
		 * 
		 * @param {Object.<string, *>} ops 可配置项
		 * @type {string} ops.action 日志统计服务接口地址
		 * @type {string} ops.main 日志统计顶层容器className
		 * @type {string} ops.title xpath中title类型的className
		 * @type {string} ops.link xpath中link类型的className
		 * @type {string} ops.img xpath中img类型的className
		 * @type {string} ops.btn xpath中btn类型的className
		 * @type {string} ops.others xpath中others类型的className
		 * @type {Object} ops.data 统计公共数据部分
		 */
		config: function (ops) {
			T.extend(options, ops);
		},

		/**
		 * 开始监听页面点击日志
		 * 
		 */
		start: function () {
			T.on(document, 'click', onClick);
		},

		/**
		 * 停止监听页面点击日志
		 * 
		 */
		stop: function () {
			T.un(document, 'click', onClick);
		}
	};

	return log;
})