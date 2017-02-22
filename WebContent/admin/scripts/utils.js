/*******************************************************************************************
 * ***本模块为公用函数集，包含控件初始化函数、数据校验函数、数据转换类、页面动作函数四大类	
 *******************************************************************************************/
var keysNotChangeContent = new Array(
		9,		//tab
		13,		//enter
		16,		//shift
		17,		//ctrl
		18,		//alt
		19,		//pause/break
		20,		//caps lock
		27,		//escapef
		33,		//page down
		34,		//page up
		35,		//end
		36,		//home
		37,		//left
		38,		//up
		39,		//right
		40,		//down
		45,		//insert
		112,	//f1
		113,	//f2
		114,	//f3
		115,	//f4
		116,	//f5
		117,	//f6
		118,	//f7
		119,	//f8
		120,	//f9
		121,	//f10
		122,	//f11
		123,	//f12
		144		//number lock
		);
var cache = {};
var nowString = getServerTime('date', 'string');
var maxGridRowNum = 5000;
var bulletType1 = '<span style="margin-left:20px; margin-right:10px">&#9734;</span>';
var bulletType2 = '<span style="margin-left:25px; margin-right:10px">&#9830;</span>';
var leftClosureForAddInfo = '&nbsp;&#9670;', rightClosureForAddInfo = ''
var helpSwitchElems = '<div class="inline"><label>关闭帮助</label>'
	+ '<input type="checkbox" class="two-way-switch not-serialize" onchange="troggleHelpMsg(this);"/>'
	+ '<label>打开帮助</label></div>';
var TiChengFangShi = '单价计点^单价计点~固定单价^固定单价~底价差异^底价差异~实用价点^实用价点~实用定价^实用定价~实用底价^实用底价~金额计点^金额计点~人工计算^人工计算';

/***********************************************************************************
 * 以下部分的函数在事件发生时调用执行。
 ***********************************************************************************/
/*
 * 初始化页面的jquery控件
 * 前提：	无；
 * 输入:		无。 
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	无
 * 其他:		本函数通常在页面DOM元素初始化完成后被调用。放在$(function(){})中执行。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 * 
 * 调用者：	1）本模块的初始化部分
 */
function jQueryUIInit() {
	standardizingUI();
	
	//设置ajax访问的通用属性。包含以下操作：
	//1） 绑定服务器访问错误时的处理函数
	//2） 缺省访问模式设定为同步方式等。
	//3） 访问完成后，去除访问中旋转图片显示。
	$.ajaxSetup({
		async : false,
		type : 'post',
		dataType : 'json',
		error: function (jqXHR, status, e){
			ajaxServerErrorHandler(jqXHR, status, e);
		},
		complete : function() {
			removeLoadingImage();},
	});
	//设置dialog控件的缺省参数
	$.extend($.ui.dialog.prototype.options, { 
		modal: true,
		resizable: false,
		closeOnEscape: false,
		height: 'auto',
//		minWidth: 400,
		width: 'auto',
		});
	//绑定jqGrid缺省的服务器错误事件，以及数据预处理函数。
	if ($.jgrid != undefined) {
		$.extend($.jgrid.defaults,{
			loadError: function(xhr, status, error){
				if (xhr['status'] != 200) {
					ajaxServerErrorHandler(xhr, status, error);			
				};			
			},
			beforeProcessing: function (data, status, xhr){
				if (data.status!='OK') {
					ajaxJsonErrorHandler(data);
					status= 204;
				};
			},
		});		
	}
	//允许ui.dialog的title使用HTML
	$.widget("ui.dialog", $.extend({}, $.ui.dialog.prototype, {
	    _title: function(title) {
	        if (!this.options.title ) {
	            title.html("&#160;");
	        } else {
	            title.html(this.options.title);
	        }
	    }
	}));
	
	function ajaxServerErrorHandler(xhr, status, e){
		if (xhr['status']==200) return;
		var msg = '<strong>错误代码：</strong> ' + xhr['status'] +'<br /><strong>错误说明： </strong>' + xhr['statusText']+ '<br /><br />请联系系统管理员';
		showupMessageInDialog(msg , '系统错误', 'wrong');		
	};
};

function replaceZeroWithEmpty(cellvalue, options, rowObject){
		if(cellvalue=='0') {
			return '';
		} else {
			return cellvalue;
		}
	}
function eliminateDuplicatedUnit(cellvalue, options, rowObject){
	if(rowObject['KuCunDanWei'] == rowObject['KuCunFuDanWei']) {
		return '';
	} else {
		return cellvalue;
	}
}

function standardizingUI(objContext) {
	objContext = iniContextObject(objContext);
	$('.help-switch', objContext).html(helpSwitchElems);
	if ($('.help-switch', objContext).length > 0 && $(objContext).hasClass('dialog-body')) {
		$(objContext).css('padding-top','3rem');
		$('.help-switch', objContext).addClass('help-switch-within-dialogbox');
	} else {
		$('.help-switch', objContext).addClass('help-switch-on-page');
	}
	//调整与order.html页面具有相同布局页面的元素间隙
	$('.row-divider > div:not(".first-column, .no-left-margin")', objContext).css('margin-left', '1rem');
	datePickerPreparing($(objContext), null);
	$('.regular-buttons', objContext).button();
	$('#menuArea .medium-imgbtn .ui-button-text', objContext).css('padding','0');
	$('fieldset', objContext).addClass('ui-corner-all');
	$('.content-label', objContext).addClass('formated-input');
	
	var allTypableElems = $('input, textarea, select', objContext).not('.ui-pg-input,.without-format');

	allTypableElems.addClass('formated-input ui-widget-content ui-corner-all');
	var allNotEmptyElems = $('.not-empty', objContext);
	for (var i = 0; i < allNotEmptyElems.length; i++) {
		if (allNotEmptyElems[i].type == 'text' || allNotEmptyElems[i].type == 'textarea') {
			if (allNotEmptyElems[i].getAttribute('disabled') != 'disabled') {
				if (!allNotEmptyElems[i].placeholder || allNotEmptyElems[i].placeholder.indexOf('必填项') == -1) {
					if (allNotEmptyElems[i].placeholder) allNotEmptyElems[i].placeholder = ' ' + allNotEmptyElems[i].placeholder;
					allNotEmptyElems[i].placeholder += ' 必填项';									
				}
			}
		}
		if (allNotEmptyElems[i].name != undefined) {
			$('[for="' + allNotEmptyElems[i].name + '"]', objContext).addClass('not-empty-label');			
		}
	}
	$('.box-buttons', objContext).addClass('ui-corner-all');
//	$('.py-combobox-input', objContext).removeClass('ui-corner-all').addClass('ui-corner-left');

	//最早使用addEventListener绑定函数，但用jquery的trigger函数触发时，始终不能解决传递this的问题。
	//因此全部改用jquery的bind函数，以后可继续研究这个问题。 ---- Harry 2015-01-15
	//简化了switch控件的使用，只需要两个LABEL夹一个checkbox就可以定义完成。 ---- Harry 2015-10-26
	var switchesUnderContext = $('.one-way-switch, .two-way-switch', objContext);
	if (switchesUnderContext.length > 0) {
		for (var i = 0; i < switchesUnderContext.length; i++) {
			$(switchesUnderContext[i]).unbind('change.pyUtil');
			$(switchesUnderContext[i]).bind('change.pyUtil', function(){clickOnSwitch(this);});		
			var labelAfterSwitch = switchesUnderContext[i].nextElementSibling;
			if (labelAfterSwitch.nodeName != 'LABEL') continue;
			$(labelAfterSwitch).unbind('click.pyUtil');
			$(labelAfterSwitch).bind('click.pyUtil', function(){clickOnSwitchLabel(this);});		
			if (switchesUnderContext[i].className.indexOf('two-way-switch') != -1) {
				var labelBeforeSwitch = switchesUnderContext[i].previousElementSibling;
				if (labelBeforeSwitch.nodeName != 'LABEL') continue;
				$(labelBeforeSwitch).unbind('click.pyUtil');
				$(labelBeforeSwitch).bind('click.pyUtil', function(){clickOnSwitchLabel(this);}).addClass('label-before-switch');				
			}
			clickOnSwitch(switchesUnderContext[i]);			
		}
	}

	//使用jQuery的namespace技术，实现函数的精确绑定和去绑，避免多次调用standardizingUI函数是造成的多次绑定
	//使用 jQuery的on方法，绑定了一个自定义事件，使placeholder变色的事件可以独立触发 -- Harry @ 2016-01-17
	$('select', objContext).off('troggle-placeholder-color change.pyUtil');
	
	$('select', objContext).on('troggle-placeholder-color change.pyUtil', function(event){
		if (!this.value) {
			$(this).removeClass('formated-input').addClass('placeholder');
		} else {
			$(this).addClass('formated-input').removeClass('placeholder');			
		}		
	});
}



/*
 * 初始化页面环境context
 * 前提：	无；
 * 输入:		1）任意：参考元素
 * 			2）父节点的选择器，如果使用，仅能使用字符格式 
 * 出口：	调用点
 * 返回：	环境context的jQuery对象
 * 其他:		本函数以输入的参考元素为基点，根据是否有第二参数，
 * 			决定是返回参考元素自身，还是向上查找满足第二参数要求的参考元素的父节点
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2015-06-20
 * 
 */
function iniContextObject(objContext, strParentSelector){
	if (objContext == undefined) {
		return $('body');
	} else {
		if (strParentSelector) {
			if ($(objContext).is(strParentSelector)) {
				return $(objContext);
			}
			var parentObj = $(objContext).closest(strParentSelector);
			if (parentObj.length == 0) {
				return $('body');				
			} else {
				return parentObj;
			}
		} else {
			return $(objContext);			
		}
	}	
}

function triggerNotEmptyElem(domElem, blnOnOrOffDftT) {
	if (domElem === undefined) return;
	if (blnOnOrOffDftT == undefined) blnOnOrOffDftT = true;
	
	var jqueryTargetElems = $(domElem);
	var placeHolderString = jqueryTargetElems.prop('placeholder');
	if (blnOnOrOffDftT) {
		jqueryTargetElems.addClass('not-empty');
		jqueryTargetElems.parent().find('[for="' + jqueryTargetElems.prop('name') + '"]').addClass('not-empty-label');
		for(var i = 0; i < jqueryTargetElems.length; i++) {
			if ($(jqueryTargetElems[i]).is("input") || $(jqueryTargetElems[i]).is("textarea")) {
				if (!placeHolderString || placeHolderString.indexOf('必填项') == -1) {
					$(jqueryTargetElems[i]).prop('placeholder',placeHolderString + ' 必填项');
				}			
			} else if ($(jqueryTargetElems[i]).is("select")){
				if (!($(jqueryTargetElems[i]).find('option').first().val())) {
					$(jqueryTargetElems[i]).find('option').first().html('必选项').prop('disabled',true).hide();
				};
			}			
		}
	} else {
		jqueryTargetElems.removeClass('not-empty');
		jqueryTargetElems.parent().find('[for="' + jqueryTargetElems.prop('name') + '"]').removeClass('not-empty-label');
		for (var i = 0; i < jqueryTargetElems.length; i++) {
			if ($(jqueryTargetElems[i]).is("input") || $(jqueryTargetElems[i]).is("textarea")) {
				if (placeHolderString) placeHolderString = placeHolderString.replace(/ 必填项/g,'');
				$(jqueryTargetElems[i]).prop('placeholder',placeHolderString);			
			} else if ($(jqueryTargetElems[i]).is("select")){
				if (!($(jqueryTargetElems[i]).find('option').first().val())) {
					$(jqueryTargetElems[i]).find('option').first().html('').prop('disabled', false).show();
				};
			}			
		}
	}
}

//click菜单项触发的需要新开浏览器窗口的操作
function newWindow(menucontent) {
	var additionalInfo = '';
	if (menucontent.indexOf('&')!= -1) {
		additionalInfo = menucontent.substring(menucontent.indexOf('&')+1);
		menucontent = menucontent.substring(0, menucontent.indexOf('&'));
	}
 	var url="#";
	var name = 'PopupNewAndEditWindowOfPlusyoouSMIS';
	switch(menucontent) {
		case "新增订单":
			url = "order.html";
			break;
		case "营销活动备案":
			url = "marketing_event.html";
			break;
		case "新增销售合作商":
			url = "distributor.html";
			break;
		case "新增销售合作人":
			url = "business_companion.html";
			break;
		case "新增采购供应商":
			url="provider.html?type=materialProvider";
			break;
		case "新增营销合作商":
			url="provider.html?type=marketingProvider";
			break;
		case "新增外包服务商":
			url="provider.html?type=serviceProvider";
			break;
		case "勘查测量":
			url="insite_measurement.html";
			break;
		case "订货确单":
			url="purchase_material.html";
			break;
		case "订制品出入库":
			url="materialInOutStock.html?type=customizing";
			break;
		case "送货安排":
			url="material_delivery.html";
			break;
		case "出库安排":
			url="material_dispatcher.html";
			break;
		case "安装派工":
			url="worker_dispatcher.html";
			break;
		case "货物出入库":
			url="materialInOutStock.html?type=general";
			break;
		case "仓库盘点":
			url="inventoryTaking.html?action=taking";
			break;
		case "存货月结":
			url="inventoryTaking.html?action=confirmTaking";
			break;
		case "存量总表":
			url="inventoryTaking.html?action=onStockTotal";
			break;
		case "可用量查询":
			url="inventoryOnHands.html";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;
		case "库存流水":
			url="inventoryInOutDetail.html";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;
		case "销售安装汇总":
			url="installationStatistic.html";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;
		case "订单结算":
			url="orderSettlement.html?type=settle";
			break;
		case "结算复核":
			url="orderSettlement.html?type=settlementConfirming";
			break;
		case "货物管理":
			url="inventoryBasic.html";
			break;
		case "仓库管理":
			url="manage.html?module=cangku";
			break;
		case "收款确认":
			url="incomes_confirming.html";
			break;
		case "收支汇总":
			url="revenueSummary.html";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;
		case "部门设置":
//			url="manage.html?module=bumen";
			url="deptAndStaff.html";
			break;
		case "销售组织":
			url="manage.html?module=xiaoshoudanwei";
			break;
		case "员工资料":
			url="renyuan.html";
			break;
		case "系统参数":
			url="sysParams.html";
			break;
		case "系统自定义项":
			url="sysParamsCustimizing.html";
			break;
		case "测试页面":
			url="huowu.html";
			break;
		case "订单物资进出库历史":
			url="SOMaterialInOutHistory.html";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;		
		case "订单物资未退库":
			url="SOMaterialInOutHistory.html?未退";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;		
		case "订单物资超退库":
			url="SOMaterialInOutHistory.html?超退";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;		
		case "货物需求预测":
			url="materialPurchaseForcast.html";
			break;		
		case "订单变动费用计算":
			url="orderCommission.html";
			break;			
		case "订单变动费用考评":
			url="commissionEvaluating.html";
			break;			
		case "审批付款工程":
			url="cost_auditing.html";
			break;			
		case "付款工程支付":
			url="cost_payout.html";
			break;			
		case "应收账汇总":
			url="ARSummary.html";
			name='PopupReferenceWindowOfPlusyoouSMIS';
			break;			
		case "应收账清缴":
			url="ARWriteOff.html";
			break;			
	};
	if (additionalInfo) url += '?' + additionalInfo;
	openWindowPlusyoou(url, name);
};

function customizingReport() {
	var extendingReportList = getSheetData('扩展报表&engine=static','getQueryResult.do', 'json', true);
	if(ajaxJsonErrorHandler(extendingReportList) === false) return;
	if (extendingReportList.hasData == 'FALSE') {
		showupMessageInDialog('没有找到你权限范围内的扩展报表列表！', '无数据');
		return;
	}
	extendingReportList = extendingReportList.rows;
	var extendingReportDialog = document.createElement('div');
	extendingReportDialog.className='dialog-body';
	var HTMLContent = '';
	var oldFenLeiMingCheng = '';
	for (var i = 0; i < extendingReportList.length; i++) {
		if (extendingReportList[i]['FenLeiMingCheng'] != oldFenLeiMingCheng) {
			if (oldFenLeiMingCheng) HTMLContent += '</fieldset>';
			HTMLContent += '<fieldset class="ui-corner-all"><legend style="text-align: center">' + extendingReportList[i]['FenLeiMingCheng'] + '</legend>';
		}
		oldFenLeiMingCheng = extendingReportList[i]['FenLeiMingCheng'];
		HTMLContent += '<div class="inline folder-container" style="width:100px; text-align:center; margin-right:1rem" id="extending' 
			+ extendingReportList[i]['BianHao'] + '" onclick="iniExtending' + extendingReportList[i]['BianHao'] + '();">'
			+ '</p><img src="resource/extReport.png" />'
			+ '<p class="folder-title">' + extendingReportList[i]['BianHao'] + '：' + extendingReportList[i]['MingCheng'] + '</p></div>';
	}
	HTMLContent += '</fieldset>';
	extendingReportDialog.innerHTML = HTMLContent;

	document.body.appendChild(extendingReportDialog);
	
	$(extendingReportDialog).dialog ({
		width : 800,
		height : 500,
		title : '扩展报表<span class="ui-state-error">点击报表图标启动报表导出</span>',
		buttons: {
			"退出" : function() { 
				closeDialog(this);
			},
		},
	});
}

function datePickerPreparing(objContext, strMaxLimit, strMinLimit, blnWithYearMonthSelectorDftT) {
	objContext = iniContextObject(objContext);
	if (blnWithYearMonthSelectorDftT === undefined) blnWithYearMonthSelectorDftT = true;
	if (strMaxLimit === undefined) strMaxLimit = nowString;
	var elems = $('.date-picker-elem', objContext);
	if (objContext.hasClass('date-picker-elem')) {
		elems = objContext;
	}
	
	elems.datepicker($.datepicker.regional["zh-CN"]);
	elems.datepicker('option', 'maxDate', strMaxLimit);		
	if (strMinLimit) {
		elems.datepicker('option', 'minDate', strMinLimit);
	}
	if (blnWithYearMonthSelectorDftT) {
		elems.datepicker('option', 'changeYear', true);		
		elems.datepicker('option', 'changeMonth', true);		
	}
	
	elems.trigger('blur');		
}

function fillInYinHangZhangHu(objFillInElems){
	var YinHangZhangHu = getSheetData('收款账号&engine=static', 'getQueryResult.do', 'text', true);
	processAndFillData(YinHangZhangHu, objFillInElems);
}

function fillInSaleUnit(blnLeftBlankFirstOpt) {
	fillInStaticInfo('销售组织&engine=static', 'getQueryResult.do', '.sale-unit', true, false, blnLeftBlankFirstOpt);	
};

function fillInDepartment(parentContainer, blnLeftBlankFirstOpt) {
	var parent = $('body');
	if (parentContainer !== undefined && typeof parentContainer == 'boolean') {
		blnLeftBlankFirstOpt = parentContainer;
	} else if (parentContainer !== undefined) {
		parent = $(parentContainer);
	}
	fillInStaticInfo('部门&engine=static', 'getQueryResult.do', parent.find('.department'), true, false, blnLeftBlankFirstOpt);	
};

function fillInCustomerTitle(){
	fillInStaticInfo('称谓&engine=static', 'getQueryResult.do', '.title');
};

function fillInBankList(){
	fillInStaticInfo('往来银行&engine=static', 'getQueryResult.do', '.bank-list');
};

function fillInDistributorType(){
	fillInStaticInfo('渠道伙伴类别&engine=static', 'getQueryResult.do', '.distributor-type');	
};

function fillInBusinessCompanionType(){
	fillInStaticInfo('销售伙伴类别&engine=static', 'getQueryResult.do', '.business-companion-type');	
};

function fillInIncomingCategory(objFillInElems){
	if ($(objFillInElems).length == 0) return;
	fillInStaticInfo('收款大类&engine=static', 'getQueryResult.do', objFillInElems, true, false, true);	
};

function fillInProductionType(){
	fillInStaticInfo('产品类别&engine=static', 'getQueryResult.do', '.production-type');	
};

function fillInBrandName(){
	fillInStaticInfo('代理品牌&engine=static', 'getQueryResult.do', '.production-brand');	
};

function fillInStocks(strExtraInfoType, objFillInElems){
	var infoType = '仓库&engine=static&';
	if (strExtraInfoType) {
		infoType += '&subInfo=' + strExtraInfoType;
	}
	var selector = '.stocks';
	if (objFillInElems) {
		selector = objFillInElems;
	}
	fillInStaticInfo(infoType, 'getQueryResult.do', selector);	
};

function fillInAccountingSubject(){
	fillInStaticInfo('科目&engine=static', 'getQueryResult.do', '.subject');	
};

/*
 * 获取销售组织的下属员工姓名和工号，事件触发的函数。目前主要在销售组织选择时发生change事件后执行。
 * 前提：	控件必须是select类型的，能够接受option子元素。
 * 输入:		参数1, jquery OBject : 销售组织信息所在的element。
 * 			参数2， String : 需要填充员工信息的元素的ClassName
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	无
 * 其他:		因为在操作过程中可能因为销售单元选择项的变化，导致多次改变人员选项，因此，填充之前需进行清除操作。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 *
 * 1.1版本简述：
 * 参数1，允许传入undefined，这时获取全部员工信息，不再与销售组织关联。
 * 
 * @author Harry
 * @version 1.1 2015-05-24
 */
function fillInStaff(objTrigger, objFillInStaffOmtDft) {
	if ($(objFillInStaffOmtDft).length == 0) return;
	var infoTypeString = 'infoType=员工';
	var keepPrevious = false;
	if (objTrigger != undefined) {
		if (objTrigger.selectedIndex == -1) return;
		if (!objTrigger.value) {
			$(objFillInStaffOmtDft).empty();
			return;
		}
		if ($(objTrigger).hasClass('department')) {
			infoTypeString += '&deptCode=' + objTrigger.options[objTrigger.selectedIndex].value;			
		} else {
			infoTypeString += '&saleUnitCode=' + objTrigger.options[objTrigger.selectedIndex].value;
		}
	} else {
		infoTypeString += '&sortByName=true';
		keepPrevious = true;
	}
		
	$.post('queryingDB.do', infoTypeString, 
		function(data) {
			processAndFillData( data, objFillInStaffOmtDft, false, undefined, keepPrevious);
		}, "text");
};

function fillInWantedAuditor(deferredObj, sheetIdObj, domainName, auditType, extraMessage) {
	var contentHTML = '';
	
	switch (auditType) {
	case '订单价格审核':
		if (extraMessage != undefined) {
			contentHTML = '<span style="color:blue; font-style:italic">' + extraMessage + '</span><br/><br/>';
		} else {
			contentHTML = '<span style="color:blue; font-weight:bold">订单明细行没能全部通过系统自动价格审核!</span><br/><br/>';	
		}
		
		contentHTML += '您需要指定批准您执行此次价格的人员作为订单的价格审批人。<br/><br/>';
		break;
	case '转库审批':
		contentHTML = '<span style="color:blue; font-weight:bold">您选择的库存业务类型，需要进行审批！</span><br/><br/>';
		break;
	} 
	
	contentHTML += '<label for="ShangJiShenPiRen">请指定审批人：</label>'
		+ '<select name="ShangJiShenPiRen" class="formated-input ui-widget-content ui-corner-all baselength-input"></select>';

	$.post ('getQueryResult.do', 'infoType=上级审批人&engine=static', function(data) {
		if (ajaxTextProcessing(data) ==  null ) {
			deferredObj.reject();
			return deferredObj.promise();
		}
		confirmingDialog(contentHTML, '指定审批人', trueFunc, '就是他了');
		processAndFillData(data, '[name="ShangJiShenPiRen"]', false, false);
	},'text');

	var SQLAction = {};
	var actionRows = [];
	if (sheetIdObj != undefined) {
		SQLAction['action']='status';
		SQLAction['domainName']=domainName;
		SQLAction['status']='待审';
		SQLAction['dataStream']=JSON.stringify(sheetIdObj);
		actionRows.push(SQLAction);		
	}

	function trueFunc(){
		if (sheetIdObj !== undefined) {
			deferredObj['actionString'] = 'auditorCode=' + $('[name="ShangJiShenPiRen"]').val() + '&dataStream=' + JSON.stringify(actionRows);
			$.post('manipulating.do', 'auditorCode=' + $('[name="ShangJiShenPiRen"]').val() + '&dataStream=' + JSON.stringify(actionRows), 
					function(data){
				ajaxJsonErrorHandler(data);
				deferredObj.status = data.status;
				deferredObj.resolve();
				return deferredObj.promise();
			},'json');			
		} else {
			deferredObj.auditorCode = $('[name="ShangJiShenPiRen"]').val();												
			deferredObj.auditorName = $('[name="ShangJiShenPiRen"]').find("option:selected").text();												
			deferredObj.resolve();
			return deferredObj.promise();
		}
	}
}

/*
 * 向页面的指定元素内填充审批人的通用函数
 * 前提：	控件必须是select类型的，能够接受option子元素。
 * 输入:		参数1, String : 需要填入信息的jQuery选择器。
 * 			参数2， Integer : 查询审批人时开始查询的管理级别，本项参数主要用于应收款消帐审批等需要跳级审批的业务
 * 			参数3， Boolean ： 查询审批人是否包含同级别的人员，本项参数主要用于审批转移和上报的业务
 * 			参数4， Boolean : 填充时是否填充首选空白的开关量，省略时为false。
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2015-03-20
 * 
 */
function fillInCaiWuAuditors(strFillInElemSelector, blnAsyncDftF, blnLeftFirstBlankDftF) {
	if (blnLeftFirstBlankDftF === undefined) blnLeftFirstBlankDftF = false;
	if (blnAsyncDftF === undefined) blnAsyncDftF = false;
	var availableAuditors = 'OK~FALSE';

	$.ajax ({
		url:'getQueryResult.do',
		type:'POST',
		dataType:'text',
		cache: false,
		data: 'infoType=财务审批人&engine=static',
		async: blnAsyncDftF,
		success: function( data ) {
			if (ajaxTextProcessing(data) !=  null ) {
				availableAuditors = data;
			}
		},
	});
	if (strFillInElemSelector) {
		processAndFillData(availableAuditors, strFillInElemSelector, true, blnLeftFirstBlankDftF, false, true);		
	}
}

/*
* 向页面的指定元素内填充审批人的通用函数
* 前提：	控件必须是select类型的，能够接受option子元素。
* 输入:		参数1, String : 需要填入信息的jQuery选择器。
* 			参数2， Integer : 查询审批人时开始查询的管理级别，本项参数主要用于应收款消帐审批等需要跳级审批的业务
* 			参数3， Boolean ： 查询审批人是否包含同级别的人员，本项参数主要用于审批转移和上报的业务
* 			参数4， Boolean : 填充时是否填充首选空白的开关量，省略时为false。
* 出口：	返回调用点，继续执行后续语句
* 返回：	无
* 改进：	暂无
* 
* @author Harry
* @version 1.0 2015-03-20
* 
*/
function fillInAvailableAuditors(strFillInElemSelector, intKaiShiJiBie, blnBaoHanBenJi, blnLeftFirstBlankDftF, blnAsyncDftF) {
	if (blnLeftFirstBlankDftF === undefined) blnLeftFirstBlankDftF = false;
	if (blnAsyncDftF === undefined) blnAsyncDftF = false;
	var availableAuditors = 'OK~FALSE';
	var infoString = 'infoType=上级审批人&engine=static';
	if (intKaiShiJiBie != undefined) infoString += '&KaiShiJiBie=' + intKaiShiJiBie;
	if (blnBaoHanBenJi) infoString += '&TongJiBie=true';
	$.ajax ({
		url:'getQueryResult.do',
		type:'POST',
		dataType:'text',
		cache: false,
		data: infoString,
		async: blnAsyncDftF,
		success: function( data ) {
			if (ajaxTextProcessing(data) !=  null ) {
				availableAuditors = data;
			}
		},
	});
//	$.post ('getQueryResult.do', infoString, function(data) {
//		if (ajaxTextProcessing(data) !=  null ) {
//			availableAuditors = data;
//		}
//	},'text');		
	if (strFillInElemSelector) {
		processAndFillData(availableAuditors, strFillInElemSelector, true, blnLeftFirstBlankDftF);		
	}
}

/*
 * 向页面的class=theFillInClassName的select控件内填充的静态选项信息
 * 前提：	控件必须是select类型的，能够接受option子元素。
 * 输入:		参数1, String : 信息分类,如：销售组织、称谓、渠道伙伴类别等。
 * 			参数2， String : 需要填充的元素的ClassName
 * 			参数3， String ： 需要触发填充的关联元素的ClassName，目前主要用于
 * 							填充销售部门内的人员选项。参看程序内的注释。
 * 							如果没有关联填充需要，该参数使用空字符即可。
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	无
 * 其他:		在销售组织仅有一个选项时，可自动更新该销售组织对应的class=staff的select元素的员工选项内容。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 * 
 * 1.1 版本简述
 * 增加一个参数，在原参数1，参数2之间。是传入的数据源服务字段。修改最后一个参数为可选。
 * 
 * 1.2 版本简述
 * 1) 彻底修改了函数的参数系统：
 * 	strInfoTypeOpt:		【可省略】信息分类字符串，省略时，直接获取strSourceUrl指向的资源;
 *  strSourceUrl:		提供ajax服务的资源名;
 *  objFillInElems:	用于jquery操作的selector字符串，代表需填入options的元素
 *  blnFillInOptGroupDftF:	填入OPTION时是否加入分组信息的控制开关，true,false
 *  blnBlankFirstDftU:		是否在options前面预留空选项的控制开关，true,false
 *  blnKeepOriginal:	填入options时是否保留原值的控制开关，true,false
 *  blnHideElemWhenEmpty:	如果传入的元素的options内容为空，是否隐藏该元素的控制开关，true,false
 * 2) 取消了原来触发填充的机制，触发填充统一都由被填充单元的change事件函数完成。
 * 
 *  @author Harry
 *  @Version 1.2 2014-09-19
 */
function fillInStaticInfo(strInfoTypeOpt, strSourceUrl, objFillInElems, blnAsyncDftT,
		blnFillInOptGroupDftF, blnLeftBlankFirstDftU, blnKeepPrevValDftT, blnKeepOrgOptDftF, blnHideWhenEmptyDftF) {

	//处理strInfoTypeOpt省略的情况
	if (typeof objFillInElems == 'boolean') {
		blnHideWhenEmptyDftF = blnKeepOrgOptDftF;
		blnKeepOrgOptDftF = blnKeepPrevValDftT;
		blnKeepPrevValDftT = blnLeftBlankFirstDftU;
		blnLeftBlankFirstDftU = blnFillInOptGroupDftF;
		blnFillInOptGroupDftF = blnAsyncDftT;
		blnAsyncDftT = objFillInElems;
		objFillInElems = strSourceUrl;
		strSourceUrl = strInfoTypeOpt;
	}
	//如选择器没有选中元素，则退出函数
	if ($(objFillInElems).length == 0) return;
	
	//为开关量赋缺省值；
	//注意blnLeftBlankFirstDftU是没有缺省值的。
	if (blnAsyncDftT == undefined) blnAsyncDftT = true;
	if (blnFillInOptGroupDftF == undefined) blnFillInOptGroupDftF = false;
	if (blnKeepPrevValDftT == undefined) blnKeepPrevValDftT = true;
	if (blnKeepOrgOptDftF == undefined) blnKeepOrgOptDftF = false;
	if (blnHideWhenEmptyDftF == undefined) blnHideWhenEmptyDftF = false;
	
	//改为GET方式，是因为会通过文本文件提供部分选择信息。使用GET是为了更好的利用缓存。-----2014年3月21日Harry
	var ajaxType = 'GET';
	if (strInfoTypeOpt) {
		ajaxType = 'POST';
	}
	//async : true, 异步方式完成数据读取，以提供更好的体验
	//async : false, 同步方式完成数据读取，以提供更好的体验
	$.ajax({
		url : strSourceUrl,
		type : ajaxType,
		dataType : 'text',
		data: 'infoType=' + strInfoTypeOpt,
		async : blnAsyncDftT,
		success : function(data) {
			processAndFillData(data, objFillInElems, blnFillInOptGroupDftF, blnLeftBlankFirstDftU, blnKeepPrevValDftT, blnKeepOrgOptDftF, blnHideWhenEmptyDftF);
		},});
};

/*
 * 实际完成静态信息填充过程中ajax数据处理，并填入相关options的函数
 * 前提：	控件必须是select类型的，能够接受option子元素。
 * 			ajax返回数据只能使用本系统约定的text数据格式。
 * 输入:		参数1, jquery OBject : ajax调用的返回数据
 * 			参数2， String : 需要填充信息的元素的ClassName
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	正常：返回字符数组，为ajax调用的返回数据内容
 * 			异常：ajax调用错误或无数据时，返回空值。
 * 其他:		无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 * 
 * Ver 1.1 简述:
 * 1) 彻底修改了函数的参数系统：
 * 	strData:				需填入option的参数，格式为系统约定的ajax返回文本格式，正常填入的数据应以OK~TRUE~开头;
 *  strSelector:			用于jquery操作的selector字符串;
 *  blnFillInOptGroupDftF:	填入OPTION时是否加入分组信息的控制开关，true,false
 *  blnBlankFirstDftU:		是否在options前面预留空选项的控制开关，true,false
 *  blnKeepPrevValDftT:		填入options时是否保留原值的控制开关，true,false
 *  blnHideWhenEmptyDftF:	如果传入的元素的options内容为空，是否隐藏该元素的控制开关，true,false
 * 2) 取消了原来函数的返回值OPTIONS数组 
 *  
 * @author Harry
 * @version 1.1 2014-09-19
 * 
 * Ver 1.2 简述:
 * 1） 增加参数：
 * 	blnKeepOrgOptDftF:		布尔量，决定是否保留原来select的options，缺省为false;
 * 2） 如果要保留原来的otion，则新增的options插入到原来options之前；
 * 3）目的：完成两组不同数据来源的options拼接到一起，调用者来保证两组数据的不可重复性。
 *  
 * @author Harry
 * @version 1.2 2014-12-21
 * 
 * Ver 1.3 简述：
 * 1）修改原string类型参数 strSelector，为 objFillInElems：该参数可以是jQuery()函数能接受的任何合法对象
 * 
 * @author: Harry
 * @version 1.3: 2015-1-23
 * 
 * Ver 1.4 简述
 * 1） 	增加了检查填充前的原值与需要填充的值之间的重复关系：
 * 		如果两部分的val值相同，则删除原来的option，使用需要新填充的option作为有效option
 * 2）	这样做可能存在的问题：
 * 		假设先填入了完整的正确options，再通过fillElementsWithData函数填入数据表的数值，如果不经检查，可能导致
 * 		原来正确的option的text被不正确的覆盖，同时可能丢失mytag信息。因此在fillElementsWithData函数中增加了
 *		赋值val之前检查是否有同样val的option存在
 */
function processAndFillData(strData, objFillInElems, blnFillInOptGroupDftF, blnBlankFirstDftU, 
		blnKeepPrevValDftT, blnKeepOrgOptDftF, blnHideWhenEmptyDftF) {

	if (strData.indexOf('OK~FALSE') == -1 && strData.indexOf('OK~TRUE~') == -1 && strData) {
		strData = 'OK~TRUE~' + strData;
	}

	//确定布尔参数的缺省值
	//填入options开关：缺省为false，除非传入参数明确赋值为true；
	if (blnFillInOptGroupDftF === undefined) blnFillInOptGroupDftF = false;
	//保留element原赋值开关：缺省为true，除非传入参数明确赋值为false；
	if (blnKeepPrevValDftT === undefined) blnKeepPrevValDftT = true;
	if (blnKeepOrgOptDftF === undefined) blnKeepOrgOptDftF = false;
	//如没有填入项，是否隐藏元素的开关：缺省为false，除非传入参数明确赋值为true；
	if (blnHideWhenEmptyDftF === undefined) blnHideWhenEmptyDftF = false;
	
	var options = ajaxTextProcessing(strData); 	//需要新填入的option数据
	var selectElems = $(objFillInElems);		//所有满足条件的select元素
	if (options == false || options == null) {
		//按照是否隐藏元素的开关，隐藏元素。
		if (blnHideWhenEmptyDftF) {
			for (var i = 0; i < selectElems.length; i++) {
				if (selectElems[i].length == 0) $(selectElems[i]).hide();
			}
		}
		if (!blnKeepPrevValDftT) {
			selectElems.empty();
		}
		return;
	};
	
	//申明记录填充前状况的数组，每个数组的长度应与selectElems的长度严格一致，否则还原时可能张冠李戴
	//针对每个select元素，均保留其原来的value和text，以数组形式保存
	//针对每个select元素，均保留其原来的options的完整内容以及对应每个option的value，以数组形式保存
	var originalValue =[]; 	//记录每个select元素当前value的数组
	var originalText = [];	//记录每个select元素当前text的数组
	var orgOptions = [];	//记录原始optionHTML内容的数组
	var orgOptValues = [];	//记录原始option的value值的数组
	var orgPlaceHolder = ''; //记录原始placeholder的字符变量
	if (blnKeepPrevValDftT || blnKeepOrgOptDftF) {
		for (i = 0; i < selectElems.length; i++) {
			var orgOpts = $.trim(selectElems[i].innerHTML);
			//先根据options的内容确定需要记录的value值
			//如果select元素已经选中（包含选中options的value=""的占位符），则如实记录val和text
			if (selectElems[i].selectedIndex != -1) {
				originalValue.push(selectElems[i].value);
				originalText.push(selectElems[i].options[selectElems[i].selectedIndex].text);
				if (!selectElems[i].value) orgPlaceHolder = selectElems[i].options[selectElems[i].selectedIndex].text;
			} else {
				//否则以字符串null做为值便于后面的判断
				originalValue.push('null');
				originalText.push('null');
			}
			
			//select元素的起始options是否value=""的空值，如果是，则要将该option剔除，避免回填的时候重复填入value=""的option
			if (orgOpts.indexOf('<option value=""') == 0) {
				orgOpts= orgOpts.substring(orgOpts.indexOf('</option>') + 9, orgOpts.length);					
			}
			if (orgOpts) {
				var arrOrgOptVals = orgOpts.split('</option>');
				//split函数后，数组的最后一个成员多余的空值，并且比实际select的options数量多一个，因此需要删除
				//数组为空时，pop函数不改变数组，并返回undefined值，这里不关心返回值，仅使用删除数组最后一个成员的功能。
				arrOrgOptVals.pop();
				for (var j = 0; j < arrOrgOptVals.length; j++) {
					var val = arrOrgOptVals[j];
					val = val.substring(val.indexOf('value="') + 7, val.length);
					val = val.substring(0, val.indexOf('"'));
					arrOrgOptVals[j] = val;
				}
				orgOptValues.push(arrOrgOptVals.join(','));
				orgOptions.push(orgOpts);
			} else {
				//如果select元素原本没有options或者options仅含value=""的option，则以字符null作为options进行记录，避免后续填入无用的空option。
				orgOptValues.push('null');
				orgOptions.push('null');
			}
		}
	}
	
	//empty()是清除child elements。
	$(objFillInElems).empty();

	var optGroupLabel = '';
	var optionString = '';
	for (i = 0; i < options.length; i++) {
		var ops = options[i].split('^');
		var idxInOrgOpt = 0;
		//检测新填入的option是否与原来的option有重复，如果有，则删除原来的option
		for (j = 0; j < orgOptions.length; j++) {
			idxInOrgOpt = -1;
			if (orgOptValues[j]) {
				arrOrgOptVals = orgOptValues[j].split(',');
				idxInOrgOpt = $.inArray(ops[0],arrOrgOptVals);
			}
			if (idxInOrgOpt != -1) {
				var tmpOrgOpts = orgOptions[j].split('</option>');
				tmpOrgOpts.splice(idxInOrgOpt,1);
				orgOptions[j] = tmpOrgOpts.join('</option>');
			}
		}
		if (blnFillInOptGroupDftF) {
			//填入options分组信息，分组信息需形成在opt数组的第3位，如该位undefined或者该位和第2位内容一样，则不填入
			if (ops[2] != optGroupLabel && ops[2]) {
				if (optGroupLabel == '') {
					optionString = '<optgroup label="' + ops[2] + '">';
				} else {
					optionString += '</optgroup>';
					optionString += '<optgroup label="' + ops[2] + '">';					
				}
				optGroupLabel = ops[2];				
			}
		}
		if (ops.length==1) {
			optionString += '<option value="' + ops[0] + '">' + ops[0] + '</option>';
		} else if (ops.length == 3){
			optionString += '<option mytag="' +ops[2] + '" value="' + ops[0] + '">' + ops[1] + '</option>';				
		} else if (ops.length > 3){
			//增加对ops数组第4位之后信息的处理，处理方式为，将第4位之后的内容合并为一个字符串
			var strForMyTag1 = '';
			for (var x = 3; x <ops.length; x++) {
				strForMyTag1 += ops[x] + '~';
			}
			strForMyTag1 = strForMyTag1.substring(0, strForMyTag1.length - 1);
			optionString += '<option mytag1="' + strForMyTag1 + '" mytag="' +ops[2] + '" value="' + ops[0] + '">' + ops[1] + '</option>';				
		} else {
			//针对后台数据可能返回提示信息而不是用于选择的选项，进行特殊处理，将该option设置为不可选择工程
			//提示信息的标志为：value字段为NA
			if (ops[0] == 'NA' || ops[0] == 'na') {
				optionString += '<option disabled class="disabled-temporary" value="' + ops[0] + '">' + ops[1] + '</option>';								
			} else {
				optionString += '<option value="' + ops[0] + '">' + ops[1] + '</option>';				
			}
		}
	};
	
	for (i = 0; i < selectElems.length; i++) {
		var fillInOptions = optionString;
		if (blnKeepOrgOptDftF && orgOptions[i] != 'null') {
			fillInOptions =	orgOptions[i] + optionString;
		}
		selectElems[i].innerHTML = fillInOptions;
		var emptyValOpt = ''; //根据元素的class，判定空值option的内容
		if ($(selectElems[i]).hasClass('not-empty')) {
			if (orgPlaceHolder) {
				emptyValOpt = '<option value="" disabled selected style="display:none">' + orgPlaceHolder + '</option>';
			} else {
				emptyValOpt = '<option value="" disabled selected style="display:none">必选项</option>';
			}	  
		} else {
			if (orgPlaceHolder) {
				emptyValOpt = '<option value="">' + orgPlaceHolder + '</option>';
			} else {
				emptyValOpt = '<option value=""></option>';
			}	  			
		}
		// 根据传入参数，决定是否填入空值参数
		//填入条件：非空options的数量 >1 AND (强制填入空值option的参数未定义  OR )
		if ((blnBlankFirstDftU == undefined && $(selectElems[i]).find('option').length > 1) || blnBlankFirstDftU) {
			selectElems[i].innerHTML = emptyValOpt + selectElems[i].innerHTML;				
		}

		if (blnKeepPrevValDftT && originalValue.length > 0) {
			var oldValue = originalValue.shift();
			var oldText = originalText.shift();
			if (oldValue != 'null') {
				//原值为空字符，且原始记录了placeHoder字符的内容，则认为原select元素没有进行选择，保留了placeholder状态，
				//这是，检查placeholder占位的option是否填入，如果没有，则照原样插入占位option
				if (!oldValue && orgPlaceHolder && $(selectElems[i]).find('option[value=""]').length == 0) {
					selectElems[i].innerHTML = emptyValOpt + selectElems[i].innerHTML;
				//其他情况，则判断原始的选中value和text是否已经作为option插入，如果没有，则插入到options的最后位置
				} else if ($(selectElems[i]).find('option[value="' + oldValue + '"]').length == 0) {
					selectElems[i].innerHTML += "<option value=\"" + oldValue + "\">" + oldText + "</option>";
				}
				//如果原始选中有值，则仅填入原始值，不触发change事件
				selectElems[i].value = oldValue;
			} else {
				$(selectElems[i]).trigger('change');				
			}
		} else {
			$(selectElems[i]).trigger('change');
		}
		$(selectElems[i]).trigger('troggle-placeholder-color');				
	}
};

function safeFillSelectVal(strVal, objFillInElems) {
	if (!strVal) return;
	if (!objFillInElems) return;

	var selectElems = $(objFillInElems);
	var blnFoundSafeVal = false;
	for (var i = 0; i < selectElems.length; i++) {
		var opts = selectElems[i].innerHTML;
		if (opts.indexOf('value="' + strVal + '"') != -1) {
			blnFoundSafeVal = true;
			break;
		}
	}
	if (!blnFoundSafeVal) {
		var optionString = '<option value="' + strVal + '">' + strVal + '</option>';
		selectElems.html(selectElems.html() + optionString);
	}
	selectElems.val(strVal).trigger('change');
};

/*
 * 右键菜单初始化。
 * 前提：	无。
 * 输入:		参数1, String : 页面的标识：orderCenter=订单中心，dispatcherCenter=调度中心。
 * 			参数2， String : 右键菜单的宿主的selector字符串
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	无
 * 其他:		如果没有响应的右键菜单项，函数不进行提示。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-2-26
 * 
 * 1.1版本简述：
 * 配合右键菜单的分组方式，在分组间增加了分隔线。
 * 
 * @author Harry
 * @version 1.1 2014-3-1
 * 
 * 调用者：	1）order_query_results.jsp页面的初始化过程。
 * 			2）order_dispatching.jsp页面的初始化过程。
 */
function iniContextMenu(strSource, theAttacher, contextMode){
	$.ajax({
		url : 'getContextMenu.do',
		type : 'POST',
		dataType : 'text',
		data: 'source=' + strSource + '&contextMode=' + contextMode,
		cache : true,
		async : false,
		success : function( data ) {
			console.log(data);
			var menuItems = ajaxTextProcessing(data);
			if (menuItems==null) return;
			var menuFuncs={};
			var groupId = '00';
			var menuId = theAttacher.substring(1) + 'popupmenu';
			var contextMenuHTML = '	<div class="contextMenu" id="' + menuId + '" style="display: none"><ul>';
			for (var i = 0; i < menuItems.length; i++) {
				var menuItem = menuItems[i].split('^');
				var newGroupId = menuItem[3].substr(1,2);
				if (newGroupId != groupId) {
					if (groupId !='00') {
						contextMenuHTML += '<hr />';
					}
					groupId = newGroupId;
				}
				var menuItemId = menuItem[0].split(',')[0];
//				contextMenuHTML += '<li id="' + menuItem[0] + '">' + menuItem[1] + '</li>';
				contextMenuHTML += '<li id="' + menuItemId + '" workon="' + menuItem[4] + '" groupId="' + newGroupId + '">' + menuItem[1] + '</li>';
				menuFuncs[menuItemId] = new Function(menuItem[2]);
			}
			contextMenuHTML += '</ul></div>';
			$("body").append(contextMenuHTML);
			$(theAttacher).contextMenu(menuId, {
				bindings: menuFuncs, 
				menuStyle : {border : "2px solid blue", width: "10em"},
				itemStyle: {
					fontSize: '12px',
					lineHeight: "0.9em",
					border: 'none',
					padding: '5px'
				},
				itemHoverStyle: {
					color: 'yellow',
					backgroundColor: 'blue',
					border: 'none'
				},
				onShowMenu: function(event, menu){
					var rowId = $(theAttacher).jqGrid('getGridParam', 'selrow');
					var DingDanZhuangTai = $(theAttacher).jqGrid('getCell', rowId, 'DingDanZhuangTai');
					if (!DingDanZhuangTai) return menu;
					if ($(theAttacher).jqGrid('getCell', rowId, 'GuaQi') == '1') DingDanZhuangTai = '挂起';
					
					var menuItems = $('li', menu);
					for (var i = 0; i < menuItems.length; i++) {
						var menuWorkOn = menuItems[i].getAttribute('workon');
						if (menuWorkOn.indexOf(DingDanZhuangTai) == -1 && menuWorkOn != 'ALL') {
							$(menuItems[i]).remove();
						}
					}
					$('hr', menu).remove();
					menuItems = $('li', menu);
					var groupId = '00';
					for (var i = 0; i < menuItems.length; i++) {
						var newGroupId = menuItems[i].getAttribute('groupId');
						if (newGroupId != groupId) {
							if (groupId !='00' && i != menuItems.length -1) {
								$(menuItems[i]).before('<hr />');
							}
							groupId = newGroupId;
						}
					}
					return menu;
				}
			});
		},
	});
}

/*
 * 完成ajax文本格式返回数据的异常处理，如果正常返回数据，则去除状态信息后，以数组形式返回数据内容。
 * 前提：	ajax返回数据只能使用本系统约定的text数据格式。
 * 输入:		参数1, String : ajax调用的返回数据
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	正常：返回字符数组，为ajax调用的返回数据内容
 * 			异常：ajax调用错误时，进行错误内容提示，再返回false。
 * 其他:		本函数合并了原来的ajaxTextErrorHandler以及delAjaxTextStatus这两个函数的功能。
 * 			因此相应原来调用该两个函数的地方均需进行修改。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-1-27
 * 
 * 调用者：	1）函数：processAndFillData, mainTemplate包中的changePassword，resetPassword。
 * 			2）页面：marketing-event页面初始化部分，费用类别的读取，调用了本函数
 */
function ajaxTextProcessing(strData) {
	var data = $.trim(strData).split('~');
	if (data[0]=='RELOGIN') {
		var theMessage = '因某种原因，你已退出系统，需要重新登录才能继续使用！<br /><br />'
			+ '您可点击<strong>&quot;重新登录&quot;</strong>按键回到系统登录页面；<br /><br />'
			+ '或者，您可点击<strong>&quot;暂不登录&quot;</strong>按键，保留现在的页面，<br />'
			+ '&nbsp;&nbsp;&nbsp;以便复制、粘贴页面上已经输入的内容。';
		var falseFunc = function(){return;};
		confirmingDialog(theMessage, '登录过期', exitLogin, falseFunc, '重新登录', '暂不登录','alarm');
		return false;
	};
	if (data[0]=='ERROR') {
		if (data.length>1 && data[1]!='' ) {
			var errMsg = data[1].replace(/%/g,'<br/>');
			showupMessageInDialog(errMsg, '后台信息-请注意','wrong');			
		} else {
			showupMessageInDialog('访问数据库时发生错误，请联系系统管理员！', '请求助','wrong');			
		}
		return false;
	};
	if (data[0] == 'NOTALLOWED') {
		showupMessageInDialog('<br>无权限操作此功能！', '请知晓','wrong');
		return false;
	}
	if (data[0] != 'OK') {
		showupMessageInDialog('数据操作出现异常信息，请通知系统管理员处理！' + strData , '请通知','wrong');
		return false;
	}
	if (data[1]== 'FALSE') {
		return null;
	} else {
		if (data[2] == 'null') {
			return null;
		}
	}
	data.splice(0,2);
	return data;
};

/*
 * 完成系统约定格式的文本数组转换为对象的工作，通常用于将ajaxTextProcessing正常处理的二维数据转换为对象。
 * 前提：	传入参数必须遵循系统的文本格式约定，数组每条记录由"^"字符串联的字符串组成。
 * 输入:		参数1, array，字符串数组
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	返回js对象
 * 其他:		本函数仅将纵向维度<=2的数组返回为对象，纵向维度超过2的部分信息将丢失。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-18
 * 
 * 调用者：	1）函数：renyuan.js中填充多选销售组织，多选仓库部分。
 * 			2）
 */
function arrayToObj(theArray) {
	var tempData = {};
	for ( var i=0; i< theArray.length; i++) {
		var ops = theArray[i].split("^");
		if (ops.length==1) {
			tempData[ ops[0] ]= ops[0];
		} else {
			tempData[ ops[0] ]= ops[1];
		}
	};
	return tempData;
};
/*
 * ajax调用时json数据的统一异常处理程序。
 * 本函数不同于ajaxTextProcessing，没有对数据本身进行状态字段的去除，
 * 仅提供了一个统一的返回错误处理方式。
 * 前提：	无；
 * 输入:		1）参数1：jsonString, 查询的返回结果。
 * 出口：	1）调用本函数的页面
 * 返回：	无
 * 其他:		无
 * 改进：	
 * 
 * @author Harry
 * @version 1.0 
 * 
 * 调用者：	1）使用json格式的ajax交互完成后都可引用该函数。
 * 					
 */
function ajaxJsonErrorHandler(jsonData) {
	if (jsonData.status==='RELOGIN') {
		showupMessageInDialog(jsonData.message, '登录过期','wrong');			
		return false;
	} else if (jsonData.status=='ERROR') {
			showupMessageInDialog(jsonData.message, '请求助或重试','wrong');			
		return false;
	} else if (jsonData.status=='NODATA') {
		showupMessageInDialog('数据传输发生错误，请联系系统管理员！', '请求助','wrong');
		return false;
	} else if (jsonData.status=='NOPK') {
		showupMessageInDialog('更新时发生严重错误，请联系系统管理员！', '请通知','wrong');
		return false;
	} else if (jsonData.statue == 'NULL') {
		return null;
	} else if (jsonData.status !='OK') {
		showupMessageInDialog('返回状态：' + jsonData.status + 
				'<br><br>返回的数据格式错误，请联系系统管理员！', '请求助','wrong');
		return false;		
	} else {
		return true;		
	}
};

/*
 * 将页面element的name和value转换为name:value格式的js Object
 * 		jQuery的ajax函数支持以上形式的object作为post参数，
 * 		也支持 {name=name1,value=value1;name=name2,value=value2;....}形式的post参数
 * 		还支持 {name:value}[]数组形式的post参数。
 * 		但是，在jqgrid控件中，如果要实现分页显示，则只能使用第一种形式的参数格式。本函数就是因为这个目的而存在的。
 * 	
 * 前提：	无
 * 输入:		String或jQuery对象, 需要转换的元素所在的父容器或父容器选择器字符，用于限定转换的元素选择范围;
 * 出口：	维持在原页面
 * 返回：	js Object= {name1:value1,name2:value2,.....}
 * 改进：	暂无

 * @author Harry
 * @version 1.0 2013-12-24
 * 
 * 1.1 版本简述
 * 增加了对输入单元是否有value的判断，允许函数返回空对象
 * 
 * @author Harry
 * @version 1.1 2014-12-17
 * 
 * 1.2 版本简述
 * 增加了采集含数据信息的LABEL元素的值的功能。
 * 规则：字段名应作为LABEL的id，且LABEL元素应属于with-data类
 * 
 * @author Harry
 * @version 1.2 2015-10-09
 */
function serializeObject(objContext){
	objContext = iniContextObject(objContext);
	var inputElems = $('input,select,textarea',objContext).not('.ui-pg-input').not('.not-serialize');
	var returnObj = {};
	//对空字符，js在chrome和ie环境下的处理方式不同。
	//chrome下，obj的某个属性值为空，则这个属性在控制台不被打印，
	//而ie下，空值的属性仍然会在控制台打印出来，
	//但传递到后面程序时，仿佛两个平台是一样的，都没有空字符的属性。
	for (var i =0; i < inputElems.length; i++) {
		if (inputElems[i].type=='checkbox') {
			returnObj[inputElems[i].name]=inputElems[i].checked;
		} else {
			if (inputElems[i].value) {
				if ($(inputElems[i]).hasClass('percent')) {
					returnObj[inputElems[i].name] = inputElems[i].value/100;
				} else {
					returnObj[inputElems[i].name] = inputElems[i].value;
				}
			} else {
				returnObj[inputElems[i].name] = null;				
			}
		}
	}
	var notEditableElemsWithValue = $('.with-data',objContext);
	for (var i =0; i < notEditableElemsWithValue.length; i++) {
		if (notEditableElemsWithValue[i].innerHTML) {
			returnObj[notEditableElemsWithValue[i].id] = notEditableElemsWithValue[i].innerHTML;
		} else {
			returnObj[notEditableElemsWithValue[i].id] = null;			
		}
	}	
	return returnObj;
};

/*
 * 扫描页面输入元素，并完成扫描结果的json编码
 * 前提：	要扫描的页面元素必须放在form下。
 * 输入:		1）参数1：Object，可以是一个预置了内容的对象，本函数运行结果是在此对象上附加新的内容，
 * 					而不是重新建立一个新object
 * 			2）参数2：Boolean,	true=需扫描页面上class=grid的表格元素
 * 								false=跳过表格元素扫描。 
 * 出口：	1）调用本函数的页面
 * 返回：	json编码后的字符串
 * 其他:		如果扫描表格元素，则自动按照表格行从上到下的顺序，生成对象的HangHao属性。
 * 			约定：	表格元素内容作为对象的子对象，属性名为：第一个子对象=MingXiHang;
 * 					第二个子对象开始，MingXiHang后附加1开始的数字进行区别。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 * 
 * 1.1 版本简述：
 * 增加了一个控制项：排除class = not-serialize的元素，目的是减少传送的数据量，节省流量。
 * 增加了一个控制项：排除了class = ui-pg-input的元素，这个是grid中的页码单元的class
 * 增加了对元素类型的判断，解决checkbox传到后台是on.off的问题。
 * 
 * @author Harry
 * @version 1.1 2014-1-6
 * 
 * 1.2 版本简述：
 * 针对grid的数据，增加了对单元的classes的处理，即调用eliminateNotSerializingCells函数，排除不需传入后台的单元；
 * 增加了grid回写的步骤，使grid的数据与写入后台的数据完全一致。
 * 
 * @author Harry
 * @version 1.2 2014-6-2
 * 
 * 调用者：	1）页面：distributor.html的新增按键
 * 					business_companion.html的新增按键,
 * 					provider.html的新增按键
 * 					marketing_event.html的新增按键。
 * 					order.html的新增按键
 * 
 * 1.3 版本简述：
 * 1）	增加第三个参数，strContainerSelector，需要采集数据的elemeng所在容器的selector字符串。
 * 		用于限制数据采集的范围，避免页面复杂后的数据错乱。可省略
 * 2）	增加对输入参数的undefined情况下的保护
 * 3）	增加对值为空的数据单元的判别，此类数据单元不再进行采集
 * 
 * @author Harry
 * @version 1.3 2014-10-21
 * 
 * 1.4 版本简述：
 * 1）	去掉原来版本中的form父容器，暂时需观察对页面的影响
 * 
 * @author
 * @version 1.4 2014-12-28
 * 
 * 1.5 版本简述：
 * 1） 原参数blnIncludeGrid更改为blnIncludeGridDftF；
 * 2） 调整了输入参数的顺序，原第2参数blnIncludeGridDftF和第3参数objContainer交换位置
 * 3） 增加了第4个参数，blnWithSelectTextDftF，用以控制如果元素为select，是否同时将元素的显示text也进行编码
 * 4） 增加了对select元素的判断以及对该类元素显示文字的编码
 * 
 * @author Harry
 * @version 1.5 2016-03-30
 * 
 */
function objectToJson(theObj, objContainer, blnIncludeGridDftF, blnWithSelectTextDftF) {
	if (theObj === undefined) theObj = {};
	if (blnIncludeGridDftF === undefined) blnIncludeGridDftF = false;
	if (blnWithSelectTextDftF === undefined) blnWithSelectTextDftF = false;
	if (objContainer === undefined) {
		objContainer = $('body');
	} else {
		objContainer = $(objContainer);
	}
	var inputElems = objContainer.find('input, select, textarea, checkbox').not('.ui-pg-input')
		.not('.not-serialize, .not-serialize *');		
	var idOfMingXi = null;
	for (var i =0; i < inputElems.length; i++) {
		if (inputElems[i].type=='checkbox') {
			theObj[inputElems[i].name] = inputElems[i].checked;
		} else if (inputElems[i].value){
			if ($(inputElems[i]).hasClass('ten-thousand')) {
				theObj[inputElems[i].name] = inputElems[i].value*10000;
			} else if ($(inputElems[i]).hasClass('percent')) {
				theObj[inputElems[i].name] = inputElems[i].value/100;				
			} else {
				theObj[inputElems[i].name] = inputElems[i].value;				
			}
			if (inputElems[i].type == 'select-one' && blnWithSelectTextDftF) {
				theObj[inputElems[i].name + '-SelectedText'] = inputElems[i].options[inputElems[i].selectedIndex].text;
			}
		}
	};
	//根据传入参数，决定是否要关联MingXiHang.
	//如果页面中有多个grid，那么它们在数组中的顺序是按照页面的解析顺序，从左到右，从上到下排列的。
	//这点上其实还可以改进为按照每个grid的id来定义obj属性（见下），但是需要与后台服务就命名进行约定。
	//		----Harry 2014-1-1
	//为兼容原来的定单明细行传输命名约定，对多个明细表的情况，补充约定为：
	//第一条明细：obj属性为’MingXiHang'; 第二条明细开始：obj属性约定为‘MingXiHang1',等等。
	if (blnIncludeGridDftF) {
		var k = objContainer.find('.grid');
		for (var j=0; j < k.length; j++) { 
			//变量k中的每个元素，在遍历是已经不再是jquery的selector对象，而是javascrit的dom对象了。
			//因此需要对这些元素进行再次的选中$(k[j])。
			var objDetail = eliminateNotSerializingCells($(k[j]));
			if (objDetail.length!=0) {
				for (i = 0; i < objDetail.length; i++) {objDetail[i].HangHao = i+1;};			
				idOfMingXi = 'MingXiHang';
				if (j != 0) {
					idOfMingXi = 'MingXiHang' + j;
				};
				theObj[idOfMingXi] = objDetail;
			};
			$(k[j]).setGridParam({data:objDetail}).trigger('reloadGrid');
		};		
	};
	if ($.isEmptyObject(theObj)) {
		return '';
	} else {
		return JSON.stringify(theObj);	//转换json输出。		
	}
};

/*
 * 将js OBJECT转换成post或get参数的格式
 * 前提：	无。
 * 输入:		1）参数1：Object，要转换的对象 
 * 出口：	1）调用本函数的页面
 * 返回：	参数格式的字符串
 * 其他:		无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-12-28 
 */
function objectToParameters(theObj) {
	if ($.isEmptyObject(theObj)) return '';
	var returnString = '';
	for (var Title in theObj) {
		if (theObj[Title]) {
			returnString += '&' + Title + '=' + theObj[Title];
		}
	}
	returnString = returnString.substring(1);
	return returnString;
};

/*
 * 扫描指定的jqgrid元素，并完成扫描结果的json编码
 * 前提：	无；
 * 输入:		1）参数1：jquery对象，指定的jqGrid元素，
 * 			2）参数2：String, 本表格元素对应的主表PK字段名
 * 			3）参数3：String, 本表格元素对应的主表PK的值 
 * 出口：	1）调用本函数的页面
 * 返回：	json编码后的字符串
 * 其他:		如果扫描表格元素，则自动按照表格行从上到下的顺序，生成对象的HangHao属性。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 * 
 * 调用者：	1）页面：	marketing_event.html的新增、修改按键。
 */
function gridToJson (theGrid, theIDname, theIDvalue) {
	if (theGrid.length >0) {
		var obj = theGrid.getRowData();
		if (obj.length!=0) {
			for (var i = 0; i < obj.length; i++) {
				obj[i][theIDname]=theIDvalue;
				obj[i].HangHao = i+1;
			} 
			return JSON.stringify(obj);
		}
	};
	return false;
};

//center the caption of grid.
function centerCaptionOfGrid(){
	var theGrid = $('.grid');
	for (var i = 0; i < theGrid.length; i++) {
		$(theGrid[i]).closest("div.ui-jqgrid-view")
		.children("div.ui-jqgrid-titlebar")
		.css("text-align", "center")
		.children("span.ui-jqgrid-title")
		.css("float", "none");		
	}
};

/*
 * 阻止鼠标连击的通用程序
 *
 * 前提：	无；
 * 
 * 输入:		1）参数1：boolean，	true=disable控件
 * 								false = enable控件，
 * 返回：	true：完成了控件的enable或disable；
 * 			false：试图disable已经关闭的控件时，返回false
 * 其他:		无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2016-03-12
 * 
 */
function preventingUnpurposeClick(blnSealOrOpen, blnShowMsg){
	if (blnSealOrOpen === undefined) blnSealOrOpen = false;
	if (blnShowMsg === undefined) blnShowMsg = false;
	if (blnSealOrOpen) {
		if ($.isWindow(this)) {
			if (this.event.currentTarget.disabled) {
				if (blnShowMsg) {
					showupMessageInDialog('系统检测到您的鼠标发生连击了，可能造成系统数据的重复记录！<br/>建议您尽快修理或更换鼠标。', 
						'连击提示');
				}
				return false;
			}
			this.event.currentTarget.disabled = true;
		} else {
			if ($(this).prop('disable')) {
				if (blnShowMsg) {
					showupMessageInDialog('系统检测到您的鼠标发生连击了，可能造成系统数据的重复记录！<br/>建议您尽快修理或更换鼠标。', 
						'连击提示');
				}
				return false;
			}
			$(this).prop('disabled', true);
		}
	} else {
		if ($.isWindow(this)) {
			this.event.currentTarget.disabled = false;
		} else {
			$(this).prop('disabled', false);
		}		
	}
	return true;
}

function checkValidation(objContext) {
	if (!notEmptyCheck(objContext)) return false;
	if (!notGroupFillins(objContext)) return false;
	if (!noSpecialCharacterCheck(objContext)) return false;
	if (!mobilNoCheck(objContext)) return false;
	if (!teleNoCheck(objContext)) return false;
	if (!QQCheck(objContext)) return false;
	if (!emailCheck(objContext)) return false;
	if (!idNoCheck(objContext)) return false;
	if (!dateCheck(objContext)) return false;
	if (!moneyCheck(objContext)) return false;
	if (!noNegativeNumberCheck(objContext)) return false;
	if (!integerCheck(objContext)) return false;
	if (!isNumCheck(objContext)) return false;
	if (!noWhiteSpaceCheck(objContext)) return false;
	if (!notZeroCheck(objContext)) return false;
	if (!percentNumberCheck(objContext)) return false;
	if (!autoCompleteCheck(objContext)) return false;
	return true;
};

/*
 * 检查autoComplete控件输入合法性的通用程序，支持：
 *  1）一个名称元素对应一个id元素的情况。
 *	2）一组名称元素对应一个id元素的情况。
 *
 * 前提：	总体限制条件：名称元素必须有一个对应的label，通过for和name进行关联;
 * 			第一种情况时：两类控件应是相邻的兄弟，中间不能间隔其他的autoComplete名称或id元素；
 * 			第二种情况时：父容器中，不能有其他的autoComplete控件；
 * 
 * 输入:		1）参数1：string，父容器的选择字符，
 * 出口：	1）调用本函数的页面
 * 返回：	true：如果autoComplete的输入均合法；
 * 			false：如果输入不合法
 * 其他:		对于不加入合法性检查的autoComplete控件对：
 * 			1）名称元素需加入class名autocomplete-no-validation；
 * 			2）id元素需去掉class名autocomplete-id
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-12-17
 * 
 */
function autoCompleteCheck(objContext) {
	objContext = iniContextObject(objContext);
	var autoCompleteTextElems = $('.autocomplete', objContext).not('.autocomplete-no-validation');
	var autoCompleteIdElems = $('.autocomplete-id', objContext).not('.autocomplete-no-validation');
	if (autoCompleteIdElems.length == 0) {
		if (autoCompleteTextElems.length == 0) {
			return true;
		} else {
			showupMessageInDialog('autoComplete检查：没有找到id元素，请检查程序！', '函数调用错误', 'wrong');
			return false;
		}
	}
	if (autoCompleteTextElems.length != autoCompleteIdElems.length && autoCompleteIdElems.length != 1) {
		showupMessageInDialog('autoComplete检查：id元素和text元素数量不匹配，请检查程序！', '函数调用错误', 'wrong');
		return false;
	}
	if (autoCompleteIdElems.length == 1) {
		if (!autoCompleteIdElems[0].value) {
			for (var i = 0; i < autoCompleteTextElems.length; i++){
				if ($(autoCompleteTextElems[i]).is(':visible') && autoCompleteTextElems[i].value) {
					showupHelpMessage(autoCompleteTextElems[i], '只能从查询出的下拉选项中选择，不能自行输入！');								
					return false;
				}
			}
		}
	} else {
		for (var i= 0; i < autoCompleteTextElems.length; i++) {
			if (!autoCompleteIdElems[i].value && autoCompleteTextElems[i].value && $(autoCompleteTextElems[i]).is(':visible')) {
				showupHelpMessage(autoCompleteTextElems[i], '只能从查询出的下拉选项中选择，不能自行输入！');								
				return false;
			} 
		}					
	}
	return true;
};

function notEmptyCheck(objContext) {
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var notEmptyElems = $(".not-empty:enabled", objContext);
	for (var i =0; i < notEmptyElems.length; i++) {
		if (notEmptyElems[i].value=='' && $(notEmptyElems[i]).is(':visible')) {
			showupHelpMessage(notEmptyElems[i], '的内容必须录入，请补充！');
			return false;
		}
	}
	return true;
};

function notGroupFillins(objContext) {
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var groupFillinElems = $(".group-fillins:enabled", objContext);
	var alreadyFillinCount = 0, notFillinCount = 0;
	var fillinsCaption = '';
	for (var i =0; i < groupFillinElems.length; i++) {
		if ($(groupFillinElems[i]).is(':visible')) {
			if (!groupFillinElems[i].value) {
				notFillinCount ++;
			} else {
				alreadyFillinCount ++;
			}
			var captionElem = $(groupFillinElems[i]).prev('label');
			fillinsCaption += captionElem.html().replace(/:/g,'') + '、';
			fillinsCaption = fillinsCaption.replace(/：/g,'');
		}
		
	}
	fillinsCaption = fillinsCaption.substring(0, fillinsCaption.length - 1);
	if (notFillinCount && alreadyFillinCount) {
		showupHelpMessage(groupFillinElems[0], fillinsCaption + '的内容要么全部填入，要么全部都不填，请改正！', false);
		return false;		
	} else {
		return true;
	}
};

function noSpecialCharacterCheck(objContext) {
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var noSpecials = $("input:enabled,textarea:enabled",objContext);
	for (var i = 0; i < noSpecials.length; i++) {
		noSpecials[i].value = noSpecials[i].value.replace(/%/g, '％'); 
		noSpecials[i].value = $.trim(noSpecials[i].value); 
		if ($(noSpecials[i]).hasClass('autocomplete') 
				&& !$(noSpecials[i]).hasClass('autocomplete-no-validation')) continue;
		if (noSpecials[i].value !='' && $(noSpecials[i]).is(':visible')) {
			//正则表达式使用不熟练，暂时放弃，只检查单引号,%,&,\
//			if(!/^((?![\\/\^']).)*$/.test(noSpecials[i].value)){
//			if(!/[^\s\^']/.test(noSpecials[i].value)){
			if(noSpecials[i].value.indexOf("'") != -1 || noSpecials[i].value.indexOf("\\") != -1 || 
					noSpecials[i].value.indexOf("&") != -1 || noSpecials[i].value.indexOf("^") != -1 || 
					noSpecials[i].value.indexOf("【") != -1 || noSpecials[i].value.indexOf("】") != -1 || 
					noSpecials[i].value.indexOf("~") != -1 || noSpecials[i].value.indexOf("%") != -1) {
				showupHelpMessage(noSpecials[i], '内容不能包含 "单引号\'"、"与符号&"、"幂符号^"、"连字符~"、'
						+ '"反斜杠\\\"、"书名号【】"，请检查并改正！');
				return false;
			}
		}
	}
	return true;
};

function noSpecialCharValidationInGrid(value, colname){
	if(value.indexOf("'") != -1 || value.indexOf("%") != -1 || 
			value.indexOf("&") != -1 || value.indexOf("^") != -1 || 
			value.indexOf("【") != -1 || value.indexOf("】") != -1 || 
			value.indexOf("~") != -1 || value.indexOf("\\") != -1) {
		return [false, "\"" + colname + '的录入内容不能包含 "单引号\'"、"与符号&"、"幂符号^"、"连字符~"、'
		        + '"反斜杠\\\"、"书名号【】"、"半角百分号%"，请检查并改正！'];
	}
	return [true,''];
};

function teleNoCheck(objContext) {
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var teleNos = $(".tele-number:enabled", objContext);
	for (var i = 0; i < teleNos.length; i++) {
		if (teleNos[i].value!='' && $(teleNos[i]).is(':visible')) {
			//检查电话号码的正则表达式，兼容11位手机号码，
			if(!/^\(?0\d{2}[) -]?\d{6,8}$|^\(?0\d{3}[) -]?\d{6,8}$|^[6 8]\d{7}$|^1\d{10}$/.test(teleNos[i].value)){
				showupHelpMessage(teleNos[i], "的录入内容不是正确的座机或手机号码格式，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

function mobilNoCheck(objContext) {
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var mobilNos = $(".mobil-number:enabled", objContext);
	for (var i = 0; i < mobilNos.length; i++) {
		if (mobilNos[i].value != '' && $(mobilNos[i]).is(':visible')) {
			//检查11位手机号码，
			if(!/^1\d{10}$/.test(mobilNos[i].value)){
				showupHelpMessage(mobilNos[i], "的录入内容不是正确的手机号码格式，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

function emailCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var emails = $(".email:enabled", objContext);
	for (var i = 0; i < emails.length; i++) {
		if (emails[i].value != '' && $(emails[i]).is(':visible')) {
			emails[i].value = emails[i].value.replace(/，/g,',');
			var emailList = (emails[i].value).split(',');
			//检查email地址格式，
			for (var j = 0; j < emailList.length; j++) {
				if(!/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(emailList[j])){
					showupHelpMessage(emails[i], "的录入内容不是正确的email地址格式，请检查改正！");
					return false;
				}
			}
		}
	}
	return true;
};

function QQCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var QQs = $(".QQ:enabled", objContext);
	for (var i = 0; i < QQs.length; i++) {
		if (QQs[i].value != '' && $(QQs[i]).is(':visible')) {
			//检查email地址格式，
			if(!/^\d{5,12}$/.test(QQs[i].value)){
				showupHelpMessage(QQs[i], "的录入内容不是正确的QQ号码格式，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

function idNoCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var idNos = $(".id-number:enabled", objContext);
	for (var i = 0; i < idNos.length; i++) {
		if (idNos[i].value != '' && $(idNos[i]).is(':visible')) {
			//检查身份证格式，
			if(!/^\d{17}([0-9]|X)$/.test(idNos[i].value)){
				showupHelpMessage(idNos[i], "的录入内容不是正确的身份证格式，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

function dateCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var dates = $(".date:enabled, date-picker-elem:enabled", objContext);
	for (var i = 0; i < dates.length; i++) {
		if (dates[i].value != '' && $(dates[i]).is(':visible')) {
			//日期格式检查，
			if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(dates[i].value)){
				showupHelpMessage(dates[i], "的录入内容不是正确的日期格式，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

/*
 * 检查指定范围内的金额输入单元的格式正确性。
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2013-12-28
 * 
 * 1.1版本简述：
 * 排除了对单元值为0的检查，因为现数据编辑时，后台返回数据如果金额为空，页面上填的是0。
 * 需排除这个情况。
 * 
 * @author Harry
 * @version 1.1 2014-1-8
 * 
 * 1.2版本简述：
 * 修改了正则表打式，包含了0.1以及1.1这样的输入金额。
 * 允许负金额输入。
 * 
 * @author Harry
 * #version 1.2 2014-3-13
 * 
 * 调用者：	1）页面：几乎所有页面保存时都调用。
 */
function moneyCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var moneys = $(".money:enabled", objContext);
	for (var i = 0; i < moneys.length; i++) {
		//content-label会用money这个class来触发加入货币符号，因此，判断时需判处这种情况 -- Harry 2014-12-26
		if (moneys[i].tagName != 'LABEL' && moneys[i].value && $(moneys[i]).is(':visible')) {
			moneys[i].value = moneys[i].value.replace(/\s/g,'');
			//金额输入格式检查。
			if(!/^-?[1-9]\d*$|^-?[1-9]\d*\.\d{1,2}$|^-?0.\d{1,2}$|^-?0$/.test(moneys[i].value)){
				showupHelpMessage(moneys[i], "的金额输入格式不正确，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

/*
 * 检查指定范围内的输入单元的正负正确性。
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-3-2
 * 
 * 1.1版本简述
 * 增加了对非数字的检测。
 * 
 * @author Harry
 * @version 1.1 2014-6-10
 * 
 * 调用者：	1）order.js包中订单保存函数。
 */
function noNegativeNumberCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var noNegatives = $(".not-negative:enabled", objContext);
	for (var i = 0; i < noNegatives.length; i++) {
		if (noNegatives[i].value == '' || !$(noNegatives[i]).is(':visible')) continue;
		noNegatives[i].value = noNegatives[i].value.replace(/\s/g,'');
		if (isNaN(parseFloat(noNegatives[i].value))) {
			showupHelpMessage(noNegatives[i], "的录入内容必须为数字，请检查改正！");
			return false;			
		}
		if (parseFloat(noNegatives[i].value) < 0 ) {
			showupHelpMessage(noNegatives[i], "的录入内容不允许为负数，请检查改正！");
			return false;
		}
	}
	return true;
};

/*
 * 检查指定范围内的无小数点数量输入单元的格式正确性。
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-1-18
 * 
 * 
 * 调用者：	1）页面：	marketing_event.html的新增、修改按键。
 * 					order.html页面的新增、保存按键。
 */
function integerCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var integer = $(".integer:enabled", objContext);
	for (var i = 0; i < integer.length; i++) {
		if (integer[i].value != '' && integer[i].value!='0' && $(integer[i]).is(':visible')) {
			integer[i].value = integer[i].value.replace(/\s/g,'');
			//金额输入格式检查。
			if(!/^-?[1-9]\d*$/.test(integer[i].value)){
				showupHelpMessage(integer[i], "只能输入整数，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

/*
 * 检查指定范围内的无小数点数量输入单元的格式正确性。
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-1-18
 * 
 * 
 * 调用者：	1）页面：	marketing_event.html的新增、修改按键。
 * 					order.html页面的新增、保存按键。
 */
function noWhiteSpaceCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var noWS = $(".no-whitespace:enabled", objContext);
	for (var i = 0; i < noWS.length; i++) {
		if (noWS[i].value && $(noWS[i]).is(':visible')) {
			//金额输入格式检查。
			if(/\s/.test(noWS[i].value)){
				showupHelpMessage(noWS[i], '不允许输入非显示字符，例如"空格"等，请检查改正！');
				return false;
			}
		}
	}
	return true;
};

/*
 * 检查指定范围内的输入单元的是否数字型。
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	一些特殊数字表达法未考虑过滤，0xab，000.00，-11
 *          考虑用正则表达式
 * @author 
 * @version 1.0 
 * 
 * 
 * 调用者：	1）页面：系列设置、货物设置	页面的新增、保存按键。
 * 					
 */
function isNumCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var inputs = $(".number:enabled", objContext);
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].value != '' && $(inputs[i]).is(':visible')) {
			//数字输入格式检查。
			if(isNaN(inputs[i].value)  ){
				showupHelpMessage(inputs[i], "必须为数字，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

/*
 * 检查指定范围内的输入单元的必须为数字型，且不能为0。
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	一些特殊数字表达法未考虑过滤，0xab，-11
 *          考虑用正则表达式
 * 
 * @author 
 * @version 1.0 
 * 
 * 
 * 调用者：	1）页面：系列设置、货物设置	页面的新增、保存按键。
 * 					
 */
function notZeroCheck(objContext){
	objContext = iniContextObject(objContext);
	clearupHelpMessage();
	var inputs = $(".not-zero:enabled", objContext);
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].value != '' && $(inputs[i]).is(':visible')) {
			//非零数字输入格式检查。
			if(isNaN(inputs[i].value) || parseFloat(inputs[i].value,10)==0 ){
				showupHelpMessage(inputs[i], "必须为数字，且不允许为零，请检查改正！");
				return false;
			}
		}
	}
	return true;
};

/*
 * 检查指定范围内的输入单元的必须为0-100之间的浮点数。
 * 页面元素如果有percent类，则均代表去除'%'后的百分数，取值在0-100之间
 * 前提：	无；
 * 输入:		1）参数1：String, 指定的检查范围的父元素标记，可以是任何合法的selector字符。
 * 出口：	1）调用本函数的页面
 * 返回：	true:检查通过。
 * 			false:检查有误，同时改变有错误单元的颜色，并给出提示
 * 其他:		无
 * 改进：	检查方法繁琐，考虑用正则表达式
 * 
 * @author 
 * @version 1.0 
 * 
 * 
 * 调用者：	1）页面：系列设置、货物设置	页面的新增、保存按键。
 * 					
 */
function percentNumberCheck(objContext) {
	objContext = iniContextObject(objContext);
    clearupHelpMessage();
    var percentNumber = objContext.find(".percent");
    for (var i = 0; i < percentNumber.length; i++) {
   		var testVal = parseFloat(percentNumber[i].value);
   		if (testVal) {
   			if (!isNaN(testVal)) {
   				percentNumber[i].value = Math.round(testVal * 100) /100;
   				if (testVal < -100 || testVal > 100) {
   					showupHelpMessage(percentNumber[i], "百分比数值应该是0-100之间，请检查改正！");
   					return false;
   				}
   			} else {
   				showupHelpMessage(percentNumber[i], "百分比的输入应为数字，请检查改正！");
   				return false;    			    		
   			}   			
   		}
    }
    return true;
};

function addNewOrClose(theMessage){
	var dialogBody = document.createElement('div');
	var htmlContent = '<div id="icon" class="inline question" style="margin:0.5em; vertical-align:top">'
			+ '</div><div id="content" class="inline" style="margin:1em">'
			+ theMessage + '</div><p style="text-align:center;font-weight:bold">'
			+ '<i>继续录入新纪录，还是关闭窗口退出？</i></p>';
	dialogBody.innerHTML = htmlContent;
	document.body.appendChild(dialogBody);
	$(dialogBody).dialog({
		title: '请告诉我下一步做什么',
		buttons: {
	    	"继续录入新单": function() {
	    		prepareForNewSheet();
	    		closeDialog(this);
	    	},
	    	"返回编辑": function() {
	    		reviseCurrentSheet();
	    		closeDialog(this);
			},
			"关闭新增页面" :	function() {
	    		$(this).dialog('destroy');
	    		//直接用focus，IE下没问题，CHORME下不起作用，暂时先这么用，如果流量高了，考虑取消。
		    	//回到调用该窗口的页面
	    		if (window.opener) {
	    			window.open('',window.opener.name);
	    			window.opener.focus();	    			
	    		}
	    		//关闭窗口
		 		window.close();
	    	}
		}
	});
};

function closeWindow(theString){
	var htmlContent, dialogTitle;
	if (theString=='') {
		window.open('',window.opener.name);
		window.close();
		return true;
	};
	
	var closeConfirmationDialog = document.createElement('div');
	closeConfirmationDialog.innerHTML='<div id="icon" class="inline" '
		+ 'style="margin:0.5em; vertical-align:top">'
		+ '</div><div id="content" class="inline" style="margin:1em"></div>';;
		$(closeConfirmationDialog).addClass='dialog-body';
		document.body.appendChild(closeConfirmationDialog);
	if (theString != undefined && theString === 'exitLogin') {
		htmlContent = '点击<strong>&quot;确认&quot;</strong>按键，退出系统登录；<br />'
			+ '<br /> 如果您是误操作，请点击<strong>&quot;返回&quot;</strong>。';
		dialogTitle='确认退出系统';
		$(closeConfirmationDialog).children('#icon').addClass('alarm');				
	} else {
		htmlContent = '点击<strong>&quot;确认&quot;</strong>关闭本窗口；<br />' +
			'<br /> 如果您是误操作，请点击<strong>&quot;返回&quot;</strong>。';
		dialogTitle='确认关闭窗口';
		$(closeConfirmationDialog).children('#icon').addClass('question');		
	};

	$(closeConfirmationDialog).children('#content').html(htmlContent);
	$(closeConfirmationDialog).dialog({
		title: dialogTitle,
	   	autoOpen : true,
		height: 'auto',
		width: 330,
		buttons: {
	 		"确认" :	function() {
	    		if (theString === 'exitLogin') {
	    			//用异步方式通知服务器，清除登录信息。解决有时会弹出新窗口的问题。
	    			exitLogin();
	    		} else {
//		    		直接用focus，IE下没问题，CHORME下不起作用，暂时先这么用，如果流量高了，考虑取消。
	    			if (window.opener) {
	    				window.open('',window.opener.name);
	    				window.opener.focus();	    				
	    			}
		 			window.close();	 
	 			
		 			closeDialog(this);
	    		}
	    	},				
	    	"返回": function() {
	    		closeDialog(this);
			}
		}
	});
};

function exitLogin(){
//	saveDeskConfig();
	$.ajax ({
		url : 'exitLogin.do',
		data : 'windowname='+ window.name,
		type : 'POST',
		async : true,
		success : function( data ) {
		},
	});
//	window.close();
	window.open('login.jsp', 'LoginOfPlusyoouSMIS');			
};

function showupMessageInDialog(strMessage, strTitle, blnCloseWindowOpt, strIconType){
	//做了一个可省略的参数。
	var dialogBox = document.createElement('div');
	document.body.appendChild(dialogBox);
	$(dialogBox).addClass('dialog-body');
	$(dialogBox).html('<div id="icon" class="inline" style="margin:0.5em; vertical-align:top">'
		+ '</div><div id="content" class="inline" style="margin:1em"></div>');
	$(dialogBox).children('#content').append(strMessage).css('line-height','1.8');;
	if (typeof blnCloseWindowOpt !== 'boolean' && typeof blnCloseWindowOpt === 'string') strIconType = blnCloseWindowOpt;
	if (strIconType != undefined) {
		$(dialogBox).children('#icon').addClass(strIconType);
	} else {
		$(dialogBox).children('#icon').addClass('information');		
	}
	standardizingUI(dialogBox);
	
	$(dialogBox).dialog ({
		title : strTitle,
		autoOpen : true,
		resizable : false,
		height : 'auto',
		width : 'auto',
		modal : true,
		buttons: {
			"好的" : function() { 
				closeDialog(this);
				if (blnCloseWindowOpt != undefined && typeof blnCloseWindowOpt !== 'string' && blnCloseWindowOpt) {
		    		if (window.opener) {
		    			window.open('',window.opener.name);
		    			window.opener.focus();		    			
		    		}
		 			window.close();	
				}
			}
		},
	});
};

function confirmingDialog(strMessage, strTitle, funcForTrue, funcForfFalseOpt, strForTrue, strForFalseOpt, strIconTypeOpt){
	//函数的参数增加了Opt后缀，代表可选的参数；
	//以下首先将参数名规范成内部的参数名。
	var falseFunc, falseString, infType;
	if (typeof funcForfFalseOpt != 'function' && typeof funcForfFalseOpt == 'string') {
		if (typeof strForTrue == 'string') {
			infType = strForTrue;
		} else {
			infType = undefined;
		}
		strForTrue = funcForfFalseOpt;
		falseFunc = undefined;
		falseString = undefined;
	} else {
		falseFunc = funcForfFalseOpt;
		falseString = strForFalseOpt;
		infType = strIconTypeOpt;
	}
	
	var dialogBox = document.createElement('div');
	document.body.appendChild(dialogBox);
	dialogBox.setAttribute('id', 'confirmingDialog');
	$(dialogBox).addClass('dialog-body').css('line-height','1.6rem');
	$(dialogBox).html('<div id="icon" class="inline" style="margin:0.5em; vertical-align:top">'
		+ '</div><div id="content" class="inline" style="margin:1em"></div>');
	$(dialogBox).children('#content').append(strMessage).css('line-height','1.8');
	
	var selects = $('#content select');
	if (selects.hasClass('sale-unit')) {
		fillInSaleUnit();
	}
	if (typeof infType != 'undefined') {
		$(dialogBox).children('#icon').addClass(infType);
	} else {
		$(dialogBox).children('#icon').addClass('question');		
	}
	
	$(dialogBox).dialog ({
		title : strTitle,
	});

	var buttons =[{
			text: strForTrue, 
			click : function() { 
				if (typeof funcForTrue == 'function') {
					if (!checkValidation(dialogBox)) return false;
					funcForTrue();
					closeDialog(this);
				};
			},
		}];
	if (falseFunc!=undefined && falseString != undefined) {
		//false按键增加在后面，使用push；如果在前面增加按键，使用unshift
		buttons.push({
			text: falseString,
			click : function(){
				if (typeof falseFunc == 'function') {
					falseFunc();
					closeDialog(this);
				};
			}
		});		
	}
	$(dialogBox).dialog('option','buttons', buttons);
}

/*
 * 弹出确认窗口，等待数据输入或行为确认的通用函数
 * 前提：	无
 * 输入:		1）参数1：Deferred Object，必须为deferred， 不可省略
 * 			2）参数2：显示的页面内容，接受所有合法的html语句
 * 			3）参数3：弹出窗口的标题文字
 * 			4）参数4：true按键的文字
 * 			5）参数5：false按键的文字，为空或undefined时，隐藏false按键
 * 			6）参数6：窗口图标的标识文字，为空时，缺省question图标，为none时，省略图标
 * 出口：	1）调用本函数的页面
 * 返回：	deferred object，包含comments属性，为窗口可输入单位名字+值的json编码字符串
 * 其他:		弹出窗口的id=confirmingDialog，不可更改。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-10-21
 */
function confirmingDialogWithDf(deferredObj, strMessage, strTitle, strForTrue, strForFalseOpt, strIconTypeDft){
	var dialogBox = document.createElement('div');
	document.body.appendChild(dialogBox);
	dialogBox.id='confirmingDialog';
	$(dialogBox).addClass('dialog-body').css('line-height','1.6rem');
	$(dialogBox).html('<div id="icon" class="inline" style="margin:0.5em; vertical-align:top">'
			+ '</div><div id="content" class="inline" style="margin:1em"></div>');
	$(dialogBox).children('#content').append(strMessage);
	var selects = $('#content select');
	if (selects.hasClass('sale-unit')) {
		fillInSaleUnit();
	}
	if (strIconTypeDft === undefined) {
		$(dialogBox).children('#icon').addClass('question');				
	} else if (strIconTypeDft != 'none') {
		$(dialogBox).children('#icon').addClass(strIconTypeDft);						
	}
	$('.not-empty-when-true', dialogBox).addClass('not-empty');
	$(dialogBox).dialog ({title : strTitle,});
	standardizingUI(dialogBox);
	var buttons =[{
		text: strForTrue, 
		click : function() { 
			deferredObj.comments = '';
			$('.not-empty-when-true', dialogBox).addClass('not-empty');
			$('.not-empty-when-false', dialogBox).removeClass('not-empty');
			if (checkValidation(dialogBox)) {
				encodeAdditionalMsg();
				closeDialog(this);
				deferredObj.resolve();				
			}
		},
	}];
	if (strForFalseOpt) {
		buttons.push({
			text: strForFalseOpt,
			click : function(){
				$('.not-empty-when-false', dialogBox).addClass('not-empty');
				$('.not-empty-when-true', dialogBox).removeClass('not-empty');
				if (checkValidation(dialogBox)) {
					encodeAdditionalMsg();
					closeDialog(this);
					deferredObj.reject();				
				}
			},
		});		
	}
	$(dialogBox).dialog('option','buttons', buttons);
	
	function encodeAdditionalMsg() {
		var returnString = objectToJson({}, dialogBox, false, true);
		deferredObj.comments = returnString; 							
		if ($('#extraInfos', dialogBox).length > 0) {
			deferredObj.extraInfo = getExtraInfos($(dialogBox));
		}		
	}
}

/*
 * 在dom元素上显示错误提示信息的通用程序。
 *
 * 前提：	无
 * 
 * 输入:		1）参数1：domElement，要显示错误提示内容的页面元素，
 * 			2）参数2：string，要显示的错误信息，
 * 			3）参数3：boolean，是否需要自动加上元素对应的label信息的开关，可省略，缺省为true
 * 出口：	1）调用本函数的页面
 * 返回：	无
 * 其他:		无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-12-20
 * 
 * 1.1版本简述
 * 显示新的错误提示信息前，增加了调用清除原错误信息显示的步骤
 * 
 * @author Harry
 * @version 1.1 2015-09-23
 * 
 * 1.2版本简述
 * 更改了tooltip的呈现方式，解决原来就有tooltip的单元不能及时显示帮助信息的问题；
 * 更改了帮助信息的传递方式，原版本通过更改元素的title属性值，现直接传递为tooltip的content内容。
 * 
 * @author Harry
 * @version 1.2 2015-10-08
 */
function showupHelpMessage(domElem, strMsg, blnAutoNamingDftT) {
	if (blnAutoNamingDftT == undefined) blnAutoNamingDftT = true;
	clearupHelpMessage();
	if (blnAutoNamingDftT) {
		var strNaming = '这里';
		if ($(domElem.parentNode).find('[for="' + domElem.name + '"]').length > 0) {
			strNaming = $(domElem.parentNode).find('[for="' + domElem.name + '"]').text();
			strNaming = $.trim(strNaming);
			if (strNaming.substring(strNaming.length - 1)=='：' || strNaming.substring(strNaming.length - 1)==':') {
				strNaming = strNaming.substring(0, strNaming.length-1);
			}
		}
		strMsg = strNaming + strMsg;		
	}
	
//	domElem.title=strMsg; 
	if ($(domElem).tooltip('instance')) {
		$(domElem).tooltip('destroy');
	}
	
	$(domElem).tooltip({
		items: domElem.tagName,
		tooltipClass: 'ui-state-error',
		position: {my: 'left+5 center', at: 'right center', collision: 'flipfit'},
		content: strMsg
	}).tooltip('open');
    $(domElem).addClass('need-help-msg').focus();    
};

/*
 * 清除dom元素上显示的错误提示信息的通用程序。
 *	一次清除所有的错误提示信息。
 *
 * 前提：	无 
 * 输入:		无
 * 出口：	1）调用本函数的页面
 * 返回：	无
 * 其他:		无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-12-20
 * 
 */
function clearupHelpMessage() {
	var needBulletin = $(".need-help-msg");
	for (var i =0; i < needBulletin.length; i++) {
		needBulletin[i].title='';
		$(needBulletin[i]).tooltip('destroy');	
	    $(needBulletin[i]).removeClass('need-help-msg');
	};
};

/*
 * jqGrid控件进行增加或修改操作时，关闭同一页面上其余grid控件的编辑按键以及页面的保存等按键
 * 前提：	目前仅能被jqGrid控件的增加、编辑事件调用。
 * 			因为其中使用了this对象作为排除事件发生所在的grid控件的标志。
 * 输入:		无
 * 出口：	返回调用点。
 * 返回：	无
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2014-2-28
 * 
 * 1.1版本简述：
 * 增加参数：	blnDisableSelfBtns，用于控制当函数是通过grid上的某个事件触发时，是否同时disable该grid自身的按键。
 * 
 * @version 1.1 2014-11-28
 */
function disableButtons(blnDisableSelfBtns) {
	$('button').not('.active-while-grid-edit').prop('disabled', true).addClass("ui-state-disabled");
	$('.disabled-while-grid-edit').prop('disabled', true).addClass("ui-state-disabled");
	if (blnDisableSelfBtns === undefined) blnDisableSelfBtns = false;
	if (blnDisableSelfBtns) {
		triggerGridButtons(false);		
	} else {
		var grid = $(".grid");
		//this对象是事件发生的那个jqGrid对象。
		for (var i = 0; i < grid.length; i++) {
			if (grid[i] != this) {
				var gridSelector = $(grid[i]).prop('id');
				triggerGridButtons(false, gridSelector);
			}
		}
		//关闭事件grid控件的del按键。因为在新增、编辑状态下点击删除会造成页面控制逻辑的混乱。
		$('#del_' + $(this).prop('id')).hide();		
	}
};

/*
 * jqGrid控件完成增加或修改操作后，打开同一页面上其余grid控件的编辑按键以及页面的保存等按键
 * 前提：	目前仅能被jqGrid控件的增加、编辑事件调用。
 * 			因为其中使用了this对象作为排除事件发生所在的grid控件的标志。
 * 输入:		无
 * 出口：	返回调用点。
 * 返回：	无
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2014-2-28
 * 
 * 1.1版本简述：
 * 增加参数：	blnEnableSelfBtns，用于控制当函数是通过grid上的某个事件触发时，是否同时enable该grid自身的按键。
 * 
 * @version 1.1 2014-11-28
 */
function enableButtons(blnEnableSelfBtns) {
	$('button').not('.active-while-grid-edit').prop('disabled', false).removeClass("ui-state-disabled");
	$('.disabled-while-grid-edit').prop('disabled', false).removeClass("ui-state-disabled");
	if (blnEnableSelfBtns === undefined) blnEnableSelfBtns = false;
	if (blnEnableSelfBtns) {
		triggerGridButtons(true);		
	} else {
		var grid = $(".grid");
		//this对象是事件发生的那个jqGrid对象。
		for (var i = 0; i < grid.length; i++) {
			if (grid[i] != this) {
				var gridSelector = $(grid[i]).prop('id');
				triggerGridButtons(true, gridSelector);
			}
		}
		$('#del_' + $(this).prop('id')).show();		
	}
};

function disableDialogButtons(theSelector){
	if(theSelector === undefined) theSelector='.dialog-body';
	$(theSelector).next(".ui-dialog-buttonpane").find('button')
		.attr('disabled', true).addClass("ui-state-disabled");
};

function enableDialogButtons(theSelector){
	if(theSelector === undefined) theSelector='.dialog-body';
	$(theSelector).next(".ui-dialog-buttonpane").find('button')
		.attr('disabled', false).removeClass("ui-state-disabled");
};

/*
 * 打开以及关闭jqGrid的编辑按键
 * 前提：	无
 * 输入:		参数1 String：Grid的jquery选择器字符串，不带#或.
 * 			参数2 Boolean: true打开按键，false关闭按键。
 * 出口：	返回调用点。
 * 返回：	无
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2014-2-28
 * 
 * 1.1 版本简述：
 * 为增加程序的通用性，进行如下改动：
 * 		输入参数的顺序进行了调整，theGridID变为可选参数，调用时如果不指定该参数，则对页面上所有grid类的
 * 			元素均进行关闭/打开按键操作；
 * 
 * 1.2版本简述：
 * 修改了grid按键的选中方式，改变了原来逐个选择的方法，一次用采用ui-pg-button组进行选择。
 * 注意： 该函数会一次性打开或关闭grid上的所有按键，调用程序需单独处理个别状态不同的按键。
 * 
 * @version 1.2 2014-11-28
 */
function triggerGridButtons(blnOnOrOff, theGrid) {
	var grids = {};
	if (theGrid === undefined) {
		grids=$('.grid');
	} else if (theGrid instanceof jQuery) {
		grids = theGrid;
	} else {
		if (theGrid.indexOf('#') == -1) theGrid = '#' + theGrid;
		grids = $(theGrid);
	}
	if (blnOnOrOff) {
		for (var i = 0; i < grids.length; i++) {
			var gridPagerSelector = $(grids[i]).getGridParam('pager');
			$(gridPagerSelector + ' .ui-pg-button, ' + gridPagerSelector + ' .ui-pg-input').removeClass('ui-state-disabled');
		}
	} else {
		for (var i = 0; i < grids.length; i++) {
			var gridPagerSelector = $(grids[i]).getGridParam('pager');
			$(gridPagerSelector + ' .ui-pg-button, ' + gridPagerSelector + ' .ui-pg-input').addClass('ui-state-disabled');
		}			
	}
}

function inGridEditInventoryValidation(value, colname, valForCheck, blnCheckXiLieDftF){
	if (blnCheckXiLieDftF === undefined) blnCheckXiLieDftF = false;
	if (blnCheckXiLieDftF && !valForCheck) {
		return [false, '系列名称只能从下拉列表中选择，不要自行输入，请重新操作！'];		
	}
	if (!blnCheckXiLieDftF && !valForCheck) {
		return [false, '货物名称只能从下拉列表中选择，不要自行输入，请重新操作！'];		
	};
	return [true,''];
};

function getLabelAndValue(strParentSelector) {
	var returnString = '';
	var elems = $(strParentSelector).find('label');
	for (var j = 0; j < elems.length; j++) {
		returnString += elems[j].innerHTML + $('[name="' + elems[j]['htmlFor'] + '"]').val() + '\n'; 
	}
	returnString = returnString.substring(0, returnString.lastIndexOf('\n'));
	return returnString;
}
/*
 * 根据输入参数，进行编辑元素清空或重新查询的函数
 * 		适用于页面上使用一个按键，完成"重填"和"查询"两个功能的情况
 * 前提：	实现"重填"功能，按键文字必须使用标准文字："重填"；
 * 输入:		参数1： String, 按键的文字内容；
 * 			参数2： String， 需要重填的元素范围，是能够包含所有重填元素的父element的字符标识;
 * 			参数3： String, 需要查询的信息字符标识
 * 出口：	1）清空后，维持在原页面
 * 			2）弹出查询条件设置对话框。
 * 返回：	无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-24
 * 
 * 1.1版本简述：
 * 上一个版本针对按键完成重填和重新查询两种操作，
 * 新版本考虑到了销售订单的需求，改为了多个动作结合，在订单界面这个按键完成的是重填和添加留言功能。
 * 函数名称由'clearOrQuery'更改为'clearOrOtherActions'
 * 
 * @author Harry
 * @version 1.1 2014-1-11
 * 
 * 调用者：	1）按钮：	distributor.html，按键id=refill
 * 					business_companion.html，按键id=refill
 * 					provider.html，按键id=refill
 * 					order.html,按键id=refill
 */
function clearOrOtherActions(theText, strParentSelectort, theInfoType){
	if (theText=='重填') {
		clearAllInputs(strParentSelectort, false);
		return;
	} else if (theInfoType != '' && theText != '增加留言') {
		showUpQueryCretiasDialog(theInfoType);
		return;
	} else if (theText=='增加留言') {
		addComments('Sheet', '【订单' + orderHead['DingDanDaiMa'] + ', 客户姓名：'
			+ $("[name='KeHuXingMing']").val() + '】', orderHead['DingDanDaiMa']);
	}
};

/*
 * 根据输入参数指定的范围，进行编辑元素清空的函数
 * 前提：	实现"重填"功能，按键文字必须使用标准文字："重填"；
 * 输入:		参数1： String, 需要清空的元素范围，是能够包含所有清空元素的父element的字符标识;
 * 出口：	1）清空后，维持在原页面
 * 返回：	无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-25
 * 
 * 1.1版本简述：
 * 增加了对页面其他元素的还原：
 * 1）id=status的状态标签隐藏；
 * 2）class=readonly-after-adding的输入元素的可用性还原；
 * 3）按键文字的还原。
 * 
 * @author Harry
 * @version 1.1 2014-1-11
 * 
 * 1.2版本简述：
 * 增加了第二个输入参数：boolAll
 * 		布尔量。	true  = 清除所有元素的输入值，包括按键显示，到完全新增状态；
 * 				false = 清除可编辑元素的输入值，不改变按键显示。
 * 
 * @author Harry
 * @version 1.2 2014-3-12
 * 
 * 调用者：	1）按钮：	暂无按键直接调用
 * 			2）函数：clearOrOtherActions
 * 					addNewOrClose
 */
function clearAllInputs(parentContainer, boolAll) {
	if (boolAll) {
		$(parentContainer).find('input, textarea').val('');
	} else {
		$(parentContainer).find('input, textarea').not('.noaction-in-refilling').val('');		
	}
	//清除页面单据名称元素的单据编号部分。
	if ($('#sheetTitle').html().indexOf('（编号：')!=-1 && boolAll) {
		var titleContent = $('#sheetTitle').html();
		titleContent = titleContent.substring(0,titleContent.indexOf('（编号：'));
		$('#sheetTitle').html(titleContent);		
	}

	//对select元素，特意处理了只有0或1个option的情况，保留这种情况下select的值，不做清除。
	var selectElems;
	if (boolAll) {
		selectElems = $(parentContainer).find('select').not('.ui-datepicker-year').not('.ui-datepicker-month');		
	} else {
		selectElems = $(parentContainer).find('select').not('.noaction-in-refilling').not('.ui-datepicker-year').not('.ui-datepicker-month');
	}
	//单独处理了一种特殊情况，即当前选定的销售组织下只有一个人的情况。
	//因为此时，人员选择框不能被下面的语句清除，因此单独判断。
	//	规则：查找对应的sale-unit，如果该元素的选项多于一个，则staff单元的options可以移除
	if ($(parentContainer).find('.sale-unit').children('option').length > 1) {
		$(parentContainer).find('.staff').val('');
		$(parentContainer).find('.staff option').remove();
	}
	for (var i=0; i < selectElems.length; i++) {
		if ($(selectElems[i]).children('option').length > 1) {
//		if ($(parentContainer +' select:eq('+i+')').children('option').length > 1) {
			$(selectElems[i]).val('').trigger('change');
		}
	} 
	//清除页面jqgrid表格元素的显示内容。条件：grid必须赋予class=grid。
	//使用jqGrid.clearGridData，没有效果。因此只有使用新API的调用方法。  
	//			-- 后来的测试证实还是可以用旧方法的。保留此条说明纪念。  ---Harry 2013-12-28
	$(parentContainer).find('.grid').jqGrid('clearGridData', true).trigger('reloadGrid');
	if (boolAll) {
		$('.readonly-after-adding *').removeClass('none-editable').removeAttr('disabled');
		$("#save").button('option','label','新增');
		$('#status').hide();		
	}
};

/*
 * 完成单表插入后的处理过程函数。
 * 通常由启动新数据插入的函数调用，便于规范化地处理数据插入后的流程。
 * 前提：	调用时的页面必须有id=putDialogHere的DIV元素。
 * 输入:		参数1, 服务器返回的插入结果对象，json格式，数据内容需满足本系统的命名要求。
 * 			参数2，插入成功后，提示信息中的名称字符串，如果为空，显示的提示信息全部为空。
 * 			参数3，数据的唯一标识回填的页面元素的name值。
 * 					不为空：系统处理为增加单据的过程，插入成功后保留不退出页面再次编辑或录入新数据的选择；
 * 					为空：系统直接显示成功信息后，返回退出。
 * 出口：	返回调用点。
 * 返回：	boolean：服务器传回的结果正常=true，异常=false。
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2013-12-29
 * 
 * 1.1版本简述：
 * 因销售订单在新增后可能存在3个状态，故增加一个输入参数：
 * 			参数4：字符串，代表单据保存成功后应该处于的状态。
 * 
 * @author Harry
 * @version 1.1 2014-1-8
 * 
 * 1.2版本简述：
 * 因销售订单需要提示，订单保存后不在待审状态的原因，故增加一个输入参数：
 * 			参数5：字符串，代表需要解释的其他原因。
 * 
 * @author Harry
 * @version 1.2 2014-1-11
 * 
 * 1.3版本简述：
 * 修改参数3，参数4，参数5为可选参数，调用函数时，可以只引入参数1和参数2，程序自动判断其他参数是否引入。
 * 
 * @author Harry
 * @version 1.3 2014-3-2
 * 
 * 调用者：	1）按钮：佣金伙伴页面新增按键
 * 			2）订单查询结果页面，增加内部留言操作。
 * 			3）增加订单收费记录函数：orderChshiering()
 */
function afterSaveNewRecord(theData, theSheetType, theNameOfBiaoShi, theStatus, theExtraMessage, hasNextActions){
	if (ajaxJsonErrorHandler(theData) != true) return false;
	if (theData.hasData=='FALSE') {
		showupMessageInDialog('<br>未能完成数据写入，请联系系统管理员！', '请求助或重试');
		return false;
	};
	var message='数据已保存！';
	if (theSheetType != '') {
		message = '您已成功添加<strong>' + theSheetType + '</strong>资料！<br/>编号：<span style="color:blue"><i>' + theData.id +'</i></span>';
		if ((typeof(theStatus)!='undefined')&&(theStatus !='')) {
			message += '；&nbsp;&nbsp;状态：<span style="color:blue"><i>' + theStatus +'</i></span>。';
		};
		if ((typeof theExtraMessage != 'undefined')&&(typeof(theExtraMessage)!='boolean') && (theExtraMessage !='')) {
			message += '<br/><span style="color:blue; margin-top:0.3em"><i>' + theExtraMessage + '。</i></span>';
		};
	}
	console.log('单据保存成功回显：' + message);
	//新增订单服务除返回订单标识外，还额外返回客户标识。这段程序具有通用性，将返回的附件数据，在页面的单元进行显示。
	//		--- Harry 2014-1-8
	for (var name in theData) {
		if (name!='status' && name !='hasData' && name != 'id') {
			$("[name='"+ name + "']").val(theData[name]);
		};
	};
	//新增资料的标识，填入页面单元
	if ((typeof theNameOfBiaoShi != 'undefined')&&(theNameOfBiaoShi != '')) {
		$("input[name='" + theNameOfBiaoShi + "'").val(theData.id);
		if (!$.isEmptyObject(document.getElementById("sheetTitle"))) {
			document.getElementById("sheetTitle").innerHTML += "（编号：" + theData.id + " ）";
			$("#status").html(theStatus).css("background-color", 'yellow').show();
		}
		//在新增订单过程中存在保存后不可修改的元素--"收款金额"，这里是在正常保存新订单后，马上将其改变为不可修改。
		//今后其他单据如果有这样的需求，可在该元素的calss中增加'readonly-after-adding'即可。
		//                      ------ Harry 2014-1-8
		$('.readonly-after-adding *').addClass('none-editable none-editable-content').prop('disabled',true);
		$("#save").button('option','label','保存');
		if (hasNextActions != undefined && hasNextActions === true) {
			return true;
		} else {
			addNewOrClose(message);	
			return true;
		}
	} else {
		if (hasNextActions != undefined && hasNextActions === true) {
			return true;
		} else {
			showupMessageInDialog(message, '请知晓');
			return true;
		}
	};
	return true;
};


function afterSaveMasterRecord(theData){
	if (theData.status!='OK') {
		ajaxJsonErrorHandler(theData);
		return false;
	} else {
		if (theData.hasData=='FALSE') {
			showupMessageInDialog('<br>未能完成数据写入，请联系系统管理员！', '请求助或重试');
			return false;
		};
	};
	return theData.id;
};

function afterUpdateSingleRecord(theData, theShowString, theRecordID){
	if (theData.status!='OK') {
		ajaxJsonErrorHandler(theData);
		return false;
	};
	var message = '您已成功更新编号为<span style="color:blue"><i>' + theRecordID + '</i></span>的<strong>' + theShowString + '</strong>资料！';	
	showupMessageInDialog(message, '请知晓');
	return true;
};

/*
 * 获取服务器的时间。
 * 前提：	无
 * 输入:		无
 * 出口：	返回调用点。
 * 返回：	本地时间
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2013-12-29
 * 
 * 1.1版本概述：
 * 增加参数：
 * 		参数1：取时间还是日期，省略时取日期，如果传入字符串'time'则返回时间
 * 		参数2：返回date对象还是字符，缺省时返回字符，如返回字符串'date’则输出date对象。
 * 
 * @author Harry
 * @version 1.1 2014-5-7
 * 
 * 调用者：	
 */
function getServerTime(timeOrDate, theReturnedType) {
	//ie下面，第一次调用时，如果async=false，cache=true，会得到time=null的结果。
	//chrome下没有这个问题，因此统一修改为cache=false
	var time= new Date;
	$.ajax({
		url : 'sayHello.do',
		type : 'GET',
		dataType : 'text',
		cache : false,
		async : false,
		success : function(data, status, jqXHR){
			time = new Date(jqXHR.getResponseHeader('Date'));
		},
	});
	
	if (theReturnedType!=undefined && theReturnedType === 'date') {
		if (timeOrDate!=undefined && timeOrDate=='time') {
			return time;			
		} else {
			time.setHours(0, 0, 0, 0);
			return time;			
		}
	} else {
		var monthPart;
		var dayPart;
		if (time.getMonth()+1 < 10) {
			monthPart = '0' + (time.getMonth()+1);
		} else {
			monthPart = time.getMonth() + 1;
		}
		if (time.getDate() < 10) {
			dayPart = '0' + time.getDate(); 
		} else {
			dayPart = time.getDate();
		}
		if (timeOrDate!=undefined && timeOrDate =='time') {
			var hoursPart, minutesPart, secondsPart;
			if (time.getHours() <10) {
				hoursPart = '0' + time.getHours();
			} else {
				hoursPart = time.getHours();			
			}
			if (time.getMinutes() <10) {
				minutesPart = '0' + time.getMinutes();
			} else {
				minutesPart = time.getMinutes();			
			}
			if (time.getSeconds() <10) {
				secondsPart = '0' + time.getSeconds();
			} else {
				secondsPart = time.getSeconds();			
			}
			return time.getFullYear() + '-' + monthPart + '-' + dayPart + ' ' 
				+ hoursPart + ':' + minutesPart + ':' + secondsPart;								
		} else {
			return time.getFullYear() + '-' + monthPart + '-' + dayPart;					
		}
	}
};

/*
 * 从日期字符串获得date对象。
 * 解决三大浏览器平台对字符生成date对象解释不统一带来的问题。
 * 全部使用统一标准的方式完成转换。
 * 
 * 前提：	无
 * 输入:		日期字符串，以‘-’作为分隔符。
 * 出口：	返回调用点。
 * 返回：	data对象
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2013-12-29
 * 	
 */
function getDateFromString(theDateString) {
	if (typeof theDateString == 'number') {
		var returnDate = new Date();
		returnDate.setTime(theDateString * 1000);
		return returnDate;
	}
	if (theDateString=='') return null; 
	if (theDateString.indexOf(' ') != -1) theDateString = theDateString.substring(0, theDateString.indexOf(' '));
	theDateString = theDateString.replace(/年/g, '-');
	theDateString = theDateString.replace(/月/g, '-');
	theDateString = theDateString.replace(/日/g, '-');
	var dateString = theDateString.split('-');
	return new Date(dateString[0], dateString[1]-1, dateString[2]);
}

function getDateStringFromTimeString(theDateString, blnLongASTrueDftF) {
	if (!theDateString) return '';
	if (blnLongASTrueDftF === undefined || typeof blnLongASTrueDftF != 'boolean') {
		blnLongASTrueDftF = false;
	}
	if (theDateString.indexOf(' ') != -1) {
		theDateString = theDateString.substring(0, theDateString.indexOf(' '));
	}
	var dateArray = theDateString.split('-');
	if (dateArray.length != 3) {
		return theDateString;
	} else {
		if (blnLongASTrueDftF) {
			return dateArray[0] + '-' + dateArray[1] + '-' + dateArray[2];			
		} else {
			return dateArray[1] + '-' + dateArray[2];						
		}
	}
}

/*
 * 从日期对象获得String。
 * 解决三大浏览器平台对字符生成date对象解释不统一带来的问题。
 * 全部使用统一标准的方式完成转换。
 * 
 * 前提：	无
 * 输入:		1）参数1：date对象。
 * 			2）参数2： 是否返回时间字符串。省略后只返回日期字符串
 * 出口：	返回调用点。
 * 返回：	日期字符串
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2013-12-29
 * 	
 */
function getStringFromDate(dateWillConvert, blnWithTime) {
	var monthPart, dayPart, hoursPart, minutesPart, secondsPart;
	if (dateWillConvert.getMonth()+1 < 10) {
		monthPart = '0' + (dateWillConvert.getMonth()+1);
	} else {
		monthPart = dateWillConvert.getMonth() + 1;
	}
	if (dateWillConvert.getDate() < 10) {
		dayPart = '0' + dateWillConvert.getDate(); 
	} else {
		dayPart = dateWillConvert.getDate();
	}
	
	if (dateWillConvert.getHours() < 10) {
		hoursPart = '0' + dateWillConvert.getHours();
	} else {
		hoursPart = dateWillConvert.getHours();		
	}
	if (dateWillConvert.getMinutes() < 10) {
		minutesPart = '0' + dateWillConvert.getMinutes();
	} else {
		minutesPart = dateWillConvert.getMinutes();		
	}
	if (dateWillConvert.getSeconds() < 10) {
		secondsPart = '0' + dateWillConvert.getSeconds();
	} else {
		secondsPart = dateWillConvert.getSeconds();		
	}
	if (blnWithTime != undefined && blnWithTime) {
		return dateWillConvert.getFullYear() + '-' + monthPart + '-' + dayPart + ' ' + hoursPart + ':' + minutesPart + ':' + secondsPart;				
	} else {
		return dateWillConvert.getFullYear() + '-' + monthPart + '-' + dayPart;		
	}
}

/*
 * 时间字符串求差
 * 
 * 前提：	无
 * 输入:		参数1：求差级别
 * 			参数2：基准时间
 * 			参数3：比较时间
 * 出口：	返回调用点。
 * 返回：	差异整数
 * 改进：	目前的处理只能求到年月日的差异，改进后可以处理时分秒差异。
 * 
 * @author Harry
 * @version 1.0 2013-12-29
 * 
 */
function DateDiff(interval, string1, string2) {
	var date1 = getDateFromString(string1);
	var date2 = getDateFromString(string2);
	
	var part = date2.getTime() - date1.getTime(); //相差毫秒
	switch (interval.toLowerCase()) {
	case "y": 	//年差
		return parseInt(date2.getFullYear() - date1.getFullYear());
	case "m":	//月差
		return parseInt((date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth()));
	case "d":	//24小时差
		return parseInt(part / 1000 / 60 / 60 / 24);
	case "w":	//周差
		return parseInt(part / 1000 / 60 / 60 / 24 / 7);
	case "h":	//小时差
		return parseInt(part / 1000 / 60 / 60);
	case "n":	//分差
		return parseInt(part / 1000 / 60);
	case "s":	//秒差
		return parseInt(part / 1000);
	case "l":	//毫秒差
		return parseInt(part);
	}
}

function addDays(interval, strDate, theReturnedType) {
	var date = getDateFromString(strDate).getTime();
	
	date = date + interval*1000*60*60*24;
	date = new Date(date);
	if (typeof(theReturnedType)!='undefined' && theReturnedType === 'date') {
		return date;
	} else {
		return getStringFromDate(date);		
	}
}
/*
 * 查询指定单据类型、单据号，并打印单据。
 * 前提：	单据已保存到数据库中。
 * 输入:		参数1： 单据类型，DingDan=销售订单;
 * 			参数2：单据号
 * 出口：	打印预览页面，关闭后回到调用页面。
 * 返回：	无
 * 改进：	是否支持多张单据打印。
 * 
 * @author Harry
 * @version 1.0 2014-1-1
 * 
 * 
 * 调用者：	1）按钮：	新增/编辑订单页面，打印按键
 */
function print(theLeiXing, theDaiMa) {
	if (theLeiXing == 'SO') {
		theLeiXing = 'DingDan';
		if (!theDaiMa) {
			if (cache['currentSO'] === undefined) {
				showupMessageInDialog('没有发现单据代码，请选中一张单据后再操作！', '操作错误','wrong');
				return false;				
			} else {
				theDaiMa = cache['currentSO']['DingDanDaiMa'];
			}
		}
	}

	openWindowPlusyoou('print.do?LeiXing=' + theLeiXing +'&DanHao=' + theDaiMa,'PrintPreview');
	if (theLeiXing == 'CeLiang') {
		$.ajax({
			url: 'IncreasePrintCount.do',
			type: 'POST',
			data: 'sheetType=' + theLeiXing + '&id=' + theDaiMa,
			async: true,
			dataType: 'json',
			success: 
				function(data){
				if (data.status!='OK') {ajaxJsonErrorHandler(data);}
			},
		});
	}
}

function exportExcel(strParamsOrObjGrid, strFileName) {
	var theParameters = '';
	if (strParamsOrObjGrid instanceof jQuery) {
		var willPostData = $(strParamsOrObjGrid).getGridParam('postData');
		if (!willPostData.infoType) {
			showupMessageInDialog('请先设置查询条件，再进行数据导出！', '操作错误', 'wrong');
			return;
		}
		delete willPostData['page'];
		delete willPostData['rows'];
		delete willPostData['nd'];
		delete willPostData['sidx'];
		delete willPostData['sord'];
		theParameters = objectToParameters(willPostData);
	} else {
		theParameters = strParamsOrObjGrid;
	}
	if (strFileName) {
		theParameters += '&FileName=' + strFileName;
	}
	openWindowPlusyoou('ExcelExport.do?' + theParameters);
}

//this function create an Array that contains the JS code of every <script> tag in parameter
//then apply the eval() to execute the code in every script collected
function parseScript(strcode) {
	var scripts = new Array();         // Array which will store the script's code
	// Strip out tags
	while(strcode.indexOf("<script") > -1 || strcode.indexOf("</script") > -1) {
		var s = strcode.indexOf("<script");
		var s_e = strcode.indexOf(">", s);
		var e = strcode.indexOf("</script", s);
		var e_e = strcode.indexOf(">", e);
		// Add to scripts array
		scripts.push(strcode.substring(s_e+1, e));
		// Strip from strcode
		strcode = strcode.substring(0, s) + strcode.substring(e_e+1);
	}
	// Loop through every script collected and eval it
	for(var i=0; i<scripts.length; i++) {
		try {
			eval(scripts[i]);
		}
		catch(ex) {
			alert(ex);
			// do what you want here when a script fails
		}
	}
};

//检查工号输入单元的形式合法性
//此函数验证以后作废
//function checkUserCodeValidation(strParentSelector){
//	clearupHelpMessage();
//	var userCode = $(strParentSelector + " .user-code");
//	for (var i = 0; i < userCode.length; i++) {
//		if(!/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(userCode[i].value)){
//			showupHelpMessage(userCode[i], '工号输入不正确');
//			return false;
//		}
//		return true;		
//	}
//};



/*
 * 去除数组中的重复工程。
 * 前提：	1）直接传入一个数组参数，去除其中的重复元素；
 * 			2）传入一个或多个选择器字符串，选中的元素的value是用","分隔的字符串，取出该字符串，去除其中的重复项。
 * 输入:		参数1：	string或array:	如果是array，直接去除其中的重复项，
 * 									如果是string，取出元素的值转换为数组并去除重复项。
 * 			参数2：	String:		可选参数，如果有，是另一个元素选择器，
 * 								其值需要与firstParam代表的元素的值进行同步重复移除。
 * 出口：	返回调用点。
 * 返回：	如果参数1是数组，则返回去除重复值的数组。
 * 			如果参数1是string，则回填去除重复值的数据后，返回true。
 * 			其余情况，参数错误时，返回false
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-9
 * 
 * 调用者：	1）	order.js
 */
function eliminateDuplicatsInArray(firstParam, secondParam){
	var mainArray;
	if (typeof(firstParam)=='string') {
		if (firstParam=='' || $(firstParam).length==0) return false;
		mainArray = ($(firstParam).val()).split(',');		
	} else if (firstParam instanceof Array) {
		mainArray = firstParam;
		if (firstParam.length == 0) return [];
	} else {
		return false;
	}
	var newMainArray = [];
	var relArray = [];
	var newRelArray = [];
	var duplicated = false;
	if (secondParam=='' || typeof(secondParam)=='undefined') {
		relArray = mainArray;
	} else {
		relArray = ($(secondParam).val()).split(',');		
	}
	newMainArray.push(mainArray[0]);
	newRelArray.push(relArray[0]);
	for (var i = 1; i < mainArray.length; i++) {
		duplicated = false;
		for (var j =0; j < newMainArray.length; j++) {
			if (mainArray[i] == newMainArray[j]) duplicated = true;
		}
		if (!duplicated) {
			newMainArray.push(mainArray[i]);
			newRelArray.push(relArray[i]);
		}
	}
	if (typeof(firstParam) == 'string') {
		$(firstParam).val(newMainArray.join(','));
		if (secondParam!='') $(secondParam).val(newRelArray.join(','));
	} else if (typeof(firstParam)=='object') {
		return newMainArray;
	}
	return true;
};

/*
 * 去除grid单元数据中classes = not-serialize的数据, 并返回其余有效数据。
 * 前提：	无
 * 输入:		参数1：	jquery element	用jquery方式选中的jqGrid表。
 * 出口：	返回调用点。
 * 返回：	包含有效数据的数组
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-6-1
 * 
 * 1.1 版本简述
 * 由于compareGridRowChanged函数算法的改变，针对新增行在grid中的自然行号
 * （从0开始的整数编号）不能在该函数中获得了，因此修改本数据预处理函数，强制
 * 为grid的每行赋值一个rn属性
 * 这样增加的限制为：jqGrid的name中不能再使用rn
 * 
 * @author Harry
 * @version 1.1 2016-03-16
 */
function eliminateNotSerializingCells(theGrid, theGridDataArray) {
	if(theGridDataArray==undefined) theGridDataArray = theGrid.jqGrid('getRowData');
	var colParamers = theGrid.jqGrid('getGridParam', 'colModel');
	var notSerializeCols = [];
	if (theGridDataArray.length > 0) {
		theGridDataArray
		for (var col in theGridDataArray[0]) {
			for (var x = 0; x < colParamers.length; x++) {
				if (colParamers[x]['name'] == col) {
					if (colParamers[x]['classes']!=undefined && colParamers[x]['classes'].indexOf('not-serialize') != -1) {
						notSerializeCols.push(col);
					}
					break;
				}
			}
		}
		console.log('去除grid中class=not-serialize的单元格，不进行比较。以下是去除的单元格名称：');
		console.log(notSerializeCols);
		for (var y = 0; y < theGridDataArray.length; y++) {
			theGridDataArray[y]['rn'] = y;
			for (var z = 0; z < notSerializeCols.length; z++) {
				delete theGridDataArray[y][notSerializeCols[z]];
			}
		}			
	}
	return theGridDataArray;
};

/*
 * 统一规范将填入grid中的数组数据。
 * 将 null转换为空字符，boolean统一转换为string
 * 前提：	无
 * 输入:		参数1：	jquery element	用jquery方式选中的jqGrid表。
 * 出口：	返回调用点。
 * 返回：	包含有效数据的数组
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-6-1
 * 
 * 调用者：	1）	objectToJson函数
 * 			2）	manipulatingGrid函数
 */
function convertNullAndBooleanInGrid(theGridData) {
	for (var i = 0; i < theGridData.length; i++) {
		for (var column in theGridData[i]) {
			if (theGridData[i][column] == null) {
				theGridData[i][column] = '';
			}
			if (typeof theGridData[i][column] == 'boolean') 
			theGridData[i][column]=theGridData[i][column].toString();
		}
	};
	return theGridData;
}

function openWindowPlusyoou(urlOrForm, strName) {
	//ie中，window.open方法不传递referer参数，造成后台检测过不了。故全部改为隐藏链接方式触发新页面调用。
	if (strName === undefined) strName = 'PopupNewAndEditWindowOfPlusyoouSMIS';
	var winRef = window.open('blank.html',strName);
//	if (window.name != strName) {
//		winRef.close();				
//		winRef = window.open('clientArray',strName);		
//	}
	if (typeof urlOrForm === 'string') {
		var link = document.createElement('a');
		link.target = strName;
		link.href = encodeURI(urlOrForm);
		document.body.appendChild(link);
		//click方法在DOM标准中只用于input元素，因此在sarafi中链接是没有click方法的。
		//为提高兼容性，使用统一的dispatchEvent方法调用。
//		link.click();
		var evObj = document.createEvent('MouseEvents');
		evObj.initEvent('click', true, true);
		link.dispatchEvent(evObj);
		document.body.removeChild(link);
	} else {
		urlOrForm.submit();
	}
	//在firefox，360浏览器中focus方法不工作，原因不明，今后再查
	winRef.focus();				
}

function shortDateInGrid(cellvalue, options, rowObject){
	if (!cellvalue) return '';
	if (cellvalue.indexOf(' ') != -1) cellvalue = cellvalue.substring(0, cellvalue.indexOf(' '));
	var dateArray = cellvalue.split('-');
	if (dateArray.length != 3) {
		return cellvalue;
	} else {
		return dateArray[1] + '-' + dateArray[2];
	}
};

function currencyFormatted(theAmount, blnProcessNaN){
	if (blnProcessNaN == undefined) blnProcessNaN = true;
	var i = parseFloat(theAmount);
    if(isNaN(i)) { 
    	if (blnProcessNaN) {
    		i = 0.00;    		
    	} else {
    		return theAmount;
    	}
	}

    var minus = '';
    if(i < 0) { minus = '-'; }
    i = Math.round((Math.abs(i) * 100))/100;
    if (i == 0) minus = '';
    var partBeforePeriod = Math.floor(i);
    var partAfterPeriod = Math.round((i - partBeforePeriod) * 100);
    if (partBeforePeriod == 0) {
    	partBeforePeriod = '0';
    } else {
    	partBeforePeriod = new String(partBeforePeriod);    	
    }
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(partBeforePeriod)) {
    	partBeforePeriod = partBeforePeriod.replace(rgx, '$1' + ',' + '$2');
    }
    if (partAfterPeriod == 0) {
    	partAfterPeriod = '00';
    } else {
    	partAfterPeriod = new String(partAfterPeriod);
    }
    if (partAfterPeriod.length == 1) partAfterPeriod = '0' + partAfterPeriod;
    var formattedAmount = minus + '￥' + partBeforePeriod + '.' + partAfterPeriod;
//    return formattedAmount;  

//    i = Math.abs(i);
//    i = parseInt((i + .005) * 100);
//    i = i / 100;
//    var formattedAmount = new String(i);
//    if(formattedAmount.indexOf('.') < 0) { formattedAmount += '.00'; }
//    if(formattedAmount.indexOf('.') == (formattedAmount.length - 2)) { formattedAmount += '0'; }
//    var x = formattedAmount.split('.');
//    var x1 = x[0];
//    var x2 = x.length > 1 ? '.' + x[1] : '';
//    var rgx = /(\d+)(\d{3})/;
//    while (rgx.test(x1)) {
//            x1 = x1.replace(rgx, '$1' + ',' + '$2');
//    }
//    formattedAmount = minus + '￥' + x1 + x2;
    return formattedAmount;
}

function currencyUnformat(strAmount, blnProcessNaN){
	if (strAmount == undefined) strAmount = '';
	if (blnProcessNaN == undefined) blnProcessNaN = true;
	strAmount = strAmount.replace(/￥/g,'');
	strAmount = strAmount.replace(/,/g,'');
	var i = parseFloat(strAmount);
	
	if(isNaN(i) && blnProcessNaN) {
		i = 0.00;    		
	}
	
	return i;
}

/*
 * 剥离某项操作产生的备注，并根据参数返回剥离出的备注内容，还是剥离后剩余的内容。
 * 前提：	无；
 * 输入:		1）string：需要处理的备注字符串
 * 			2）boolean: 决定返回剥离部分，或剥离后的剩余部分。true = 返回剥离部分，false = 返回剩余部分，可省略，缺省 = false
 * 			3）string: 剥离操作的开始特征字符串
 * 			4）string: 剥离操作的结束特征字符串，可省略，缺省为'【'
 * 出口：	1）对话框驻留的页面
 * 返回：	string
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-12-16
 * 
 */
function splitCommentsForThisAction(strOriginalComments, blnReturnSplittedOpt, strStartChar, strEndCharOpt) {
	if (!strOriginalComments) return '';
	var newComments = '';
	var strSplitted = '';
	if (typeof blnReturnSplittedOpt == 'string') {
		strEndCharOpt = strStartChar;
		strStartChar = blnReturnSplittedOpt;
		blnReturnSplittedOpt = false;
	}
	if (strStartChar.substring(0,1) != '【') strStartChar = '【' + strStartChar;
	if (strStartChar.substring(strStartChar.length-1) != '】') strStartChar = strStartChar + '】';
	if (strEndCharOpt == undefined) strEndCharOpt = '【';
	
	if (strOriginalComments.indexOf(strStartChar) != -1) {
		newComments = strOriginalComments.substring(0,strOriginalComments.indexOf(strStartChar));
		strSplitted = strOriginalComments.substring(strOriginalComments.indexOf(strStartChar) + strStartChar.length);
		if (strSplitted.indexOf(strEndCharOpt) != -1) {
			newComments += strSplitted.substring(strSplitted.indexOf(strEndCharOpt));
			strSplitted = strSplitted.substring(0, strSplitted.indexOf(strEndCharOpt));
		}
		if (blnReturnSplittedOpt) {
			return strSplitted;
		} else {
			return newComments;
		}
	} else {
		if (blnReturnSplittedOpt) {
			return strSplitted;
		} else {
			return strOriginalComments;			
		}
	};
};

/*
 * 对话框"关闭"按键的响应函数
 * 前提：	无；
 * 输入:		1）jQuery对象：需要进行关闭操作的对话框
 * 出口：	1）对话框驻留的页面
 * 返回：	无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-25
 * 
 * 1.1版本简述
 * 传入参数修改为dom对象，不再传递jquery对象。
 * 
 * 调用者：	1）函数：distributorQueryResultDialog， 
 * 					businessCompanionQueryResultDialog,
 * 					providerQueryResultDialog
 */
function closeDialog(theDialogElem){
	$(theDialogElem).dialog({dialogClass: 'willClose', autoOpen:false});
//	if ($(theDialogElem).hasClass('ui-dialog-content')) $(theDialogElem).dialog('destroy');
	$(theDialogElem).dialog('destroy');
	for (var i = 0; i < $(theDialogElem).length; i++) {
		document.body.removeChild($(theDialogElem)[i]);		
	}
};

/*
 * 检查查询条件设置的数目是否满足要求
 * 前提：	无
 * 输入：	参数1：String, 需检查的元素的范围：能覆盖所有需检查单元的父element的标识字符；
 * 			参数2：Integer, 要求的查询条件的数目。 
 * 出口：	返回调用本函数的页面
 * 返回：	true or false。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-24
 * 
 * 调用者：	1）函数：showUpQueryCretiasDialog
 */
function checkQuatityOfQueryCriterias(objContext, intNumbers) {
	objContext = iniContextObject(objContext);
	if (intNumbers==0) { return true;};
	var inputElems = $('input, select, textarea', objContext)
						.not('.ui-pg-input').not('.not-count-as-criterias').not('[type="hidden"]');
	for (var i =0; i < inputElems.length; i++) {
		if (inputElems[i].value != '') {
			intNumbers--;
			if (intNumbers==0) { return true;};
		}
	}
	return false;
};

/*
 * 多选框调用函数
 * 前提：	必须有multiselect.template模板，且以定义相应的元素。
 * 输入：	参数1：DOM元素，既是显示初始值的获取单元，也是多选后的最终显示单元；
 * 			参数2：DOM元素，既是初始val字段的获取单元，也是多选后的val字段存放单元，可省略。 
 * 出口：	返回调用本函数的页面
 * 返回：	无。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-20
 * 
 * 调用者：	1）页面renyuan.template：XiaoShouDanWei,GuanLiCangKu元素在获得焦点时调用。
 * 			2）页面provider在外包服务商模式下，GongYingShangLeiXing元素在获得焦点时调用。
 */
function multiSelects(theDOMElem, strNameOfBiaoShiElem){
	var parentContainer = iniContextObject(theDOMElem, '.dialog-body');
	var dialogBox = document.createElement('div');
	var strNameOfElem = theDOMElem.getAttribute('name');
	var alreadySelectedStr;
	var forSelectionData = {};
	var optionArr = [];
	if (strNameOfBiaoShiElem != undefined) {
		alreadySelectedStr = $(parentContainer).find('[name=' + strNameOfBiaoShiElem + ']').val();
	} else {
		alreadySelectedStr = $(theDOMElem).val();
	}

	$(parentContainer).find('[name="' + strNameOfBiaoShiElem + '"] option').each ( function() {
    	if (this.value!='' & this.value.indexOf(',')==-1) {
    		optionArr.push (this.value + '^' + this.text);    		
    	}
	});
	forSelectionData[strNameOfElem] = eliminateDuplicatsInArray(optionArr);
	
	$(dialogBox).addClass('dialog-body');
	document.body.appendChild(dialogBox);
	$.get('resource/new-sheet-templates/multselect.template',
		function( data ) {
            $(dialogBox).html(data);
            initMultSelect(forSelectionData[strNameOfElem],alreadySelectedStr);
        },
        'text'
    );

    $(dialogBox).dialog ({
        autoOpen : true,
        resizable : true,
        title: '鼠标双点进行工程选择和退选',
        height: 'auto',
        width: 'auto',
        modal : true,
        buttons: {
            '确定': function(){
                var selVal = [];
                var selViewVal=[];
                $("#selectR", dialogBox).find("option").each(function(){
                    selVal.push(this.value);
                    selViewVal.push(this.text);
                });
                if (typeof(strNameOfBiaoShiElem) != 'undefined') {
                	if ($(parentContainer).find('[name=' + strNameOfBiaoShiElem + ']')[0].type=='select-one') {
                		if (selVal.length > 1) {
                			$(parentContainer).find('[name=' + strNameOfBiaoShiElem + ']')
                				.append("<option value=\"" + selVal.join(",") + "\">" + selViewVal.join(",") + "</option>")
                				.val(selVal.join(","));
                		}
                		$(parentContainer).find('[name=' + strNameOfBiaoShiElem + ']').val(selVal.join(","));                	                		                		
                	} else {
                		$(parentContainer).find('[name=' + strNameOfBiaoShiElem + ']').val(selVal.join(","));                	                		                		
                	}
                }
                $(theDOMElem).val(selViewVal.join(","));
                $(theDOMElem).trigger('change');
                //多选放在dialog里面时，退出后的焦点不清楚落在哪里了，在点击dialog之外的区域时，
                //会再次触发多选的focus函数。这里控制一下焦点  - harry@2015-09-22
                $(parentContainer).find('input').not(theDOMElem)[0].focus();
                closeDialog(this);
            },
            '退出': function(){
            	$(parentContainer).find('input').not(theDOMElem)[0].focus();
            	closeDialog(this);
            },
        },
    });
    
    function initMultSelect(sourceArrayStr,selectedArrayStr){
        var selectedArray=[];
        if (selectedArrayStr) {
        	selectedArray = selectedArrayStr.split(',');
        }
        //遍历所有选项，根据已选择数据，填充待选区和已选区
        for (var i=0; i< sourceArrayStr.length; i++) {
            var item = sourceArrayStr[i].split("^");
            if ($.inArray(item[0],selectedArray)==-1){
                $("#selectL").append("<option value=\"" + item[0] + "\">" + item[1] + "</option>");  
            }else{
                $("#selectR").append("<option value=\"" + item[0] + "\">" + item[1] + "</option>");  
            }
        };
        var leftSel = $("#selectL");
        var rightSel = $("#selectR");
//        $("#toright").bind("click",function(){      
//            leftSel.find("option:selected").each(function(){
//                $(this).remove().appendTo(rightSel);
//            });
//        });
//        $("#toleft").bind("click",function(){       
//            rightSel.find("option:selected").each(function(){
//                $(this).remove().appendTo(leftSel);
//            });
//        });
        leftSel.dblclick(function(){
            $(this).find("option:selected").each(function(){
                $(this).remove().appendTo(rightSel);
            });
        });
        rightSel.dblclick(function(){
            $(this).find("option:selected").each(function(){
                $(this).remove().appendTo(leftSel);
            });
        });
    }
}

/*
 * 调取并填充产品报测变动规格的函数。
 * 前提：	无。
 * 输入：	参数1：string, 单据号；
 * 			参数2：string, 定制指标填充到的那个元素的selector字符;
 * 			参数3：integer, 填充时，每行的显示指标数量；
 * 			参数4: String, 调用指标将从事的工作。 
 * 出口：	返回调用本函数的页面
 * 返回：	无。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-20
 * 
 * 调用者：	1）报测量函数 ：orderArrangementUtils包中recordResults函数。
 * 			2）记录测量结果函数。
 */
function getAndFillGeneralCustomizingSpecs(theID, theChangGuiGuiGeAttacher, theColumnCount, theAction){				
	var specs = null, outData = '报测变动规格&engine=static';
	if (theAction=='测量记录') {
		outData += '&CeLiangDanHao=' + theID;
	} else {
		outData += '&DingDanDaiMa=' + theID;
		if (theAction == '报安装') {
			outData += '&BiTian=true';
		}
	}
	specs = getSheetData(outData, 'getQueryResult.do','json');
	if (specs === false) return false;
	if (specs.length == 0) return specs;
	var htmlContent = '';
	//变量GuiGeLaiYuanShiBieFu临时存储变动规格的类型识别信息。
	var GuiGeLaiYuanShiBieFu = specs[0]['XiLieBiaoShi'] + specs[0]['ChanPinLeiBie'];
	if (GuiGeLaiYuanShiBieFu == '') {
		specs = [];
	} else {
		//当不同产品类别在一张测量单上时，显示时需对每个产品类别各自的指标分区显示，
		//为实现theColumnCount参数的作用，每个产品类别的指标计数segmentSpecCount都要在处理下一个产品类别时清零。
		var segmentSpecCount=0;
		var LeiXing = '产品';
		if (specs[0]['XiLieBiaoShi']) LeiXing = '系列';
		htmlContent = '<span class="label-as-badge">' + LeiXing + '</span><span style="font-weight:bold;color:blue">' 
			+ specs[0]['ChanPinLeiBie'] + '</span>需填写如下' + theAction + '工程：<br/>';
		for (var i = 0; i < specs.length; i++) {
			if (specs[i]['XiLieBiaoShi'] + specs[i]['ChanPinLeiBie'] != GuiGeLaiYuanShiBieFu) {
				GuiGeLaiYuanShiBieFu = specs[i]['XiLieBiaoShi'] + specs[i]['ChanPinLeiBie'];
				if (specs[i]['XiLieBiaoShi']) {
					LeiXing = '系列';
				} else {
					LeiXing = '产品';
				};
				htmlContent += '<br/><span class="label-as-badge">' + LeiXing + '</span><span style="font-weight:bold;color:blue">' 
					+ specs[i]['ChanPinLeiBie'] + '</span>需填写如下' + theAction + '工程：<br/>';
				segmentSpecCount=0;
			}
			if (segmentSpecCount == 0){
				htmlContent += '<div>';
			} else if (segmentSpecCount % theColumnCount == 0) {
				htmlContent += '</div><div>';
			}
			var hanghao;
			if (theAction=='报测量' || theAction=='报安装') {
				hanghao = i;
			} else {
				hanghao = specs[i]['HangHao'];
			}
			if (specs[i]['ShuJuLeiXing']=='select') {
				//selectOptions变量存储配置的指标可选项。
				var selectOptions = specs[i]['KeXuanXiang'].split(',');
				htmlContent += '<div class="inline"><label for="GuiGeMingCheng' + hanghao +'" class="baselength-label">' 
					+ specs[i]['GuiGeMingCheng'] + '：</label><select name="GuiGeMingCheng' + hanghao 
					+ '" class="baselength-select';
				if (specs[i]['BiTianXiangMu']) {
					htmlContent += ' not-empty"><option value="" disabled selected style="display:none">必选项</option>';
					if (theAction == '报测量') {
						htmlContent += '<option value="未询问">未询问</option>';						
					}
				} else {
					htmlContent += '"><option></option>';
				}
				for (var j = 0; j < selectOptions.length; j++) {
					htmlContent += '<option value=' + selectOptions[j] + '>' + selectOptions[j] + '</option>';
				}
				htmlContent += '</select>';
			} else {
				htmlContent += '<div class="inline"><label for="GuiGeMingCheng' + hanghao +'" class="baselength-label">'
					+ specs[i]['GuiGeMingCheng'] + '：</label><input name="GuiGeMingCheng' + hanghao; 
				if (specs[i]['ShuJuLeiXing']=='number') {
					htmlContent += '" type="text" class="baselength-select number';
				} else {
					htmlContent += '" type="text" class="baselength-select';
				}
				if (specs[i]['BiTianXiangMu']) {
					htmlContent += ' not-empty';
				}
				htmlContent += '">';				
				if (specs[i]['ShuZiDanWei']) htmlContent += '&nbsp;' + specs[i]['ShuZiDanWei'];
			}
			htmlContent += '</div>';
			segmentSpecCount++;
		}
		$(theChangGuiGuiGeAttacher).append(htmlContent).show();
		standardizingUI(theChangGuiGuiGeAttacher);
		$(theChangGuiGuiGeAttacher).find('select').val('').trigger('change');
	};
	return specs;
};

function checkMeasureRecords(theOrderID) {
	var dialogBody = createMeasurementRecordContent(theOrderID);
	if (dialogBody == null) {
		showupMessageInDialog('该订单没有已经完成的测量单记录！', '查无记录');
		return;
	}
	document.body.appendChild(dialogBody);
	$(dialogBody).dialog({
		title: '调看测量记录单',
		autoOpen : false,
		modal: false,
		width : 1250,
		height : 400,
		buttons: {
			"好了": function() {
				closeDialog(this);
			},
		}
	});
	standardizingUI(dialogBody);
	$(dialogBody).dialog('open');
	showupMeasurementRecord($('#measurementCount').val(), dialogBody);
	$(dialogBody).dialog({position: {my:'right top', at:'right top', of:'body'}});
}

/*
 * 调取并填充测量单简报信息，包括的函数。
 * 前提：	无。
 * 输入：	参数1：string, 单据号；
 * 			参数2：string, 定制指标填充到的那个元素的selector字符;
 * 			参数3：integer, 填充时，每行的显示指标数量；
 * 			参数4: String, 调用指标将从事的工作。 
 * 出口：	返回调用本函数的页面
 * 返回：	无。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-20
 * 
 * 调用者：	1）报测量函数 ：orderArrangementUtils包中recordResults函数。
 * 			2）记录测量结果函数。
 */
function createMeasurementRecordContent(theOrderID){
	var hasMeasurementSheet = false;
	var theSheetCount = [];
	$.post('getQueryResult.do', 'infoType=测量单简报&engine=static&DingDanDaiMa='+theOrderID, function(data){
		if (data.status != 'OK') {
			ajaxJsonErrorHandler(data);
			hasMeasurementSheet = false;
			return false;
		}
		if (data.hasData=='FALSE') {
			hasMeasurementSheet = false;
			return false;
		}
		hasMeasurementSheet = true;
		theSheetCount = data.rows;
	},'json');
	
	if (!hasMeasurementSheet) return null;
	var measurementBody = document.createElement('div');
	measurementBody.className = 'dialog-body';
	
	var htmlContent = '<div class="inline" style="width:10%; height:5rem; margin-top:2rem">第&nbsp;'
		+ '<select id="measurementCount" onchange="showupMeasurementRecord(this);" style="width:3rem">';
	for (var i = theSheetCount.length ; i > 0; i--){
		htmlContent += '<option value="' + theSheetCount[i-1]['CeLiangDanHao'] + '">' + i + '</option>';
	}
	htmlContent +='</select>&nbsp;次测量</div>'
		+ '<div id="measurementRecord" class="inline box-rightsection" style="width: 89%"></div>';
	htmlContent +='<div style="margin-top:5px"><table id="measurementDetail" class="grid"></table></div>';
	
	measurementBody.innerHTML = htmlContent;
	return measurementBody;
};

function showupMeasurementRecord(objOrSheetId, parentContainer) {
	var sheetId = '';
	if (typeof objOrSheetId != 'string'){
		parentContainer = iniContextObject(objOrSheetId, '.dialog-body');
		sheetId = objOrSheetId.value;
	} else {
		sheetId = objOrSheetId;
	}
	$(parentContainer).find('#measurementDetail').jqGrid({
		datatype : 'local',
		jsonReader : {repeatitems: false, id: 'HangHao'},
		colModel : [
            {label:'行号', name:'HangHao', index:'HangHao', hidden:true},
            {label:'订单行', name:'DingDanHangHao', index:'DingDanHangHao', width:15, align:'center'},
            {label:'订单型号', name:'GuiGeXingHao', index:'GuiGeXingHao', width:70},
            {label:'测量单工程', name:'CeLiangXingHao', index:'CeLiangXiangHao', width:70},
            {label:'报测数据', name:'ShengBaoShuLiang', index:'ShengBaoShuLiang', width:20, align:'center', formatter: qtyFormatter},
            {label:'实测数据', name:'ShiCeShuJu', index:'ShiCeShuJu', width:20, align:'center', formatter: qtyFormatter}, 
            {label:'实测其他规格指标',name:'HangDingZhiGuiGeJiLu', index:'HangDingZhiGuiGeJiLu',width:140, 
            	formatter: function(cellvalue, options, rowObject){
            		if (cellvalue == null) return '';
	        		if (cellvalue) {
	        			cellvalue = '<span class="label-as-badge">' + cellvalue;
	        			cellvalue = cellvalue.replace(/:/g,'</span>');
	        			cellvalue = cellvalue.replace(/;/g,';&nbsp;&nbsp;<span class="label-as-badge">');
	        		}
	        		return cellvalue;
	        	}
            },
            {label:'备注', name:'HangBeiZhu', index:'HangBeiZhu', width:50},
            {label:'单位', name:'DanWei', index:'DanWei', hidden:true},
        ],
        cmTemplate : {sortable : false},
        gridview : true,
        rownumbers : false,
        viewrecords : true,
        caption : '',
        hidegrid: false,
        height : 160,
        autowidth: true,
	});
	
	function qtyFormatter(cellvalue, options, rowObject){
		if (!cellvalue) return '';
		if (!isNaN(parseFloat(cellvalue))) cellvalue = parseFloat(cellvalue);
		if (rowObject['DanWei']!=null) cellvalue = cellvalue + rowObject['DanWei'];
		var dateback = cellvalue;
		return dateback;
	}
	
	var CeLiangDanHead = getSheetData('测量单表头&engine=table&id='+sheetId, 'getQueryResult.do', 'json');
	if (CeLiangDanHead === false) return false;
	CeLiangDanHead = CeLiangDanHead[0];
	var CeLiangDanLines = getSheetData('测量单明细&engine=table&id='+sheetId, 'getQueryResult.do', 'json');
	if (CeLiangDanLines === false) return false;
	
	if (!$(parentContainer).find('#measurementRecord').html()) {
		$.get('resource/dispatcher-templates/measurementSheetShow.template',function( data ) {
			$(parentContainer).find('#measurementRecord').append(data);
			standardizingUI($(parentContainer).find('#measurementRecord'));
		},'text');			
	}

	for (var item in CeLiangDanHead) {
		$(parentContainer).find('[name="'+ item +'"]').val(CeLiangDanHead[item]);							
		$(parentContainer).find('[name="'+ item +'"]').html(CeLiangDanHead[item]);							
	}
	
	$(parentContainer).find('#measurementDetail').setGridParam({data: CeLiangDanLines}).trigger('reloadGrid');	
}

function prepareDropDownNote(theParentId){
	var theParentIdWithoutPrefix = theParentId;
	if (theParentId.substring(0,1) == '#' || theParentId.substring(0,1) == '.') {
		theParentIdWithoutPrefix = theParentId.substring(1, theParentId.length);
	} else {
		theParentId = '#' + theParentId;
	}

	if ($(theParentId + 'dropdownNote').length == 0) {
		var dropDownElem = document.createElement('div');
		dropDownElem.setAttribute('id', theParentIdWithoutPrefix + 'dropdownNote');
		dropDownElem.className = 'dropdown dropdown-tip';
		dropDownElem.innerHTML = '<div class="dropdown-panel"></div>';
		document.body.appendChild(dropDownElem);
	}	
}

/*
 * jqGrid中，使用dropdown方式显示隐藏单元格的信息。
 * 前提：	传入参数必须遵循函数的约定。
 * 输入:		参数1, 字符串形式的符合参数，构成规则：
 * 				1）以'='作为开始符；
 * 				2）参数格式为： '=' + 参数a + '&' + 参数b ......
 * 				3）目前应包含4个参数，从前到后分别为：行标识、jqGrid选择器、dropdown显示所在列数、隐藏内容所在的单元name
 * 				4）4个参数不可缺省
 * 			参数2：boolean，dropdown是否右侧锚钉
 * 			参数3：字符，显示内容实际的换行符
 * 出口：	返回调用点，继续执行后续语句
 * 返回：	返回js对象
 * 其他:		
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-18
 * 
 */
function dropdownOnGrid(strMainParam, blnAnchorRightOptDftF, strSeparator){
	if (strMainParam.substring(0,1) != '=') {
		showupMessageInDialog('传入参数不符合调用规范，请联系系统管理员！', '调用错误', 'wrong');
		return;
	}
	if (blnAnchorRightOptDftF != undefined && typeof blnAnchorRightOptDftF == 'string') {
		strSeparator = blnAnchorRightOptDftF;
		blnAnchorRightOptDftF = false;
	}
	
	strMainParam = strMainParam.substring(1, strMainParam.length);
	var params = strMainParam.split('~');
	var theContentName = params[3];
	var theColNum = parseInt(params[2]);
	var gridSelector = params[1];
	if (gridSelector.indexOf(' ') != -1) {
		gridSelector = gridSelector.substring(gridSelector.lastIndexOf(' ')+1, gridSelector.length);
	}
	var rowId = params[0];
	var varAjax = false;
	if (params.length > 4 && params[4] == 'ajax') varAjax = true;

	prepareDropDownNote(gridSelector);
	if (blnAnchorRightOptDftF != undefined && blnAnchorRightOptDftF == true) {
		$(gridSelector + 'dropdownNote').addClass('dropdown-anchor-right');
	} else {
		$(gridSelector + 'dropdownNote').removeClass('dropdown-anchor-right');
	}
	
	$(gridSelector + 'dropdownNote .dropdown-panel').html('');
	
	var content = '';
	if (varAjax) {
		content = getSheetData(theContentName + '&engine=table', 'getQueryResult.do', 'text');
	} else {
		content = $(gridSelector).jqGrid('getCell', rowId, theContentName);
	}
	if (strSeparator != undefined) {
		var re = new RegExp(strSeparator,'g');
		content = content.replace(re, '<br/>' + strSeparator);
	}
	content = content.replace(/\n/g, '<br/>');		
	content = content.replace(/<br\/><br\/>/g, '<br/>');
	content = content.replace(/<br><br\/>/g, '<br/>');
	content = content.replace(/<br><br>/g, '<br/>');
	content = content.replace(/<br\/><br>/g, '<br/>');
	while (content.indexOf('<br/>') == 0) {
		content = content.substring(5);
	}
	while (content.indexOf('<br>') == 0) {
		content = content.substring(4);
	}
	
	$(gridSelector + 'dropdownNote .dropdown-panel').html(content);
	var row = $(gridSelector).find('#' + rowId);
    var cell = row[0].cells[theColNum];
    $(cell).dropdown('attach',gridSelector + 'dropdownNote');
    $(cell).dropdown('show', gridSelector + 'dropdownNote');
    $(gridSelector + 'dropdownNote').on('hide', function(event, dropdownData){
    	$(gridSelector + 'dropdownNote .dropdown-panel').html('');
    	$(cell).dropdown('detach',gridSelector + 'dropdownNote');
    });
    $(gridSelector + 'dropdownNote').zIndex($(gridSelector).zIndex() + 10);
}

//dropdown在dialog控件中有些问题，暂时没查出原因。
function changeDropdownSelect(strValue) {
	alert(strValue);
	var LabelText = strValue;
	var SHInfoType = strValue;
	var strBuzType = undefined;
	var intMinLength = 1;
	var textElems = $('.autocomplete-while-dropdownSelection');
	if (textElems.length > 1) {
		showupMessageInDialog('页面元素布局不适合调用本函数！autocomplete-while-dropdownSelection > 1', 'changeDropdownSelect','wrong');
		return;
	}
	var idElems = textElems.next('[type="hidden"]');
	if (idElems.length == 0) idElems = textElems.next('[type="hidden"]');
	var selectElems = $('.select-while-dropdownSelection');

	selectElems.hide().val('');
	textElems.show().val('');
	idElems.val('');
	
	switch (strValue) {
	case '部门':
		$('.select-while-dropdownSelection').show();
		textElems.hide();
		LabelText += '名称：';
		break;
	case '员工':
		LabelText += '姓名：';			
		textElems.addClass('baselength-input').removeClass('twicelength-input');
		break;
	case '佣金伙伴':
		LabelText += '姓名：';			
		SHInfoType = '销售伙伴';
		textElems.addClass('baselength-input').removeClass('twicelength-input');					
		break;
	case '外包服务商':
		LabelText += '名称：';			
		SHInfoType = '合格供应商';
		strBuzType = '外包服务';
		textElems.removeClass('baselength-input').addClass('twicelength-input');
		break;		
	case '渠道':
		LabelText += '名称：';			
		SHInfoType = '渠道伙伴';
		textElems.removeClass('baselength-input').addClass('twicelength-input');
		intMinLength = 2;
		break;		
	case '供应商':
		LabelText += '名称：';			
		SHInfoType = '合格供应商';
		textElems.removeClass('baselength-input').addClass('twicelength-input');
		intMinLength = 2;
		break;		
	}
	if (textElems.is(':visible')) {
		if (idElems.length == 0) {
			showupMessageInDialog('请检查页面元素布局！autocomplete的文字和id元素必须为紧邻同级，且id元素type=hidden！', 'changeDropdownSelect','wrong');
			return;			
		}
		iniGeneralAutoComplete(textElems, idElems, strBuzType, SHInfoType, false, intMinLength);
	}
	$('.dropdownSelect-title').text(LabelText);
}

function dropDownMsg(theAttacherSelector, theCriteria, infoType){
	var content = 'ceshi';
	$('#dropdownNote .dropdown-panel').html(content);
	$(theAttacherSelector).dropdown('attach','#dropdownNote');
	$(theAttacherSelector).dropdown('show', '#dropdownNote');
//	$.post('getQueryResult.do', 'infoType='+infoType + '&engine=static&id=' + theCriteria, function(data){
//		var r = ajaxTextProcessing(data);
//		if (r==false) return false;
//		if (r==null) {
//			content='没有相关内容';
//		} else {
//			content= infoType + '：' + r[0];
//		}
//		$('#dropdownNote .dropdown-panel').html();
//		$('#dropdownNote .dropdown-panel').html(content);
//		$(theAttacherSelector).dropdown('show', '#dropdownNote');
//	},'text');
    $('#dropdownNote').on('hide', function(event, dropdownData){
    	$('#dropdownNote .dropdown-panel').html();
    	$(theAttacherSelector).dropdown('detach','#dropdownNote');
    });
}

function uploadBulletin(){
	var uploading = document.createElement('div');
	uploading.className='dialog-body';
	uploading.id = 'bulletinUploading';
	document.body.appendChild(uploading);
	$.get('resource/comment-templates/bulletinsUploading.template',function( data ) {
		$.getScript('scriptsrc/plusyoouUtils/bulletins.js');
		$.getScript('ueditorresource/ueditor.config.js');
		$.getScript('ueditorresource/ueditor.all.min.js');
		$.getScript('ueditorresource/lang/zh-cn/zh-cn.js');
		uploading.innerHTML=data;
	},'text');
	$('#uploadBtn', uploading).button();
	$(uploading).dialog({
			title : '上传公告文件',
			modal: true,
			buttons: {
				'上传': function(){
					startUploading();
				},
				"退出" : function() {
					if (document.getElementById('bulletinSource').checked) UE.getEditor('editor').destroy();
					closeDialog(this);
				},
			},
	});
	standardizingUI(uploading);
}

function deleteBulletins(theBulletinID){
	var selectRows = '';
	if (theBulletinID != undefined) {
		if (bulletinCancellingProcess(theBulletinID) == true) showupMessageInDialog('公告已撤销！', '请知晓');
		return;				
	}

	var bulletinList = document.createElement('div');
	bulletinList.className='dialog-body';
	bulletinList.innerHTML='<table id="bulletinsList"></table><div id="bulletinsListPager"></div>';
	document.body.appendChild(bulletinList);
	$('#bulletinsList').jqGrid({
		url: 'getQueryResult.do',
		datatype: 'json',
		mtype: 'POST',
		postData: {'infoType':'公告管理','engine':'table'},
		jsonReader : {repeatitems: false, id: 'GongGaoBianHao'},
		colModel : [
		     {label:'标识', name:'GongGaoBianHao', index:'GongGaoBianHao', hidden:true, width:20},
		     {label:'公告标题', name:'GongGaoBiaoTi', index:'GongGaoBiaoTi', width:140},
		     {label:'紧急', name:'ShiFouJinJi', index:'ShiFouJinJi', align:'center', 
		    	 formatter:'checkbox', 
		    	 editoptions:{value: 'true:false'}, 
		    	 width:20},
		     {label:'发布天数', name:'FaBuTianShu', index:'FaBuTianShu', align:'center', width:30,
		    	 formatter: function(cellvalue, options, rowObject){
   					return rowObject['FaBuTianShu'] + '天';       					
	       		}
		     },
		     {label:'发布人', name:'FaBuRen', index:'FaBuRen', width:30}, 
		     {label:'发布时间', name:'FaBuShiJian', index:'FaBuShiJian',	
		    	 formatter: 'date', formatoptions:{srcformat:'u', newformat:'ISO8601Long'}, width:70},
		     ],
	    onSelectRow: function (id){
	    	selectRows = $("#bulletinsList").getGridParam('selarrrow').join();
	    	console.log('单选：' + selectRows);
	    },
		cmTemplate : {sortable : true},
		gridview : true,
		rownumbers : true,
		rowNum: 8,
		loadonce: false,
		viewrecords : true,
		pager : '#bulletinsListPager',
		caption : '',
		hidegrid: false,
		multiselect : true,
		multiboxonly : true,
		height : 190,
		width : 800,
		onSelectAll : function(aRowids, status) {
			if (status) {
				selectRows = aRowids.join();
			} else {
				selectRows = null;
			}
			console.log('多选：' + selectRows);
		}
	});
	$('#bulletinsList').jqGrid('navGrid', '#bulletinsListPager',{edit:false, add:false,del:false, refresh:true, search:false,
		beforeRefresh:function(){
			selectRows = null;
		}
	});
	
	$(bulletinList).dialog({
		title : '撤销公告文件',
		modal: false,
		buttons: {
			'撤销公告': function(){
				if (selectRows=='') {
					showupMessageInDialog('请选中一条公告后再进行撤销操作！', '操作错误', 'wrong');
				} else {
					var deleteResult = bulletinCancellingProcess(selectRows); 
					if ( deleteResult == null) {
						showupMessageInDialog('公告已撤销！', '请知晓');
						$('#bulletinsList').trigger("reloadGrid");
					}					
				}
			},
			"退出" : function() {
				closeDialog(this);
			},
		},
	});

	function bulletinCancellingProcess(theBulletinIds){
		var returnResult = '';
		$.get('fileUploading.do', 'action=delete&id=' + theBulletinIds, function(data){
			returnResult = ajaxJsonErrorHandler(data);
		}, 'json');			
		return returnResult;
	}
}

//var msgRows = [];
function viewBulletins(theMsgId) {
	var msgRows = [];
	var alreadyHasMsg = false;
//	var msgCache = msgRows;
	var queryingStr = 'infoType=公告信息';
	if (theMsgId != undefined && theMsgId.indexOf('help/') != -1) {
		msgRows.push(theMsgId+ '^管理员^^^帮助文件');
	} else {
		if (cache['bulletins']) msgRows = cache['bulletins']; 
		if (theMsgId != undefined) {
			for (var j = 0; j < msgRows.length; j++) {
				if (msgRows[j].indexOf(theMsgId) != -1) {
//					msgCache = msgRows;
					msgRows = msgRows.splice(j, 1);
					alreadyHasMsg = true;
					break;
				}
			}
			if (alreadyHasMsg == false) queryingStr += '&bulletinNo=' + theMsgId;
		}
		if (!alreadyHasMsg) {
			updateBulletins(queryingStr, theMsgId);
//			msgCache = msgRows;
			if (cache['bulletins']) msgRows = cache['bulletins'];
		}		
	}
	
	if (msgRows.length==0) return; 
	
	var bulletin = document.createElement('div');
	bulletin.style.background='PowderBlue';
	bulletin.style.textAlign="center";
	bulletin.innerHTML = '<button id="closeBtn" style="float:right; margin-top: 5px; padding: 0px" class="small-imgbtn small-round-imgbtn">'
		+ '<img src="resource/close.png" title="关闭"/></button>'
		+ '<div id="msgTitle" style="padding-top:5px"></div>'
		+ '<iframe width="100%" height="87%" style="background-color:white; font-size:1rem; margin-top:-5px" id="msgBody"></iframe>'
		+ '<div style="float:right; margin-right:2px; margin-top:10px; padding:0;">'
		+ '<span id="msgPager" class="badge" style="vertical-align:top"></span>'
		+ '<span style="margin-left:20px"><button id="prevBtn" style="padding:0;" class="small-imgbtn small-round-imgbtn"><img src="resource/previous.png" title="上一条"/></button>'
		+ '<button id="nextBtn" style="padding:0;" class="small-imgbtn small-round-imgbtn"><img src="resource/next.png" title="下一条"/></button></span>' 
		+ '</div>'
		+ '<div id="msgFoot" class="fontAt9px" style="color: black; margin-top:10px; text-align:center; vertical-align:bottom"></div>';
//		+ '<div id="msgPager" style="float: right; margin-top:-25px;" class="badge"></div>';
	bulletin.className='popups dialog-body';
	document.body.appendChild(bulletin);
	if (msgRows.length==1) {
		document.getElementById('nextBtn').style.visibility='hidden';
		document.getElementById('prevBtn').style.visibility='hidden';
	};
	$(bulletin).dialog({
		width: 1000,
		height: 600,
		show: true,
	});
	
	var msgPosition = -1;
	
	bulletin.querySelector('#closeBtn').addEventListener('click', function(){closeDialog(bulletin);}, false);
	bulletin.querySelector('#nextBtn').addEventListener('click', nextMsg, false);
	bulletin.querySelector('#prevBtn').addEventListener('click', previousMsg, false);
	
	function nextMsg(){
		msgPosition++;
		if (msgPosition==0) {
			document.getElementById('prevBtn').style.visibility='hidden';
		} else {
			if (msgRows.length > 0) document.getElementById('prevBtn').style.visibility='visible';
		}
		refreshDialog();
		if (msgPosition >= msgRows.length-1 && (msgRows.length > 0)) {
			msgPosition = msgRows.length-1;
			document.getElementById('nextBtn').style.visibility='hidden';
		}
	}
			
	function previousMsg(){
		msgPosition--;
		if (msgPosition==msgRows.length-1) {
			document.getElementById('nextBtn').style.visibility='hidden';
		} else {
			if (msgRows.length > 0) document.getElementById('nextBtn').style.visibility='visible';
		};
		refreshDialog();
		if (msgPosition == 0 && (msgRows.length > 0)) {
			document.getElementById('prevBtn').style.visibility='hidden';
		}
	}
	
	$(".ui-dialog-titlebar").hide();
	$('#nextBtn').click();
//	msgRows = msgCache;
	
	function refreshDialog(){
		$(bulletin).dialog('close');
		var msgFile = msgRows[msgPosition].split('^');
		document.getElementById('msgTitle').innerHTML='<p style="color: black; font-size: 16px; margin-top:0; text-align:center">' + msgFile[4] + '</p>';
		document.getElementById('msgBody').setAttribute('src', msgFile[0]);
		document.getElementById('msgFoot').innerHTML='&quot;' + msgFile[1] + '&quot;&nbsp;&nbsp;发布于' + msgFile[2];
		document.getElementById('msgPager').innerHTML='共' + msgRows.length + '条&nbsp;&nbsp;&nbsp;此条为第' + (msgPosition + 1) + '条';
		$(bulletin).dialog('open');
	};
}

function updateBulletins(queryingStr, theMsgId){
	if (!queryingStr) {
		showupMessageInDialog('函数传递参数不正确，请检查程序！', 'updateBulletins函数告警', 'wrong');
		return false;
	}
	queryingStr += '&engine=static';
	$.post('getQueryResult.do', queryingStr, function(data){
		var msgRows = ajaxTextProcessing(data);
		if (msgRows == false || msgRows == null) {
			msgRows = [];
			delete cache['bulletins'];
		} else {
			cache['bulletins'] = msgRows;
		}
		if (theMsgId == undefined && $('#dropdownBulletins').length > 0) {
			var htmlContent = '';
			for (var i = 0; i < msgRows.length; i++) {
				var individualMsg = msgRows[i].split('^');
				htmlContent += '<li><a href="javascript:void viewBulletins(\'' + individualMsg[3] + '\');"><font color="blue">' 
					+ individualMsg[1] + '：</font><em>' + individualMsg[4]+'</em></a></li>';
			}
			if (htmlContent != '') {
				$('#dropdownBulletins ul').html(htmlContent);
			}
		}
	}, 'text');		
}

function batchUpdateBackOfficeData(theActionRows) {
	var batchResult = false;
	$.post('manipulating.do', 'dataStream=' + JSON.stringify(theActionRows), 
		function(data){
			console.log('批量更新返回：');
			console.log(data);
			if (data.status!='OK') {
				ajaxJsonErrorHandler(data);
				batchResult = false;
			} else {
				batchResult = data;
			}
	},'json');
	return batchResult;
}

function getAjaxResultWithDf(deferredObj, strURL, strData, strMethod) {		
	$.ajax({
		url : strURL,
		type : strMethod,
		data : strData,
		dataType : 'json',
		cache : false,
		async : true,
		success : function( data ) {
			if (ajaxJsonErrorHandler(data)) {
				deferredObj.returnData = data.rows;
				deferredObj.resolve();
			} else {
				deferredObj.reject();
			}
		},
	});			
}

function checkCustomizingSO(strDingDanDaiMa) {
	var returnResult = null;
	$.post('getQueryResult.do', 'infoType=确认单品定制&engine=table&DingDanDaiMa='+strDingDanDaiMa, function(data) {
		console.log(data);
		var r = ajaxTextProcessing(data);
		console.log(r === false);
		console.log(r === null);
		if (r === false || r === null) {
			returnResult = null;
		} else if (r[0] != '0') {
			returnResult = true;
		} else {
			returnResult = false;
		}
	},'text');
	return returnResult;
}

function cacheOriginalRow(theGrid, theRowId){
	var gridId = '';
	if (theGrid instanceof jQuery) {
		gridId = '#' + theGrid.prop('id');
	} else {
		gridId = theGrid;
		theGrid= $(theGrid);
	}
	var currentRow = theGrid.jqGrid('getRowData', theRowId);
	cache[gridId + 'Grid//' + theRowId] = currentRow;
}

function restoreOriginalRow(theGrid, theRowId){
	var gridId = '';
	if (theGrid instanceof jQuery) {
		gridId = '#' + theGrid.prop('id');
	} else {
		gridId = theGrid;
		theGrid= $(theGrid);
	}
	var originalRow = cache[gridId + 'Grid//' + theRowId];
	theGrid.jqGrid('setRowData', theRowId, originalRow);
}


function getGridCaption(theGrid, theLocator) {
	var gridId = '';
	if (theGrid instanceof jQuery) {
		gridId = theGrid.prop('id');
	} else {
		gridId = theGrid;
	}
	if (gridId.substring(0,1) == '#') gridId = gridId.substring(1, gridId.length); 
	var gridCaption = $('#gview_' + gridId + ' .ui-jqgrid-title').html();
	if (theLocator != undefined && gridCaption.indexOf(theLocator) != -1) {
		gridCaption = gridCaption.substring(0, gridCaption.indexOf(theLocator));
	}
	return gridCaption;
}

function reQueryingGrid(strGridSelector, intNoOfCriteriasDft, strQueryingTypeDft, jqObjConnectedGridOpt) {
	if (strGridSelector == undefined) {
		showupMessageInDialog('参数错误：<span class="ui-state-error">没有指定表格的标识！'
			+ '</span>，请检查调用参数！', '调用错误', 'wrong');
		return;
	}
	var theGrid;
	if (strGridSelector instanceof jQuery) {
		theGrid = strGridSelector;
		strGridSelector = strGridSelector.selector;
	} else {
		theGrid = $(strGridSelector);
	}
	if (theGrid.length == 0) {
		showupMessageInDialog('参数错误：<span class="ui-state-error">指定的表格不存在！'
			+ '</span>，请检查调用参数！', '调用错误', 'wrong');
		return;
	}
	
	var nameOfTemplate = '';
	
	//管理可选参数的情况，重新配置内部参数。
	if (strQueryingTypeDft != undefined && (typeof strQueryingTypeDft === 'object')) {
		jqObjConnectedGridOpt = strQueryingTypeDft;
		strQueryingTypeDft = '';
	} else if (strQueryingTypeDft == undefined ) {
		strQueryingTypeDft = '';
	}
	
	var willPostData = $(strGridSelector).getGridParam('postData');
	if (strQueryingTypeDft == '') {
		strQueryingTypeDft = willPostData['infoType'];
	}

	if ('订单安排测量,已安排测量订单,测量完成订单,已安排送货订单,已送达订单,可派工订单,已派工订单,已完工订单,已派货订单,库存单,订货重新查询,派货重新查询,订单安装计划,订单安排派车,订单安排派工,订单安排订货,已订货订单,已确单订单'.indexOf(strQueryingTypeDft)!=-1) {
		nameOfTemplate = 'resource/query-criteria-templates/dispatchedOrders.template';
	} else if ('订单变动费用计算表,安装退库查询,安装结算查询,订单出入库列表'.indexOf(strQueryingTypeDft) !=-1) {
		nameOfTemplate = 'resource/query-criteria-templates/orderFinalizingQuerying.template';		
	} else if ('单品历史销售价格'.indexOf(strQueryingTypeDft) != -1) {
		nameOfTemplate = 'resource/widgets-templates/itemPriceHistory.template';				
	} else if ('未交回安装单,退库未完安装单'.indexOf(strQueryingTypeDft) != -1){
		nameOfTemplate = 'resource/query-criteria-templates/installationNoticeQuerying.template';						
	} else if ('未考评提成,未发放提成,提成工资支付,提成费用支付'.indexOf(strQueryingTypeDft) != -1){
		nameOfTemplate = 'resource/query-criteria-templates/commissionsQuery.template';	
	} else if ('未确认收入'.indexOf(strQueryingTypeDft) != -1) {
		nameOfTemplate = 'resource/query-criteria-templates/incomeQuerying.template';		
	} else if ('支付申请'.indexOf(strQueryingTypeDft) != -1) {
		nameOfTemplate = 'resource/query-criteria-templates/costQuerying.template';		
	} else if ('未审批付款工程,未支付付款工程'.indexOf(strQueryingTypeDft) != -1) {
		nameOfTemplate = 'resource/query-criteria-templates/payments.template';								
	} else {
		nameOfTemplate = 'resource/query-criteria-templates/dispatchedOrders.template';
	}
	
	if (!nameOfTemplate){
		showupMessageInDialog('参数错误：<span class="ui-state-highlight">没有找到查询模板标识！'
			+ '</span>，请检查调用参数！', '调用错误', 'wrong');
		return;	
	}

	var dialogBox = document.createElement('div');
	document.body.appendChild(dialogBox);
	dialogBox.setAttribute('id', 'reQueryGridDialog');
	dialogBox.className = 'dialog-body';
	if (intNoOfCriteriasDft== undefined || isNaN(intNoOfCriteriasDft)) intNoOfCriteriasDft = 1;
	//加载查询模板，并进行统一初始化数据的填充。
	$.get(nameOfTemplate, function(data) {$(dialogBox).append(data);},'text');
	
	if (intNoOfCriteriasDft != 0) {
		$('#reQueryGridDialog legend').html('请至少设置<span style="color:blue">&nbsp;' + intNoOfCriteriasDft + '&nbsp;</span>个查询条件');				
	} else {
		$('#reQueryGridDialog legend').html('允许不设查询条件');								
	}
	fillInSaleUnit(true);
	fillInIncomingCategory('#reQueryGridDialog .income-method');
	
	$(".date-picker-elem").datepicker($.datepicker.regional["zh-CN"]);
	$('#reQueryGridDialog .AnZhuangRenFillIn').hide();
	$('#reQueryGridDialog .KuCunDanFillIn').hide();
	
	var dialogTitle = '查询' + strQueryingTypeDft;
	
	switch (strQueryingTypeDft) {
	case '库存单':
		if (willPostData.registered) {
			dialogTitle = '查询已记账【' + willPostData.type + '】' + strQueryingTypeDft;
		} else {
			dialogTitle = '查询未记账【' + willPostData.type + '】' + strQueryingTypeDft;						
		}
		$('#reQueryGridDialog .KuCunDanFillIn').show();
		fillInStaticInfo('仓库&engine=static', 'getQueryResult.do', '#reQueryGridDialog .stocks');
		fillInStaticInfo('库存业务类型&engine=static&subType=' + willPostData.type, 'getQueryResult.do', '.stock-sheet-buzType', true, true);
		break;
	case '已派工订单':
	case '已完工订单':
		$('#reQueryGridDialog .AnZhuangRenFillIn').show();
		iniGeneralAutoComplete($('#reQueryGridDialog [name="AnZhuangRenXingMing"]')
			, $('#reQueryGridDialog #AnZhuangRenId'), '安装', '员工', false, 1);
		break;
	case '订货重新查询':
		dialogTitle = '查询可多次订货的订单';
		willPostData['infoType'] = strQueryingTypeDft;
		break;
	case '派货重新查询':
		dialogTitle = '查询派货或补货的订单';
		willPostData['infoType'] = strQueryingTypeDft;
		break;
	case '安装结算查询':
		dialogTitle = '查询满足结算条件的订单';
		iniGeneralAutoComplete($('#reQueryGridDialog [name="AnZhuangRenXingMing"]')
			, $('#reQueryGridDialog #AnZhuangRenId'), '安装', '员工', false, 1);
		break;
	case '安装退库查询':
		dialogTitle = '查询可退库的订单';
		iniGeneralAutoComplete($('#reQueryGridDialog [name="AnZhuangRenXingMing"]')
			, $('#reQueryGridDialog #AnZhuangRenId'), '安装', '员工', false, 1);
		break;
	case '订单出入库列表':
		dialogTitle = '查询已派货出库的订单';
		iniGeneralAutoComplete($('#reQueryGridDialog [name="AnZhuangRenXingMing"]')
				, $('#reQueryGridDialog #AnZhuangRenId'), '安装', '员工', false, 1);
		break;
	case '订单安装计划':
		dialogTitle = '查询已报安装的订单';
		$('#reQueryGridDialog .XiaoShouDanWeiFillIn').hide();
		break;
	case '单品历史销售价格':
		dialogTitle = '查询历史销售价格，货物名称必须设置';
		iniGeneralAutoComplete($('#reQueryGridDialog [name="HuoWuMingCheng"]')
				, $('#reQueryGridDialog #inventoryId'), '实物', '货物视图', false, 2);
		break;
	case '未确认收入':
		iniGeneralAutoComplete($('#reQueryGridDialog [name="JiaoKuanRenXingMing"]'), $('#reQueryGridDialog [name="JiaoKuanRen"]'), undefined, '员工', false, 1);
		break;
	case '未考评提成':
	case '未发放提成':
	case '提成工资支付':
	case '提成费用支付':
		iniGeneralAutoComplete($('#reQueryGridDialog [name="RenYuanXingMing"]'), $('#reQueryGridDialog [name="DuiFangBiaoShi"]'),undefined, '员工', false, 1);
		iniGeneralAutoComplete($('#reQueryGridDialog [name="HuoBanXingMing"]'), $('#reQueryGridDialog [name="DuiFangBiaoShi"]'),undefined, '销售伙伴', false, 1);
		iniGeneralAutoComplete($('#reQueryGridDialog [name="FuWuShangMingCheng"]'), $('#reQueryGridDialog [name="DuiFangBiaoShi"]'),undefined, '合格供应商', false, 1);		
		break;
	case '退库未完安装单':
	case '未交回安装单':
		iniGeneralAutoComplete($('#reQueryGridDialog [name="AnZhuangRenXingMing"]'), $('#reQueryGridDialog #AnZhuangRenId'), '安装', '员工', false, 1);
		break;
	}

	$(dialogBox).dialog ({
		title : dialogTitle,
		position: {my:'center', at:'center', of: window},
		buttons: {
			'查询' : function() {
				if (!checkQuatityOfQueryCriterias('#reQueryGridDialog', intNoOfCriteriasDft)) {
					showupMessageInDialog('请至少设定<span class="ui-state-highlight">' + intNoOfCriteriasDft + '条</span>查询条件！</P>', '错误','wrong');
					return false;
				}
				if ($('#reQueryGridDialog [name="AnZhuangRenXingMing"]').hasClass('autocomplete') 
						&& $('#reQueryGridDialog [name="AnZhuangRenXingMing"]').is(':visible')) {
					if ($('#reQueryGridDialog [name="AnZhuangRenXingMing"]').val()!='' && $('#reQueryGridDialog #AnZhuangRenId').val()=='') {
						showupHelpMessage($('#reQueryGridDialog [name="AnZhuangRenXingMing"]')[0], '安装人名字只能从查询出的下拉选项中选择，不能自行输入！');
						return;
					}
				}
				if ($('#reQueryGridDialog [name="HuoWuMingCheng"]').is(':visible')) {
					if ($('#reQueryGridDialog [name="HuoWuMingCheng"]').val()!='' && $('#reQueryGridDialog #inventoryId').val()=='') {
						showupHelpMessage($('#reQueryGridDialog [name="HuoWuMingCheng"]')[0], '货物名称只能从查询出的下拉选项中选择，不能自行输入！');
						return;
					}
				}
								
				if (checkValidation('#reQueryGridDialog') && autoCompleteCheck('#reQueryGridDialog')) {
					var paramsObj = serializeObject('#reQueryGridDialog');
					console.log(paramsObj);
					var paramsInString = 'infoType=' + strQueryingTypeDft;
					for (var Title in paramsObj) {
						if (paramsObj[Title]) {
							paramsInString += '&' + Title + '=' + paramsObj[Title];
						}
					}
					var gridCaption = getGridCaption(strGridSelector, '<span>【');
					if ($.isEmptyObject(paramsObj)) {
						if (strQueryingTypeDft == '订单安装计划') {
							paramsObj['date'] = strPickedDate;
							gridCaption = '【' + strShow + '】' + gridCaption;
						} else if (strQueryingTypeDft == '库存单') {
							gridCaption = getGridCaption(strGridSelector);
							if (willPostData['registered']) {
								paramsObj['WeiYiRiQi'] = nowString;
								if (willPostData['type'] != '全部') {
									paramsObj['CangKu'] = $('[name="CangKu"]').val(); 
								}
								gridCaption = gridCaption.replace(/<span class="label-as-badge badge-warning">按设定条件查询<\/span>/g,'<span class="label-as-badge badge-success">今日您</span>');
							} else {
								paramsObj['JieShuRiQi'] = nowString;
								if (willPostData['type'] != '全部') {
									paramsObj['CangKu'] = $('[name="CangKu"]').val(); 
								}
								gridCaption = gridCaption.replace(/<span class="label-as-badge badge-warning">按设定条件查询<\/span>/g,'<span class="label-as-badge badge-success">截止到今天</span>');								
							}
						} else {
							gridCaption = gridCaption + '<span>【缺省】</span>';							
						}
					} else {
						if (strQueryingTypeDft == '单品历史销售价格') {
								gridCaption = '【' + $('#reQueryGridDialog [name="HuoWuMingCheng"]').val() + '】历史价格';
								var datePeriod = '';
								if ($('#reQueryGridDialog [name="KaiShiRiQi"]').val()) {
									datePeriod = '从：<span style="font-style:italic; font-weight:bold">' 
										+ $('#reQueryGridDialog [name="KaiShiRiQi"]').val() + '</span>';
								}
								if ($('#reQueryGridDialog [name="JieShuRiQi"]').val()) {
									datePeriod += '到：<span style="font-style:italic; font-weight:bold">'
										+ $('#reQueryGridDialog [name="JieShuRiQi"]').val() + '</span>';
								}
								if ($('#reQueryGridDialog [name="OnlyNotFinish"]').prop("checked") ) {
									datePeriod += '<span style="font-style:italic; font-weight:bold">&nbsp;仅未安装订单</span>';
								}
								if (datePeriod) {
									gridCaption += '(' + datePeriod + ')';
								}
						} else if (strQueryingTypeDft == '库存单') {
							gridCaption = getGridCaption(strGridSelector);
							gridCaption = gridCaption.replace(/<span class="label-as-badge badge-success">截止到今天<\/span>/g,'<span class="label-as-badge badge-warning">按设定条件查询</span>');;
							gridCaption = gridCaption.replace(/<span class="label-as-badge badge-success">今日您<\/span>/g,'<span class="label-as-badge badge-warning">按设定条件查询</span>');
						} else {
							if (strQueryingTypeDft == '订单安装计划' && gridCaption.indexOf('</span>】') != -1) {
								gridCaption = gridCaption.substring(gridCaption.indexOf('</span>】')+8
										, gridCaption.length);
							}
							if (strQueryingTypeDft == '订单出库库列表') {
								gridCaption = '已派货出库订单列表【按设定条件查询】';
							}
							gridCaption = gridCaption + '<span>【按设定条件查询】</span>';													
						}
					}
					if ('未考评提成未发放提成提成工资支付提成费用支付'.indexOf(strQueryingTypeDft) == -1) $(strGridSelector).jqGrid('setCaption', gridCaption);
					willPostData['dataStream'] = JSON.stringify(paramsObj);
					if (strQueryingTypeDft == '派货重新查询' && $.isEmptyObject(paramsObj)) {
						willPostData['infoType'] = '订单安排派货';
					} 
					if ($(strGridSelector).getGridParam('datatype') == 'local') {
						if (willPostData['page'] != undefined) delete willPostData['page'];
						if (willPostData['rows'] != undefined) delete willPostData['rows'];
						var url = $(strGridSelector).getGridParam('url');
						var gridData = getSheetData(willPostData, url);
						cache['requeryGridData'] = gridData;
						$(strGridSelector).jqGrid('clearGridData').setGridParam({data: gridData}).trigger('reloadGrid');						
					} else {
						$(strGridSelector).setGridParam({postData: willPostData}).trigger('reloadGrid');
					}
					if (jqObjConnectedGridOpt != undefined) {
						jqObjConnectedGridOpt.jqGrid('clearGridData').trigger('reloadGrid');
						jqObjConnectedGridOpt.jqGrid('setCaption', '明细表');
					}
					closeDialog(this);
				}
			},
			"取消" : function() { 
				closeDialog(this);
			},
		},
	});
	standardizingUI('#reQueryGridDialog');
	datePickerPreparing(dialogBox,null);
}

/*
 * 根据数据对象的内容填充到页面单元，
 * 前提：	无
 * 输入：	参数1：Object, 以name:value方式传递的需要填充到编辑单元的数据；
 * 			参数2：String, 填充的范围：能覆盖所有需填充单元的父element的标识字符；
 * 出口：	返回调用本函数的页面
 * 返回：	无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2013-12-24
 * 
 * 调用者：	1）函数：iniNewEditPage
 */
function fillElementsWithData(theData, objContext, blnFillInLabelDftF, blnTriggerChangeDftT){
	if (!theData) return;
	if (blnFillInLabelDftF === undefined) blnFillInLabelDftF = false;
	if (blnTriggerChangeDftT === undefined) blnTriggerChangeDftT = true;
	objContext = iniContextObject(objContext);
	var checkboxElems = [];
	checkboxElems = $('[type="checkbox"]', objContext).not('.ui-pg-input').not('.not-fillin');
	for (var i = 0; i < checkboxElems.length; i++) {
		if (!theData.hasOwnProperty(checkboxElems[i].name)) continue;
		var isChecked = theData[checkboxElems[i].name];
		if (isChecked === undefined) continue; 
		if (typeof theData[checkboxElems[i].name] != 'boolean') {
			if (typeof theData[checkboxElems[i].name] == 'string') {
				if ( theData[checkboxElems[i].name] == 'true') {
					isChecked = true;
				} else {
					isChecked = false;
				}
			}
		} else if (!isNaN(parseInt(theData[checkboxElems[i].name]))) {
			if (parseInt(theData[checkboxElems[i].name]) == 0) {
				isChecked = false;
			} else {
				isChecked = true;
			}
		};
		checkboxElems[i].checked = isChecked;
		if (blnTriggerChangeDftT) $(checkboxElems[i]).trigger('change'); 
	}
	
	var inputElems = [];
	if (blnFillInLabelDftF) {
		inputElems = $('input, select, textarea, .content-label, label', objContext)
			.not('[type="checkbox"]').not('.ui-pg-input').not('.not-fillin').not('.ui-datepicker-year').not('.ui-datepicker-month');				
	} else {
		inputElems = $('input, select, textarea, .content-label', objContext)
			.not('[type="checkbox"]').not('.ui-pg-input').not('.not-fillin').not('.ui-datepicker-year').not('.ui-datepicker-month');		
	}
	for (var i = 0; i < inputElems.length; i++) {
		if (theData.hasOwnProperty(inputElems[i].name)) {
			if (theData[inputElems[i].name] === null) theData[inputElems[i].name] = '';
		} else if (theData.hasOwnProperty(inputElems[i].id)) {
			if (theData[inputElems[i].id] === null) theData[inputElems[i].name] = '';
		} else {
			continue;
		}
		
		if (inputElems[i].tagName == 'LABEL' || inputElems[i].className.indexOf('content-label') !=-1) {
			if (theData.hasOwnProperty(inputElems[i].id)) {
				if (theData[inputElems[i].id] != '' && theData[inputElems[i].id] != null){
					if (inputElems[i].className.indexOf('money') != -1) {
						inputElems[i].innerHTML = currencyFormatted(theData[inputElems[i].id], false);
					} else if (inputElems[i].className.indexOf('date') != -1) {
						inputElems[i].innerHTML = getDateStringFromTimeString(theData[inputElems[i].id], true);
					} else {
						inputElems[i].innerHTML = theData[inputElems[i].id];
					}
				} else {
					if(inputElems[i].className.indexOf('content-label') != -1) inputElems[i].innerHTML='&nbsp;';
				}				
			}
		} else if (inputElems[i].type=='select-one') {
				//2014-3-25将页面所有下拉选择框的填充方式均改为了异步方式，这里的填充方式是为了适应这个修改。
				//首先检查异步填充是否已经填完，如果没有，则自己生成填充内容，并记录val值。
				//如果已经填充完，则直接赋val值。 ---- Harry 2014-3-28
				//填充完，也需要检查要赋值的val是否在填充值当中，如果不在，需要单独将要赋值的val填充为单独的一个option -- Harry @ 2016-01-17
			if ($(inputElems[i]).children('option').length > 0) {
				if (theData[inputElems[i].name] && $(inputElems[i]).find('option[value="' + theData[inputElems[i].name] + '"]').length == 0) {
					var fillinData = 'OK~TRUE~' + theData[inputElems[i].name] + '^' + theData[inputElems[i].name];
					processAndFillData(fillinData, inputElems[i], false, undefined, false, true);
				}
			} else if (theData[inputElems[i].name]){
				var fillinData = 'OK~TRUE~' + theData[inputElems[i].name] + '^' + theData[inputElems[i].name];
				processAndFillData(fillinData, inputElems[i]);
			};
			inputElems[i].value = theData[inputElems[i].name];
			//赋值完成后，根据传入参数确定是否触发change事件，如果不需要，则必须单独触发placeholder事件 -- Harry @ 2016-01-17
			if (blnTriggerChangeDftT && theData[inputElems[i].name]) {
				$(inputElems[i]).trigger('change');
			} else {
				$(inputElems[i]).trigger('troggle-placeholder-color');				
			}
		} else {
			if (inputElems[i].className.indexOf('date-picker-elem') !=-1) {
				inputElems[i].value = getDateStringFromTimeString(theData[inputElems[i].name], true);
			} else if (inputElems[i].className.indexOf('ten-thousand') != -1) {
				inputElems[i].value = theData[inputElems[i].name]/10000; 
//			} else if (inputElems[i].className.indexOf('percent') != -1) {
//				inputElems[i].value = theData[inputElems[i].name]*100; 
			} else {
				inputElems[i].value = theData[inputElems[i].name];								
			}
		}
		
	};
};

function changeSkin() {
	var skinSelector = document.createElement('div');
	var userCode = '';
	skinSelector.style.textAlign="center";
	skinSelector.innerHTML = '<label style="font-weight:bold; font-style:italic; font-size:1.0rem; margin:2rem 0">'
		+ '从这里选皮肤哦&nbsp;&nbsp;&nbsp;&nbsp;</label><select id="skins" class="formated-input ui-widget-content '
		+ 'ui-corner-all baselength-select" style="margin:2rem 0"></select>';
	skinSelector.className='dialog-body';
	skinSelector.setAttribute('id', 'selectSkin');
	
	document.body.appendChild(skinSelector);
	if (document.cookie.length>0) {
		var c_start=document.cookie.indexOf('UserCode=');
		if (c_start!=-1) { 
			c_start=c_start + 9; 
			var c_end=document.cookie.indexOf(";",c_start);
			if (c_end==-1) c_end=document.cookie.length;
			userCode = document.cookie.substring(c_start,c_end);
		} 
	}
	var oldTheme = document.getElementById('pageSkin').getAttribute('href');
	$('#selectSkin').dialog({
		title: '我的皮肤选择器',
		height: 'auto',
		width: 400,
		modal: false,
		buttons: {
	 		"预览" :	function() {
	 			document.getElementById('pageSkin').setAttribute('href','css/'+document.getElementById('skins').value + '/jquery-ui-theme.css');
	 		},
	 		"应用" :	function() {
	 			var expiration_date = new Date();
	 			expiration_date.setFullYear(expiration_date.getFullYear() + 1);
	 			
	 			document.getElementById('pageSkin').setAttribute('href','css/' + document.getElementById('skins').value + '/jquery-ui-theme.css');
	 			var cookie_str = '';
	 			if(userCode == '') {
	 				cookie_str = 'pageSkin=' + escape('css/'+document.getElementById('skins').value + '/jquery-ui-theme.css');	 				
	 			} else {
	 				cookie_str = 'pageSkin@' + userCode + '=' + escape('css/'+document.getElementById('skins').value 
 						+ '/jquery-ui-theme.css') + '; expires='+ expiration_date.toGMTString();	 				
	 			}
	 			document.cookie = cookie_str;
	 			closeDialog(this);
	 		},
	 		"退出" : function() {
	 			document.getElementById('pageSkin').setAttribute('href',oldTheme);
	 			closeDialog(this);
			}
		}
	});
	fillInStaticInfo('', 'resource/skin-list.txt','#skins');
}

function getGridManipulatingActions(arrOriginalData, strGridSelectorOrArrNewData, strDomainName, strIDName, strIDValue, strDetailPKName, boolModify) {
	var tempDelRows = [], tempDelObj = {};
	var tempUpdRows = [];
	var tempInsRows = [];
	var SQLAction={}, actionRows=[];
	var arrCurrentData = [];
	if (strGridSelectorOrArrNewData instanceof Array) {
		arrCurrentData = strGridSelectorOrArrNewData;
	} else {
		arrCurrentData = eliminateNotSerializingCells($(strGridSelectorOrArrNewData));		
	}

	if (strDetailPKName == undefined) {
		strDetailPKName = 'HangHao';
	}
	
	//strPK == undefined 代表修改模式。
	//否则是删除重新插入模式。
	if (boolModify != undefined || boolModify == true) {
		//如果是修改模式，则通过strPK判断是否已经存在的条目，对这些条目形成修改action.
		for (var i = 0; i < arrCurrentData.length; i++) {
			//找出新增行
			if (arrCurrentData[i][strDetailPKName] == '') {
				arrCurrentData[i][strIDName] = strIDValue;
				tempInsRows.push(arrCurrentData[i]);
				continue;
			}
			//找出修改行
			for (var j = 0; j < arrOrginalData.length; j++) {
				if (arrCurrentData[i][strDetailPKName] == arrOrginalData[j][strDetailPKName]) {
					arrCurrentData[i][strIDName] = strIDValue;
					tempUpdRows.push(arrCurrentData[i]);
					arrOrignalData.splice(j,1);
					j--;
					continue;
				}
			}
		};
		//找出删除行
		if (arrOrginalData.length > 0) {			
			for (i = 0; i < arrOriginalData.length; i++) {
				tempDelRows.push(arrOriginal[i][strDetailPKName]);
			}
			tempDelObj[strDetailPKName] = tempDelRows.join(',');
			tempDelObj[strIDName] = strIDValue;
		}

		if (!$.isEmptyObject(tempObj)) {
			SQLAction={};
			SQLAction['action']='delete';
			SQLAction['domainName']= strDomainName;
			SQLAction['dataStream']=JSON.stringify(tempDelObj);
			actionRows.push(SQLAction);
		}
		
		if (tempUpdRows.length > 0) {
			SQLAction={};
			SQLAction['action']='update';
			SQLAction['domainName']=strDomainName;
			SQLAction['dataStream']=JSON.stringify(tempUpdRows);
			actionRows.push(SQLAction);			
		}

		if (tempInsRows.length > 0) {
			SQLAction={};
			SQLAction['action']='insert';
			SQLAction['domainName']=strDomainName;
			SQLAction['dataStream']=JSON.stringify(tempInsRows);
			actionRows.push(SQLAction);			
		}
	} else {
		for (i = 0; i < arrOriginalData.length; i++) {
			tempDelRows.push(arrOriginalData[i][strDetailPKName]);
		};
		if (tempDelRows.length !=0) {
			tempDelObj[strDetailPKName] = tempDelRows.join(',');
			tempDelObj[strIDName] = strIDValue;				
		}
		if (!$.isEmptyObject(tempDelObj)) {
			SQLAction={};
			SQLAction['action']='delete';
			SQLAction['domainName']= strDomainName;
			SQLAction['dataStream']=JSON.stringify(tempDelObj);
			actionRows.push(SQLAction);		
		}
		
		if (arrCurrentData.length != 0){
			for ( i = 0; i < arrCurrentData.length; i++) {
				arrCurrentData[i][strDetailPKName] = i + 1;
				if (typeof(strIDName) != 'undefined') {
					arrCurrentData[i][strIDName] = strIDValue;					
				}
			};
			if (arrCurrentData.length > 0) {
				SQLAction={};
				SQLAction['action']='insert';
				SQLAction['domainName']=strDomainName;
				SQLAction['dataStream']=JSON.stringify(arrCurrentData);
				actionRows.push(SQLAction);			
			}
		}
	}
	return actionRows;
};

function stockSheetLines(strId, strGridSelector, blnWithDialog) {
	if ($.isEmptyObject(strId)) {
		showupMessageInDialog('请选中一张库存单后，再查看明细内容！', '操作错误','wrong');
		return;
	}

	var stockLinesContainer = document.createElement('div');
	stockLinesContainer.innerHTML = '<div style="width:800px"><table id="stockLines" class="grid"></table></div>'
		+ '<div id="stockLinesPager" class="grid-pager"></div>';
	stockLinesContainer.className='dialog-body';
	stockLinesContainer.id = 'stockLinesDialog';
	
	document.body.appendChild(stockLinesContainer);
	var DanJuLeiXing = $(strGridSelector).jqGrid('getCell', strId , 'DanJuLeiXing');
	if (DanJuLeiXing.indexOf('<span class="py-icon py-icon-before py-icon-unpaid"></span>') != -1) {
		DanJuLeiXing = DanJuLeiXing.substr('<span class="py-icon py-icon-before py-icon-unpaid"></span>'.length);
	}
	
	var RiQi = '【' + DanJuLeiXing + '】';
	if ($(strGridSelector).jqGrid('getCell', strId , 'JiZhangRiQi')) {
		RiQi += '记账@' + $(strGridSelector).jqGrid('getCell', strId , 'JiZhangRiQi');
	} else {
		RiQi += '业务@' + $(strGridSelector).jqGrid('getCell', strId , 'DanJuRiQi');	
	}
	var detailTitle =  RiQi + '*' + $(strGridSelector).jqGrid('getCell', strId , 'ZhuCangKu');
	iniStockSheetDetailGrid(strId, '#stockLinesDialog #stockLines', false);
	$(stockLinesContainer).dialog({
		title:  detailTitle,
		buttons: {
	 		"退出" : function() {
	 			closeDialog(this);
			}
		}
	});
}

function iniStockSheetDetailGrid(strId, strGridSelector, blnWithCaptionDftT){
	if (blnWithCaptionDftT === undefined) blnWithCaptionDftT = true;
	var pagerSelector = '';
	if (strGridSelector instanceof jQuery) {
		pagerSelector = '#' + strGridSelector.prop('id') + 'Pager';
	} else if (strGridSelector.lastIndexOf(' #') != -1) {
		pagerSelector = strGridSelector.substring(strGridSelector.lastIndexOf(' #')+1) + 'Pager';
	} else {
		pagerSelector = strGridSelector + 'Pager';
	}
	var serviceDo = 'sayHello.do', dataWillGo = '';
	if (strId != undefined) {
		serviceDo = 'getQueryResult.do';
		dataWillGo = 'infoType=库存单明细&engine=table&id=' + strId;
	}
	var gridCaption = '';
	if (blnWithCaptionDftT) {
		gridCaption = '&nbsp;';
	}
	$(strGridSelector).jqGrid({
		datatype : 'json',
		url: serviceDo,
		mtype: 'post',
		postData: dataWillGo,
		colModel : [
            {label:'行号', name:'HangHao', index:'HaoHang', width:15},
            {label:'货物名称', name:'MingCheng', index:'HuoWuMingCheng', width:110},
            {label:'数量', name:'DanJuShuLiang', index:'DanJuShuLiang', width:50},
            {label:'行备注', name:'HangBeiZhu', index:'HangBeiZhu', width:100, hidden:false},
            ],
        cmTemplate : {sortable : false},
        hidegrid: false,
        pgbuttons: false,
        pginput: false,
        viewrecords : true,
        rowNum: maxGridRowNum,
        pager : pagerSelector,
        caption : gridCaption,
        height : 205,
        autowidth : true,
	});		
}

function refDetailStockSheet(strId) {
	//链接至订单详细信息
	if (!strId) {
		showupMessageInDialog('没有单据号', '参数错误', 'wrong');
		return;
	}
	var SSData = getSheetData('库存单表头&engine=table&id=' + strId, 'getQueryResult.do');
	if (!SSData) return flase;
	var stockSheetDetailContainer = document.createElement('div');
	var dialogTitle = '';
	stockSheetDetailContainer.className = 'dialog-body';
	document.body.appendChild(stockSheetDetailContainer);
	stockSheetDetailContainer.innerHTML='<fieldset style="padding:1rem;">' 
		+ '<div class="box-leftsection inline" style="width:65%;">'
		+ '<div class="row-divider no-left-margin">' 
		+ '<label class="baselength-label">单据类型：</label>'
		+ '<label id="DanJuLeiXing" class="baselength-input content-label"></label>'
		+ '<label class="baselength-label" style="margin-left:0.7rem">业务日期：</label>'
		+ '<label id="DanJuRiQi" class="baselength-input content-label date"></label>'
		+ '<label class="baselength-label" style="margin-left:0.7rem">记账日期：</label>'
		+ '<label id="JiZhangRiQi" class="baselength-input content-label date"></label>'	
		+ '</div>' 
		+ '<div class="row-divider no-left-margin">' 
		+ '<label class="baselength-label">主体仓库：</label>'
		+ '<label id="ZhuCangKu" class="twicelength-input content-label"></label>'
		+ '<label class="baselength-label">协同仓库：</label>'
		+ '<label id="FuCangKu" class="twicelength-input content-label"></label>'
		+ '</div>' 
		+ '<div class="row-divider no-left-margin">' 
		+ '<label style="margin-left: 1.5rem">制单人：</label>'
		+ '<label id="ZhiDan" class="content-label" style="width:5rem"></label>'	
		+ '<label style="margin-left:0.7rem">审批人：</label>'
		+ '<label id="ShenPi" class="content-label" style="width:5rem"></label>'	
		+ '<label style="margin-left:0.7rem">记账人：</label>'
		+ '<label id="JiZhang" class="content-label" style="width:5rem"></label>' 
		+ '<label id="JingShouRenLabel" style="margin-left:0.7rem">经手人：</label>'
		+ '<label id="JingShou" class="content-label" style="width:10rem"></label>' 
		+ '</div></div>'	
		+ '<div class="box-rightsection inline" style="width: 34%;">'
		+ '<label for="BeiZhu" class="baselength-label" style="vertical-align: top">单据备注：</label>'
		+ '<textarea name="BeiZhu" class="none-editable-content" disabled="disabled" style="height:5rem; width:65%;"></textarea>'
		+ '<br/><label for="LaiYuanDanHao" class="baselength-label">来源单号：</label>'
		+ '<label id="LaiYuanDanHao" class="content-label" style="width:65%"></label></div></fieldset>'
		+ '<div style="width:900px; margin-top:1rem"><table id="stockDetail"></table></div><div id="stockDetailPager"></div>';
	iniStockSheetDetailGrid(strId, '#stockDetail', false);

	fillElementsWithData(SSData[0], stockSheetDetailContainer);
	var BeiZhu = SSData[0]['DanJuBeiZhu'] + SSData[0]['ShenDanBeiZhu'];
	var firstChr = '';
	if(BeiZhu.substring(0,1) == '【') {
		BeiZhu = BeiZhu.substring(1);
		firstChr = '【';
	}
	BeiZhu = BeiZhu.replace(/【/g,'\n【');
	BeiZhu = firstChr + BeiZhu;
	$(stockSheetDetailContainer).find('[name="BeiZhu"]').val(BeiZhu);  
	if (SSData[0].DanJuLeiXing.indexOf('出库') != -1) {
		$('#JingShouRenLabel', stockSheetDetailContainer).html('领货人：');
	} else {
		$('#JingShouRenLabel', stockSheetDetailContainer).html('点检人：');		
	}
	dialogTitle = '库存单明细内容【单号：' + strId + '】';
	if (!SSData[0]['JiZhangRiQi']) {
		dialogTitle = '<span class="label-as-badge badge-warning">未记账</span>' + dialogTitle;
	}
	if ($('#inventoryList').jqGrid('getCell', strId, 'KeHuXingMing')) {
		dialogTitle += '（客户：' + $('#inventoryList').jqGrid('getCell', strId, 'KeHuXingMing') + '）';
	}
	
	$('#stockDetail').setGridParam({datatype : 'json', postData: 'infoType=库存单明细&engine=table&id=' + strId}).trigger('reloadGrid');						
	
	$(stockSheetDetailContainer).dialog({
		title: dialogTitle,
		buttons: {
			"退出" : function() {
				closeDialog(this);
			},
		},
	});
	
	standardizingUI(stockSheetDetailContainer);
}

function checkMaxRegisterDate(strStockId, strDateSelect, blnGetOrCheck) {
	//blnGetOrCheck：控制函数的返回值。
	//	true = get		代表返回值为日期字符串数组，含本仓库最近结存日期、本仓库最近盘点日期、系统最近结存日期；
	//	false = check 	代表返回值为boolean，true=日期在结存日期之后，false=日期在结存日期之前				
	if (strDateSelect === undefined) blnGetOrCheck = true;
	if (typeof strDateSelect == 'boolean') blnGetOrCheck = strDateSelect;
	if (blnGetOrCheck == undefined || blnGetOrCheck) blnGetOrCheck = true;
	var maxRegisterDate = {}, PanDianRiQi = '';
	
	$.post('getQueryResult.do','infoType=库存结存日期&engine=static&CangKuDaiMa=' + strStockId, function(data){
		if(ajaxJsonErrorHandler(data) && data.hasData) {
			maxRegisterDate = data.rows[0];
			for (var Date in maxRegisterDate) {
				if (maxRegisterDate[Date] && typeof maxRegisterDate[Date] == 'string' 
						&& maxRegisterDate[Date].indexOf(' 00:00:00') != -1) {
					maxRegisterDate[Date] = maxRegisterDate[Date].substr(0, maxRegisterDate[Date].indexOf(' 00:00:00'));
				}
			}
			PanDianRiQi = maxRegisterDate.PanDianRiQi;
			if (PanDianRiQi == null) PanDianRiQi = maxRegisterDate.JieCunRiQiRiQi;
			if (PanDianRiQi == null) {
				$.post('getSysParams.do', 'infoType=库存结存起始日期', 
						function(data) {
							var r = ajaxTextProcessing(data);
							if (r==false || r==null) return false;
							r = r[0].split('^');
							PanDianRiQi = r[0];
						},'text');
			}
		}
	},'json');					
	if (blnGetOrCheck) {
		return maxRegisterDate;
	} else {
		//改用盘点日期限制库存单的记账日期，如果当前还没有盘点记录，则使用结存日期，还没有则使用库存起始日期
		if (PanDianRiQi > strDateSelect) {
			return false;
		} else {
			return true;
		}		
	}
};

function changeGridCustomButtonCaptionAndIIcon(strGridSelector, strBtnId, strNewCaption, strNewIcon){
	if (strBtnId.substring(0,1) != '#') strBtnId = '#' + strBtnId;
	$(strGridSelector + ' ' + strBtnId + ' .ui-pg-div').html('<span class="ui-icon ' + strNewIcon + '"></span>' + strNewCaption);
}

function zeroFill( number, width )
{
  width -= number.toString().length;
  if ( width > 0 )
  {
    return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
  }
  return number + ""; // always return a string
}

function combineSheetIdAndTitle(strTitle, strId, strSheetType) {
	if (strSheetType == '订单') {
		if (strId) {
			return '<span style="color:blue">【订单' + strId + ', 客户：' + strTitle + '】</span>';			
		} else {
			return '<span style="color:blue">【客户：' + strTitle + '】</span>';						
		}
	} else if (strSheetType == '库存单') {
		return '<span style="color:blue">【库存单' + strId + ', ' + strTitle + '】</span>';		
	} else {
		return strTitle;
	}
}

/*
 * ajax方式获取数据内容的函数。
 * 函数统一处理了JSON返回数据的状态内容
 * 前提：	无。
 * 输入：	参数1：string, 信息类型；
 * 			参数2：string, 访问的后台服务名;
 * 			参数3：string, 单据号； 可省略
 * 出口：	返回调用本函数的页面
 * 返回：	1）正常访问时，JSON格式的单据内容。
 * 			2）访问异常，以及没有数据时，返回空数组。
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2014-4-20
 * 
 * 1.1版本简述：
 * 1）  	增加参数4：允许选择返回的数据类型，缺省时，返回的数据类型为JSON
 * 2)	增加参数5：函数是否返回不经处理的原始ajax访问结果，缺省为false
 * 3）	willPost由上一版的单一字符格式，扩展为字符，object形式均可，程序自动判断
 * 4）	对字符型willPost的格式允许不包含infoType=，由程序自动判断并添加
 * 
 * @author Harry
 * @version 1.1 2015-06-2
 * 
 * 1.2 版本简述：
 * 1）	增加了参数5：是否强制访问远程数据，缺省为true。
 * 			该参数为false时，函数优先使用本地的缓存数据；
 * 			为true时，强制访问服务器获取最新数据；
 * 			注意参数5与参数4互斥，如果参数4=true，则只能访问远程数据，不能使用缓存
 * 
 * @authro Harry
 * @version 1.2 2015-08-20
 */
function getSheetData(willPost, theServiceDo, strRtnType, blnRawDataDftF, blnForceRefreshDftT) {
	if (strRtnType === undefined) strRtnType = 'json';
	if (blnRawDataDftF === undefined) blnRawDataDftF = false;
	if (blnForceRefreshDftT === undefined) blnForceRefreshDftT = true;
	//返回原始数据开关量，和允许使用缓存开关量为互斥
	if (blnRawDataDftF) blnForceRefreshDftT = true;
	if (strRtnType != 'text') strRtnType = 'json';
	if (typeof willPost != 'object') {
		var checkInfoType = willPost;
		if (checkInfoType.indexOf('&') != -1) {
			checkInfoType = checkInfoType.substring(0, checkInfoType.indexOf('&'));
		}
		if (checkInfoType.indexOf('=') == -1) willPost = 'infoType=' + willPost;
	}
	var returnData = '';
	if (blnForceRefreshDftT || !cache[JSON.stringify(willPost)+strRtnType]) {
		$.ajax({
			url: theServiceDo,
			type: 'POST',
			data: willPost,
			async: false,
			dataType: strRtnType,
			success: function(data){
				if (cache[JSON.stringify(willPost)+strRtnType]) {
					delete cache[JSON.stringify(willPost)+strRtnType];
				}
				if (blnRawDataDftF) {
					cache[JSON.stringify(willPost)+strRtnType] = data;
				} else {
					if (strRtnType == 'json') {
						if (data.status!='OK') {
							returnData = ajaxJsonErrorHandler(data);
						} else if (data.hasData == 'FALSE') {
							returnData = new Array();
						} else {
							cache[JSON.stringify(willPost)+strRtnType] = data.rows;
						}									
					} else {
						var r = ajaxTextProcessing(data);
						if (!r) {
							returnData = r;
						} else {
							cache[JSON.stringify(willPost)+strRtnType] = r.join('<br/>');							
						}
					}
				}
			},
		});		
	}
	if (cache[JSON.stringify(willPost)+strRtnType]) {
		return cache[JSON.stringify(willPost)+strRtnType];
	} else {
		return returnData;
	}
};

function getSheetId(strSheetType, blnWithDateDftT) {
	if (blnWithDateDftT === undefined) blnWithDateDftT = true;
	if (!blnWithDateDftT) strSheetType += '&withDate=NODATE';
	var returnId = '';
	$.ajax({
		url: 'getSheetId.do',
		type: 'POST',
		data: 'sheetType=' + strSheetType,
		async: false,
		dataType: 'text',
		success: 
			function(data){
				var r = ajaxTextProcessing(data);
				if (r) {
					returnId = r[0];
				}
			},
	});
	return returnId;
};

function getAndCacheMyCode(){
	if (!cache['myCode']) {
		$.post('getQueryResult.do','infoType=我是谁&engine=static', function(data){
			var r = ajaxTextProcessing(data);
			if (r) {
				r = r[0].split('^');
				cache['myCode'] = r[0];
				cache['myName'] = r[1];
			}
		},'text');				
	}
}

/*
 * 检查jqGrid是否完成了初始化。
 * 通过判断table元素是否包含特定class来完成判断，
 * 考虑到随着jqGrid可能的更新，用于判断的class可能发生变化，故做成函数调用。
 * 
 * 前提：	无
 * 输入:		参数1：	string：	jqGrid的选择器
 * 出口：	返回调用点。
 * 返回：	true：	已完成初始化
 * 			false：	未完成初始化
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2015-1-2
 * 
 */
function checkGridInitialization(strGridSelector) {
	if ($(strGridSelector).length > 0 && $(strGridSelector).hasClass('ui-jqgrid-btable')) {
		return true;
	} else {
		return false;
	}
	//还有一种检测方法，留此备用
	$(strGridSelector)[0].grid;
}

/*
 * 不通过远程取数的方式，完成对jqGrid显示的更新。
 * 
 * 这个方法与setCell或setRowData方法不同的是：
 * 		1）会刷新cellAttr定义的单元attribute
 * 
 * 不通过远程取数刷新grid的优势：
 * 		1）如果按现有的查询条件刷新，可能当前的编辑记录，不会包含在记录中，
 * 			例如：订单的状态发生变化后，再按原来的状态条件查询会找不到当前编辑的订单
 * 		2）远程取数如果有order by可能会导致显示的记录位置发生变化，特别是在grid分页的情况下
 * 
 * 前提：	无
 * 输入:		参数1：	string：	jqGrid的选择器
 * 			参数2：	string: 当前的记录id
 * 			参数3：	string：grid中id所在的列名称
 * 			参数4：	js Object：需要更新的数据
 * 			参数5：	js string OR array: 更新前需要删除的原数据列名，如果是字符形式，则列名之间用","分隔
 * 			参数6：	boolean: 数据更新前，是否trim掉多余的空格，可省略，缺省为true
 * 出口：	返回调用点。
 * 返回：	true：	正常完成
 * 			null:	无更新返回
 * 			false：	有错返回
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2016-3-14
 * 
 * 版本1.1简述
 * 1） 更改strId参数支持多个id同时传入
 * 
 */
function refreshGridWithoutRemoteQuerying(gridSelector, strId, strIdColName, objNewVals, arrORstrWillGoneCols, blnSelectAfterRefreshDftT, blnTrimNewDataDftT){
	if (!gridSelector) {
		showupMessageInDialog('调用函数refreshGridWithoutRemoteQuerying，没有传递grid选择器！', 
				'函数调用错误', 'wrong');
		return false;
	}
	
	if (!strId) {
		showupMessageInDialog('调用函数refreshGridWithoutRemoteQuerying，没有传递记录id！', 
			'函数调用错误', 'wrong');
			return false;
	}
	if (!strIdColName) {
		showupMessageInDialog('调用函数refreshGridWithoutRemoteQuerying，没有传递grid中id所在列的名称！', 
				'函数调用错误', 'wrong');
		return false;
	}
	if (!(gridSelector instanceof jQuery)) gridSelector = $(gridSelector);
	if (gridSelector.length == 0) return null;
	if (!checkGridInitialization(gridSelector)) return null;
	if ($.isEmptyObject(objNewVals)) return null;
	
	if (blnTrimNewDataDftT === undefined) blnTrimNewDataDftT = true;
	if (blnSelectAfterRefreshDftT === undefined) blnSelectAfterRefreshDftT = true;
	
	var listInGrid = gridSelector.jqGrid('getRowData');
	var positionJustBeforeSelection = '', willRefreshLine = {};
	strId = strId.split(',');
	for (var j = 0; j < strId.length; j++) {
		for (var i = 0; i < listInGrid.length; i++) {
			if (listInGrid[i][strIdColName] == strId[j]) {
				willRefreshLine = listInGrid[i];
				break;
			}
			positionJustBeforeSelection = listInGrid[i][strIdColName];
		}
		if (arrORstrWillGoneCols && !(arrORstrWillGoneCols.constructor === Array)) {
			arrORstrWillGoneCols = arrORstrWillGoneCols.split(',');
		}
		if (arrORstrWillGoneCols) {
			for (var i = 0; i < arrORstrWillGoneCols.length; i++) {
				delete willRefreshLine[arrORstrWillGoneCols[i]];		
			}		
		}
		
		for (var Title in objNewVals) {
			willRefreshLine[Title] = objNewVals[Title];
			if (blnTrimNewDataDftT) {
				willRefreshLine[Title] = $.trim(willRefreshLine[Title]);
			}
		}
//		if (blnTrimNewDataDftT) {
//			for (Title in willRefreshLine) {
//				willRefreshLine[Title] = $.trim(willRefreshLine[Title]);
//			}		
//		}
		
		gridSelector.jqGrid('delRowData', strId[j]);
		if (positionJustBeforeSelection) {
			gridSelector.jqGrid('addRowData', strId[j], willRefreshLine, 'after', positionJustBeforeSelection);
		} else {
			gridSelector.jqGrid('addRowData', strId[j], willRefreshLine, 'first');					
		}		
	}
	if (blnSelectAfterRefreshDftT) gridSelector.jqGrid('setSelection', strId);
}
/*
 * 获取并缓存系统参数。
 * 
 * 前提：	无
 * 输入:		参数1：	string：	要获取的系统参数名，多个参数中间用“,”分隔
 * 			参数2：	可选，缺省为false，强制从服务器重新获取参数
 * 出口：	返回调用点。
 * 返回：	无
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2015-1-8
 * 
 */
function getAndCacheSysParameter(strParaName, blnForceUpdateDftF) {
	if (strParaName === undefined) {
		showupMessageInDialog('函数调用错误，缺少参数名！', '查询系统参数失败', 'wrong');
		return false;
	}
	if (blnForceUpdateDftF == undefined) blnForceUpdateDftF = false;
	var paraNames = strParaName.split(',');
	for (var i = 0; i < paraNames.length; i ++) {
		paraNames[i] = $.trim(paraNames[i]);
	}
	var needUpdateParaNames = [];
	if (blnForceUpdateDftF) {
		needUpdateParaNames = paraNames;
	} else {
		for (i = 0; i < paraNames.length; i++) {
			if (cache[paraNames[i]] == undefined) needUpdateParaNames.push(paraNames[i]);
		}		
	}
	var queryingHasError = false;
	if (needUpdateParaNames.length > 0) {
		$.ajax({
			type: 'POST',
			async: false,
			url: 'getSysParams.do',
			dataType: 'text',
			data: 'infoType=' + needUpdateParaNames.join(','), 
			success: function(data) {
				var r = ajaxTextProcessing(data);
				if (r==false || r==null) {
					for (i = 0; i < needUpdateParaNames.length; i++) {
						delete cache[needUpdateParaNames[i]];
						if (r==false) queryingHasError = true;
					}
				} else {
					r = r[0].split('^');
					for (i = 0; i < needUpdateParaNames.length; i++){
						if (r[i]==='true') {
							cache[needUpdateParaNames[i]] = true;
						} else if (r[i]==='false') {
							cache[needUpdateParaNames[i]] = false;
						} else if (r[i]==='null') {
							cache[needUpdateParaNames[i]] = null;						
						} else if (!isNaN(r[i])) {
							cache[needUpdateParaNames[i]] = parseFloat(r[i]);						
						} else {
							cache[needUpdateParaNames[i]] = r[i];												
						}
					}
				}
			},
		});			
	}
	if (queryingHasError) {
		return false;				
	} else {
		return true;		
	}
}

/*
 * 获取并缓存货物可用量。结果分货物标识，货物规格，仓库和仓库性质进行汇总。
 * 
 * 前提：	无
 * 输入:		参数1：	string：货物标识
 * 			参数2：	string: 货物规格
 * 			参数3：	string: 仓库代码
 * 			参数4：	string: 仓库性质
 * 			参数5：	boolean，可省略，是否强制刷新可用量数据
 * 出口：	返回调用点。
 * 返回：	可用量数据
 * 改进：	暂无
 * 
 * @author Harry
 * @version 1.0 2015-07-31
 * 
 */
function getAndCacheInventoryOnHand(strHuoWu, strGuiGe, strCangKu, strDiaoDuZhongXin, blnForceRefreshDftF) {
	if (!strHuoWu) {
		showupMessageInDialog('缺少货物标识', '函数调用错误','wrong');
		return;
	}
	if (!strGuiGe) strGuiGe = ''; 
	if (!strCangKu) strCangKu = ''; 
	if (!strDiaoDuZhongXin) strDiaoDuZhongXin = '';
	if (blnForceRefreshDftF === undefined) blnForceRefreshDftF = false;
	
	if (!blnForceRefreshDftF && cache[strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu]) {
		console.log('使用缓存数据：' + strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu);
		return cache[strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu];
	}
	var outGoingParam = 'infoType=货物可用量查询&engine=table&purpose=quick&id=' + strHuoWu;
	if (strGuiGe) outGoingParam += '&GuiGe=' + strGuiGe;
	if (strCangKu) outGoingParam += '&CangKu=' + strCangKu;
	if (strDiaoDuZhongXin) outGoingParam += '&DiaoDuZhongXin=' + strDiaoDuZhongXin;
	var KeYongLiang = getSheetData(outGoingParam, 'getQueryResult.do', 'text', true);
	KeYongLiang = ajaxTextProcessing(KeYongLiang);
	if (KeYongLiang === false) {
		if (cache[strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu] != undefined) {
			delete cache[strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu];			
		}
		return false;
	}
	if (!KeYongLiang) {
		cache[strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu] = 0;
		return 0;
	}
	cache[strHuoWu + '/' + strGuiGe + '/' + strDiaoDuZhongXin + '/' + strCangKu] = KeYongLiang[0];
	return KeYongLiang[0];
}


function clickOnSwitch(domElem){
	var beforeLabel = null;
	if (domElem.className.indexOf('two-way-switch') != -1) {
		beforeLabel = domElem.previousElementSibling;
		if (beforeLabel != null) {
			if (beforeLabel.nodeName != 'LABEL') {
				beforeLabel = null;
			} else if (beforeLabel.className.indexOf('never-disabled') != -1) {
				beforeLabel = null;
			}
		}		
	}
	var afterLabel = domElem.nextElementSibling;
	if (afterLabel != null) {
		if (afterLabel.nodeName != 'LABEL') {
			afterLabel = null;
		} else if (afterLabel.className.indexOf('never-disabled') != -1 ) {
			afterLabel = null;
		}		
	}
	if (domElem.checked) {
		if (afterLabel) $(afterLabel).removeClass('disabled-temporary');
		if (beforeLabel) $(beforeLabel).addClass('disabled-temporary');
	} else {
		if (afterLabel) $(afterLabel).addClass('disabled-temporary');
		if (beforeLabel) $(beforeLabel).removeClass('disabled-temporary');
	}
}

function clickOnSwitchLabel(domElem){
	if (domElem.nodeName != 'LABEL') return;
	var checkBox = null;
	if (domElem.className.indexOf('label-before-switch') != -1) {
		checkBox = domElem.nextElementSibling;
	} else {
		checkBox = domElem.previousElementSibling;		
	}
	checkBox.click();
}

function newComments(strGridSelector, strAction, strZiDuanMingChengDft, arrayOriginalData){
	var selectId = $(strGridSelector).jqGrid('getGridParam', 'selrow');
	if (strZiDuanMingChengDft === undefined) strZiDuanMingChengDft = 'CaiWuBeiZhu';
	if (!selectId) {
		showupMessageInDialog('首先需要至少选中一条' + strAction + '记录，才能增加备忘', '请知晓', 'wrong');
		return false;
	}
	
	var selectIds = [];
	var dialogInfo = '';
	if ($(strGridSelector).getGridParam('multiselect')) {
		selectIds = $(strGridSelector).getGridParam('selarrrow');
	} else {
		selectIds.push(selectId);
	}
	
	if (strAction == '缴款') {
		dialogInfo = $(strGridSelector).jqGrid('getCell', selectId, 'JiaoKuanRenXingMing') + '缴款：'
			+ currencyFormatted($(strGridSelector).jqGrid('getCell', selectId, 'YeWuJinE'), true)
			+ '&nbsp;' + $(strGridSelector).jqGrid('getCell', selectId, 'FangShi');
		
	} else if (strAction == '支付'){
		dialogInfo = $(strGridSelector).jqGrid('getCell', selectId, 'YeWuZhaiYao');
	} else if (strAction == '催款'){
		dialogInfo = $(strGridSelector).jqGrid('getCell', selectId, 'HuoBanMingCheng') 
			+ '<br/>' + bulletType2 + '<span class="badge">' 
			+ $(strGridSelector).jqGrid('getCell', selectId, 'KeHuXingMing') + '订单</span>应收款：' 
			+ currencyFormatted($(strGridSelector).jqGrid('getCell', selectId, 'YingShouJinE'));		
	} else if (strAction == '费用审批') {
		dialogInfo = $(strGridSelector).jqGrid('getCell', selectId, 'YeWuZhaiYao') + $(strGridSelector).jqGrid('getCell', selectId, 'YeWuJinE');
	}

	var dialogBox = document.createElement('div');
	document.body.appendChild(dialogBox);
	dialogBox.className='dialog-body';
	dialogBox.setAttribute('id', 'newComment');
	if (selectIds.length == 1) {
		dialogBox.innerHTML = '<div style="margin-top:1rem; margin-bottom:0.5rem; width:28rem"><label>选中'
			+ strAction + '记录：</label><br/><span class="ui-state-default" style="margin:1rem 0.5rem; line-height:1.4rem">' 
			+ dialogInfo + '</span><br/><br/>请在下面添加备忘：</div>';
	} else {
		dialogBox.innerHTML = '<div style="margin-top:1rem; margin-botton:0.5rem">选中了'
			+ '<span class="ui-state-default">' + selectIds.length 
			+ '</span>条' + strAction + '记录，将添加相同的备忘信息如下：</div>';		
	}
	dialogBox.innerHTML += '<textarea name="BeiWang" class="formated-input ui-widget-content ui-corner-all"'
		+ 'style="margin:0.5rem 1rem; width:26rem; height: 6rem"></textarea>';
	
	$('#newComment').dialog ({
		title: '新增' + strAction + '备忘',
		buttons: {
			'保存': function(){
				var domainName = '';
				var commentString = $('#newComment [name="BeiWang"]').val();
				if (strAction == '缴款') {
					domainName = 'incomeAndCostJournal';					
				} else if (strAction == '支付'){
					domainName = 'incomeAndCostJournal';
				} else if (strAction = '费用审批'){
					domainName = 'incomeAndCostJournal';	
					commentString = '【审批】' + commentString;
				} else if (strAction == '催款') {
					domainName = 'currentAccount';															
				}
				saveSingleCellOfGrid(strGridSelector, domainName, commentString, 
					strZiDuanMingChengDft, arrayOriginalData);
				closeDialog(this);
			},
			'关闭': function(){
				closeDialog(this);
			},
		},
	});				
}

function saveSingleCellOfGrid(strGridSelector, strDomainName, strNewValue, strZiDuanMingChengDft, arrayOriginalData, 
			strPKNameDft, blnReplaceDftF, blnWithUserNameDftT){
	if (blnReplaceDftF === undefined) blnReplaceDftF = false;
	if (blnWithUserNameDftT === undefined) blnWithUserNameDftT = true;
	if (!strZiDuanMingChengDft) strZiDuanMingChengDft = 'CaiWuBeiZhu';
	if (!strPKNameDft) strPKNameDft = 'BiaoShi';
	
	if (blnWithUserNameDftT) getAndCacheMyCode();
	
	var selectIds = [];
	if ($(strGridSelector).jqGrid('getGridParam','multiselect')) {
		selectIds = $(strGridSelector).jqGrid('getGridParam','selarrrow');
	} else {
		selectIds.push($(strGridSelector).jqGrid('getGridParam', 'selrow'));
	}
	var originalData = [];
	if (arrayOriginalData != undefined) {
		originalData = arrayOriginalData;
	} else {
		originalData = $(strGridSelector).jqGrid('getRowData');
	}
	var strGridDataType = $(strGridSelector).jqGrid('getGridParam','datatype');
	
	if (blnWithUserNameDftT) {
		if (strNewValue.indexOf('】') != -1) {
			var headPart = strNewValue.substring(0,strNewValue.indexOf('】') + 1);
			var commentPart = strNewValue.substring(strNewValue.indexOf('】') + 1, strNewValue.length);
			strNewValue = headPart + 'By' + cache['myName'] + '@' + getServerTime('time','string') + '：' + commentPart; 									
		} else {
			strNewValue = '【' + cache['myName'] + '@' + getServerTime('time','string') + '】' + strNewValue; 						
		}
	}
	
	var tempSheet = {}, tempLines = [], SQLAction={}, actionRows = [];
	for (var i = 0; i < selectIds.length; i++) {
		tempSheet = {};
		tempSheet[strPKNameDft] = selectIds[i];
//		var posInGridArray = $(strGridSelector).jqGrid('getInd', selectIds[i]) - 1;
		if (!blnReplaceDftF && $(strGridSelector).jqGrid('getCell', selectIds[i], strZiDuanMingChengDft)) {
			tempSheet[strZiDuanMingChengDft] = $(strGridSelector).jqGrid('getCell', selectIds[i], strZiDuanMingChengDft) + '\n';
		} else {
			tempSheet[strZiDuanMingChengDft] = '';
		}
		tempSheet[strZiDuanMingChengDft] += strNewValue;
//		originalData[posInGridArray][strZiDuanMingChengDft] = tempSheet[strZiDuanMingChengDft];
		tempLines.push(tempSheet);
		if (originalData != undefined) {
			for (var j = 0; j < originalData.length; j++) {
				if (originalData[j][strPKNameDft] == $(strGridSelector).jqGrid('getCell', selectIds[i], strPKNameDft)){
					originalData[j][strZiDuanMingChengDft] = tempSheet[strZiDuanMingChengDft];
					break;
				}
			}
		}
	}
	SQLAction['action'] = 'update';
	SQLAction['domainName'] = strDomainName;															
	SQLAction['dataStream'] = JSON.stringify(tempLines);
	actionRows.push(SQLAction);
	
	if (batchUpdateBackOfficeData(actionRows)) {
		if (strGridDataType == 'local') {
			$(strGridSelector)
				.jqGrid("clearGridData", true)
				.setGridParam({data:originalData,datatype:'local'})
				.trigger('reloadGrid');	
		} else {
			$(strGridSelector).trigger('reloadGrid');			
		}
		return true;
	} else {
		return false;
	}
};

function saveDeskConfig(){
	if (cache['myDesk'] === undefined) return;
	var deskConfigString = '';
	var myDesk = cache['myDesk'];
	for (var i = 0; i < myDesk.length; i++) {
		deskConfigString += myDesk[i]['Holder'] + ':' + myDesk[i]['BianHao'] + ',';
	}
	if (deskConfigString) deskConfigString = deskConfigString.substring(0, deskConfigString.length-1);
	$.ajax ({
		url : 'saveDesk.do',
		data : 'desk='+ deskConfigString,
		type : 'POST',
		async : true,
		success : function(data) {},
	});				
};

/*
 * autoComplete在读取远程数据的过程中会显示加载图标，但有时调用完成后，图标不会自动消失。
 * 采用此函数强制进行图标清除。
 * 前提：	无
 * 输入:		无。
 * 出口：	返回调用点。
 * 返回：	无
 * 改进：	暂无。
 * 
 * @author Harry
 * @version 1.0 2014-1-1
 * 
 */
function removeLoadingImage(){
	//暂时未找到加载图标不消失的原因，采用强制清除的方法。
	var t = $(".ui-autocomplete-loading");
	if (t.length!=0) {
		t.removeClass("ui-autocomplete-loading");
	};
};

function troggleHelpMsg(domElem) {
	var helpmsgElems;
	var parentContainer = iniContextObject(domElem, 'dialog-body');
	helpmsgElems = $(parentContainer).find('*');		
	if (domElem.checked) {
		for (var i = 0; i < helpmsgElems.length; i++) {
			var msg = helpmsgElems[i].getAttribute("helpmsg");
			if (msg) {
				$(helpmsgElems[i]).tooltip({
					tooltipClass: 'ui-state-error',
//					position: {my: 'left bottom-5', at: 'left top', collision: 'fit'},
					position: {my: 'right top+5', at: 'right bottom', collision: 'fit'},
					items: helpmsgElems[i].tagName,
					content: msg
				}).addClass('py-hint-sticky');							
			}
		}
	} else {
		for (var i = 0; i < helpmsgElems.length; i++) {
			var msg = helpmsgElems[i].getAttribute("helpmsg");
			if (msg) {
				$(helpmsgElems[i]).tooltip('destroy').removeClass('py-hint-sticky');
			}
		}
	}	
}

function getInfoPieceFromWinLocate(theNameOfInfo){
	var params= window.location.search.substring(1);
	var returnedId = null;
	if (!theNameOfInfo) return returnedId;
	//预防传入参数出错，将“=”全部去掉。
	theNameOfInfo = theNameOfInfo.replace(/=/g,'');
	if (params.indexOf(theNameOfInfo + '=') != -1) { 
		returnedId = params.substring(params.indexOf(theNameOfInfo + '=') + theNameOfInfo.length +1);
		if (returnedId.indexOf('&') != -1 ) {
			returnedId = returnedId.substring(0,returnedId.indexOf('&'));		
		} 
	};
	return returnedId;
}

function zeroPad(num, places) {
	var zero = places - num.toString().length + 1;
	return Array(+(zero > 0 && zero)).join("0") + num;
}

function iniCategoryTree(strTreeId, isShiWuDftU, strProps, blnWithRootDftF, blnWithSuspendingDftT, blnWithCancelledDftT, blnStickStsDftT){
	if (blnWithRootDftF === undefined) blnWithRootDftF = false;
	if (blnWithSuspendingDftT === undefined) blnWithSuspendingDftT = true;
	if (blnWithCancelledDftT === undefined) blnWithCancelledDftT = true;
	if (blnStickStsDftT === undefined) blnStickStsDftT = true;
	if (strTreeId.substring(0,1) != '#') strTreeId = '#' + strTreeId;
	var outgoingObj = {'infoType':'货物树形表', 'engine':'static','withRoot':blnWithRootDftF, 
			'withSuspending':blnWithSuspendingDftT, 'withCancelled':blnWithCancelledDftT, 'isShiWu':isShiWuDftU};
	if (strProps) {
		strProps = strPorps.replace(/'/g,'');
		var arrProps = strProps.split(',');
		for (var i = 0; i < arrProps.length; i++) {
			arrProps[i] = "'" + arrProps[i] + "'";
		}
		strProps = arrProps.joind(',');
		outgoingObj['props'] = strProps;
	}
 	var setting = {
        view: {
            selectedMulti: false,
            nameIsHTML:true 
        },
        async: {
            enable: true,
            url:"getQueryResult.do",
            otherParam: outgoingObj,
            autoParam:["id"],
            dataType: 'json',
            dataFilter: function(event, parentNode, responseData){
            	var returnData = [];
            	if (blnWithRootDftF && !parentNode) {
            		returnData.push({
            			'name': '所有存货',
            			'pureName':'所有存货',
    					'isParent':true,
    					'pId': null,
    					'id':'allInv',
    					'open':true,
    					'ShiFouKuCunGuanLi':true,
					});            		
            	}  
            	if(ajaxJsonErrorHandler(responseData)) {
            		returnData = returnData.concat(responseData.rows);
        			for (var i = 0; i < returnData.length; i++) {
        				if (blnStickStsDftT) {
	        				returnData[i]['pureName'] = returnData[i]['name'];
	        				if (returnData[i]['TingZhiShiYong']) {
	        					returnData[i]['name'] = '<span class="ui-state-error">废</span>' 
	        						+ returnData[i]['name'];            				
	        				} else {
	        					if (returnData[i]['TingZhiXiaoShou'] && returnData[i]['id'].indexOf('HW_')!=-1) {
	        						returnData[i]['name'] = '<span class="ui-state-error">停</span>' 
	        							+ returnData[i]['name'];
	        					}	        					
	        					if (returnData[i]['DanPinDingZhi'] && returnData[i]['id'].indexOf('HW_')!=-1) {
	        						returnData[i]['name'] = '<span class="ui-state-error">定</span>' 
	        							+ returnData[i]['name'];
	        					} else if (!returnData[i]['ShiFouKuCunGuanLi'] && returnData[i]['id'].indexOf('HW_')!=-1) {
	        						returnData[i]['name'] = '<span class="ui-state-error">滚</span>' 
	        							+ returnData[i]['name'];
	        					}            				
	        				}
        				}
        				if (returnData[i]['pId'] === null) {
        					if (blnWithRootDftF) {
        						returnData[i]['icon'] = './resource/allInv.ico';        						
        					} else {
        						returnData[i]['icon'] = './resource/actionImages/brand.png';        						
        					}
        				} else if (returnData[i]['pId'] == 'allInv') {
        					returnData[i]['icon'] = './resource/actionImages/brand.png';
        				} else if (returnData[i]['isParent']) {
        					returnData[i]['icon'] = './resource/actionImages/series.png';
        				} else {
        					returnData[i]['icon'] = './resource/actionImages/inventory.png';
        				}
        			}            			
            	} else {
            		if (blnWithRootDftF && !parentNode) {
            			returnData.push({
            				'name': '无品牌',
            				'pureName': '无品牌',
            				'ShiFouKuCunGuanLi': true,
            				'isParent':true, 
            				'pId': 'allInv', 
            				'id': 'PP_'});
            		} else {
            			return [{'name': '<span style="color:red">没有配置存货信息</span>'}];
            		}
            	}
            	return returnData;
            }
        },
        callback: {
            onClick: inventoryTreeClick,
        },
    	data: {
    		simpleData: {
    			enable: true,
    			idKey: "id",
    			pIdKey: "pId",
    		}
    	}
    };
	
	$.fn.zTree.init($(strTreeId), setting);
};