var standardAddBtn = "<label class='button_circle' id='add_Btn'><i class='icon-plus icon-large'></i></label>";
var standardEditBtn = "<label class='button_circle' id='edit_Btn'><i class='icon-edit icon-large'></i></label>";
var standardDelBtn = "<label class='button_circle' id='del_Btn'><i class='icon-trash icon-large'></i></label>";
var standardTroggleBtn = "<label class='button_circle' id='troggle_Btn'><i class='icon-off icon-large'></i></label>";
var standardMoveupBtn = "<label class='button_circle' id='moveup_Btn'><i class='icon-arrow-up icon-large'></i></label>";
var standardMovedownBtn = "<label class='button_circle' id='movedown_Btn'><i class='icon-arrow-down icon-large'></i></label>";
var workHere = '<div class="flexInnerContainer_Row flexExpanding_Wider" id="workHere"></div>';
var workMessage = '<div class="flexInnerContainer_Row flexExpanding" id="workMessage">' + 
	'<div id="hintArea"></div><div id="detailMessage"></div></div>';

var delImgBtnHTML = '<span class="button_circle button-tiny btn-for-del-img" onclick="delIma(this);">'
	+ '<i class="icon-trash icon-large"></i></span>';

var cache = {};

$(function() {
	jQueryUIInit();
	
	$.jgrid.defaults.width = 1200;
	$.jgrid.defaults.responsive = true;
	$.jgrid.defaults.styleUI = 'Bootstrap';
	
	$('.nav-list li a').bind('click', function(event){
		activeSectionSwitch(this);
	});
	var DengLuXinXi = getSheetData('我是谁', 'getinfo.do','json');
	if (DengLuXinXi === false) return;
	cache['YongHuId'] = DengLuXinXi[0].myCode;
	cache['MenDianId'] = DengLuXinXi[0].myStore;
	cache['MenDianMingCheng'] = DengLuXinXi[0].storeName;
	$('#MenDianMingCheng').html(DengLuXinXi[0].storeName);
	
	function activeSectionSwitch(domElem){
		$('.active').removeClass('active'); 
		if(!$(domElem).parent().hasClass('never-active')) {
			$(domElem).parent().addClass('active');
		}
	}
});

function MenDianJiBenXinXiSetup() {
	$('#TitleOfOperation').html('门店基本信息');
	$('#operationSName').html('门店基本信息');
	
	$('#operationArea').html(workHere + workMessage);
	$.get('templates/mendianjibenxinxi.html', function(data){
		$('#workHere').html(data);
	},'text');
	$('#availableActions').html('');
	$('#itemSearch input').prop('placeholder','').unbind();
	$('#itemSearch').css('visibility','hidden');
	getAndShowHint();
	
	var MenDianXinXi = getSheetData('门店信息&engine=static&id=' + cache['MenDianId'], '../getQueryResult.do', 'json');
	if (MenDianXinXi === false) {
		return;
	} else {
		MenDianXinXi = MenDianXinXi[0];
	}

	fillElementsWithData(MenDianXinXi, '#workHere');
	var ZhuYingLeiBieMingCheng = '';
	if (MenDianXinXi.ZhuYingLeiBie) {
		ZhuYingLeiBieMingCheng = getSheetData('商品类别多选名称&engine=static&LeiBieId=' + MenDianXinXi.ZhuYingLeiBie, '../getQueryResult.do', 'text');
		if (ZhuYingLeiBieMingCheng === false) return;
		ZhuYingLeiBieMingCheng = ZhuYingLeiBieMingCheng.replace(/<br\/>/g,',');
		processAndFillData(MenDianXinXi.ZhuYingLeiBie + ZhuYingLeiBieMingCheng, $('#workHere #ZhuYingLeiBie'));
		$('#workHere [name="LeiBieMingCheng"]').val(ZhuYingLeiBieMingCheng);
	}
	
	fillInStaticInfo('商品类别&engine=static', '../getQueryResult.do', $('#workHere #ZhuYingLeiBie'));
	if (MenDianXinXi.BnanerURL) {
		$('#workHere').find('#MenDianDianZhao .button_circle').bind('click', function(){imageCrop('#allForMenDianZhuTu', '修改门店店招');});
		$('#workHere').find('#MenDianDianZhao .button_circle').find('i').addClass('icon-edit');		
		$('#allForMenDianZhuTu').find('.imgBox').prop('src', '../' + MenDianXinXi.BnanerURL);
	} else {
		$('#workHere').find('#MenDianDianZhao .button_circle').bind('click', function(){imageCrop('#allForMenDianZhuTu', '新增门店店招');});
		$('#workHere').find('#MenDianDianZhao .button_circle').find('i').addClass('icon-plus');
	}
	if (MenDianXinXi.LogoURL) {
		$('#workHere').find('#MenDianLogo .button_circle').bind('click', function(){imageCrop('#allForLogo', '修改门店LOGO');});
		$('#workHere').find('#MenDianLogo .button_circle').find('i').addClass('icon-edit');				
		$('#allForLogo').find('.imgBox').prop('src', '../' + MenDianXinXi.LogoURL);
	} else {
		$('#workHere').find('#MenDianLogo .button_circle').bind('click', function(){imageCrop('#allForLogo', '新增门店LOGO');});
		$('#workHere').find('#MenDianLogo .button_circle').find('i').addClass('icon-plus');						
	}
	if (MenDianXinXi.wxURL) {
		$('#workHere').find('#MenDianWeiXin .button_circle').bind('click', function(){imageCrop('#allForWeiXinMingPian', '修改门店微信名片');});
		$('#workHere').find('#MenDianWeiXin .button_circle').find('i').addClass('icon-edit');
		$('#allForWeiXinMingPian').find('.imgBox').prop('src', '../' + MenDianXinXi.wxURL);
	} else {
		$('#workHere').find('#MenDianWeiXin .button_circle').bind('click', function(){imageCrop('#allForWeiXinMingPian', '新增门店微信名片');});
		$('#workHere').find('#MenDianWeiXin .button_circle').find('i').addClass('icon-plus');		
	}
	$('#workHere').find('#saveInfo').bind('click', saveMenDian);
	
	
	function saveMenDian(){
		var SQLAction = {};
		var actionRows = [];
		SQLAction = {};
		SQLAction['action'] = 'update';
		SQLAction['domainName'] = 'mendian';
		var willGoingData = serializeObject($('#workHere'));
		willGoingData.ID = cache['MenDianId'];		 			
		SQLAction['dataStream'] = JSON.stringify(willGoingData);
		actionRows.push(SQLAction);
		console.log(SQLAction);
		var updateResult = batchUpdateBackOfficeData(actionRows);
		if (updateResult) {
			if (updateResult.status === 'OK') {
				showupMessageInDialog('已保存门店<span class="label-as-badge badge-info">' 
					+ cache['MenDianMingCheng'] + '</span>！', '数据保存成功');
				closeDialog(this);
			} else {
				showupMessageInDialog(updateResult, '修改语句返回异常','alert');		 								 						
			}
		} else {
			return;
		}
	}
	
}

function MenDianZhuangXiu() {
	showupMessageInDialog('功能开发中', '请稍后');
	return;
};

function MenDianChanPingSetup() {
	$('#TitleOfOperation').html('上架产品管理');
	$('#operationSName').html('上架产品');
	$('#availableActions').html(standardAddBtn + standardEditBtn + standardTroggleBtn + '&nbsp;&nbsp;&nbsp;' + standardMoveupBtn + standardMovedownBtn);
	$('#itemSearch input').prop('placeholder','产品快查').unbind()
		.bind('keyup', function(){quickProductSearch(event, this);});
	$('#itemSearch').css('visibility','visible');
	
	
	$('#operationArea').html(workHere + workMessage);
	$('#workHere').html('<div class="flexInnerContainer_Col flexExpanding">' + 
		'<table id="productList" class="grid flexExpanding"></table><div id="productListPager"></div></div>');
	getAndShowHint();
	
	var productGrid = $('#productList');
	productGrid.jqGrid({
		datatype: 'json',
		mtype: 'POST',
		url:'../getQueryResult.do',
		postData: {'infoType':'门店商品','id':cache['MenDianId'],'engine':'static'},
		async: true,
		colModel : [
            {label:'标识', name:'ID', key:true, hidden:true}, 
            {label:'商品名称', name:'MingCheng', width:200}, 
            {label:'商品类别', name:'LeiBieMingCheng', width:50, align:'center'}, 
            {label:'单位', name:'DanWei', width:30, align:'center'}, 
		    {label:'公开价', name:'YuanJia', width:80, formatter:'currency', align:'center'},
		    {label:'微商价', name:'JiaGe', width:80, formatter:'currency', align:'center'},
		    {label:'显示排序', name:'PaiXu', width:60, align:'center',sorttype: 'int', align:'center'},
	    ],
        gridview : true,
        pgbuttons: false,
        pgtext: null,
        rownumbers : false,
        rowNum: maxGridRowNum,
        viewrecords : true,
        hidegrid : false,
        pager : '#productListPager',
        caption : '上架商品目录',
        autowidth : true,
        forceFit: false,
        onSelectRow: function(rowid, status, e){},
        loadComplete: function(){},
        subGrid: true,
        subGridRowExpanded: showProductDetail,
	});
	
	$('#gbox_productList').addClass('flexExpanding flexInnerContainer_Col');
	$('#gview_productList').addClass('flexExpanding flexInnerContainer_Col');
	$('#gview_productList .ui-jqgrid-bdiv').addClass('flexExpanding');
	centerCaptionOfGrid();
	
	function showProductDetail(parentRowID, parentRowKey) {
		$("#" + parentRowID).css('padding-top','20px').css('padding-left','20px')
			.html('<iframe src="../product.html?id=' + parentRowKey + '&preview=true" style="width:' 
				+ productGrid.width()/2 + 'px; height:400px; border:1px solid silver; padding:10px"></iframe>');
	}
}

function manipulateShangJiaShangPin(strAction) {

	var imgBoxHTML = '<img class="imgBox ui-corner-all" style="width:60px;height:60px;margin-right:1rem"/>'
		+ '<input type="hidden" class="imgName"/><input type="hidden" class="cropWidth" value="720"/>'
		+ '<input type="hidden" class="cropHeight" value=""/>';
	var newImgBtnHTML = '<span class="button_circle button-tiny btn-for-new-img" onclick="imageCrop(this, \'新增商品明细图\');">'
		+ '<i class="icon-plus icon-large"></i></span>';
	
	if (strAction === '新增') {
		newProduct();
	} else if (strAction === '编辑') {
		editProduct();
	} else if (strAction === '转换状态') {
		troggleProduct();
	} else if (strAction === '上移' || strAction === '下移') {
		changeProductPaiXu(strAction);
	}
	
	function newProduct() {
		var newDialog = document.createElement('div');
		$.get('./templates/shangjiashangpin.html', function(data){
			newDialog.innerHTML = data;
		},'text');
		newDialog.className='dialog-body';
		document.body.appendChild(newDialog);
		$(newDialog).find('[name="MenDianID"]').val(cache['MenDianId']);
		$(newDialog).find('#ShangPinZhuTu .button_circle').bind('click', function(){imageCrop('#allForShangPinZhuTu', '新增商品主图');});
		$(newDialog).find('#ShangPinZhuTu .button_circle').find('i').addClass('icon-plus');
		var newDiv = document.createElement('div');
		newDiv.id= 'allForImage1';
		newDiv.className = 'multi-img-preview';
		newDiv.style.width = '60px';
		newDiv.innerHTML = imgBoxHTML + newImgBtnHTML;
		$(newDialog).find('#ShangPinMingXiTuContainer').append(newDiv);

		standardizingUI(newDialog);
		fillInStaticInfo('商品类别&engine=static', '../getQueryResult.do', $(newDialog).find('[name="LeiBieID"]'));
		$(newDialog).dialog({
			title: '新增商品',
			width: 500,
			height: $('#workHere').height()-100,
			buttons: {
		 		"新增" :	function() {
		 			if (!checkValidation(newDialog)) return;
		 			//增加检查名称唯一性
//		 			var dataForUniqueCheck = {};
//		 			dataForUniqueCheck.tableName = 'gongchengzhubiao';
//		 			dataForUniqueCheck.condition = 'GongChengMingCheng = \'' + $('[name="GongChengMingCheng"]', newDialog).val() + '\'';
//		 			var checkUniqueResult = getSheetData('');
//		 			if (!checkUniqueResult) {
//		 				if (checkUniqueResult === false) {
//		 					showupHelpMessage($('[name="GongChengMingCheng"]',newDialog)[0], '新增的工程不能和原有的工程重名，请修改', false)
//		 				}
//		 				return;
//		 			}
//		 			//仅在填写了工程自编号的情况下，才检查工程自编号的唯一性
//		 			if ($('[name="GongChengZiBianHao"]').val()) {
//		 				dataForUniqueCheck.condition = 'GongChengZiBianHao = \'' + $('[name="GongChengZiBianHao"]',newDialog).val() + '\'';
//		 				var checkUniqueResult = checkUnique(dataForUniqueCheck);
//		 				if (!checkUniqueResult) {
//		 					if (checkUniqueResult === false) {
//		 						showupHelpMessage($('[name="GongChengZiBianHao"]',newDialog)[0], '新增的工程不能和原有的工程自编号相同，请修改', false)
//		 					}
//		 					return;
//		 				}		 				
//		 			}
		 			

		 			var SQLAction = {};
		 			var actionRows = [];
		 			SQLAction = {};
		 			SQLAction['action'] = 'insert';
		 			SQLAction['domainName'] = 'shangpin';
		 			var willGoingData = serializeObject(newDialog);
		 			willGoingData.ImgURL = $(newDialog).find('#allForShangPinZhuTu .imgName').val();
		 			var MingXiTuValue = '';
		 			var MingXiTuContainer = $(newDialog).find('#ShangPinMingXiTuContainer .imgName');
		 			willGoingData.PaiXu = $('#productList').jqGrid('getDataIDs').length + 1;
		 			for (var i = 0; i < MingXiTuContainer.length; i++) {
		 				if (MingXiTuContainer[i].value) {
		 					MingXiTuValue += MingXiTuContainer[i].value + ',';
		 				} else {
		 					break;
		 				}
		 			}
		 			if (MingXiTuValue) MingXiTuValue = MingXiTuValue.substring(0, MingXiTuValue.length -1);
		 			willGoingData.TuPianURL = MingXiTuValue;		 			
		 			SQLAction['dataStream'] = JSON.stringify(willGoingData);
		 			actionRows.push(SQLAction);
		 			console.log(SQLAction);
		 			var insertResult = batchUpdateBackOfficeData(actionRows);
		 			if (insertResult) {
		 				if (insertResult.status === 'OK') {
		 					showupMessageInDialog('完成新增商品<span class="label-as-badge badge-info">' + $('[name="MingCheng"]',newDialog).val() + '</span>！', '数据保存成功');		 						
		 					$('#productList').trigger('reloadGrid');
		 					closeDialog(this);
		 				} else {
		 					showupMessageInDialog(insertResult, '新增语句返回异常','alert');		 								 						
		 				}
		 			} else {
		 				return;
		 			}
		 		},
				"退出" : function() {
					closeDialog(this);
				}
			}
		}); 
	}

	function editProduct() {
		var selectedId = $('#productList').jqGrid('getGridParam', 'selrow');
		if (!selectedId) {
			showupMessageInDialog('请先在页面左半部分的上架商品目录中，选中您要修改的商品，再进行修改！', '没有选中要修改的记录', 'wrong');
			return;
		}
		var theData = getSheetData('商品信息&engine=static&for=管理&id=' + selectedId, '../getQueryResult.do', 'json');
		if (theData === false) {
			return;
		} else {
			theData = theData[0];
		}

		var editDialog = document.createElement('div');
		$.get('./templates/shangjiashangpin.html', function(data){
			editDialog.innerHTML = data;
		},'text');
		editDialog.className='dialog-body';
		document.body.appendChild(editDialog);
		$(editDialog).find('[name="MenDianID"]').val(cache['MenDianId']);
		fillElementsWithData(theData, editDialog);
		if (theData.ImgURL) {
			$(editDialog).find('#allForShangPinZhuTu').find('.imgBox').prop('src','../' + theData.ImgURL);
			$(editDialog).find('#allForShangPinZhuTu').find('.imgName').val(theData.ImgURL);
			$(editDialog).find('#ShangPinZhuTu .button_circle').bind('click', function(){imageCrop('#allForShangPinZhuTu', '修改商品主图');});
			$(editDialog).find('#ShangPinZhuTu .button_circle').find('i').addClass('icon-edit');			
		} else {
			$(editDialog).find('#ShangPinZhuTu .button_circle').bind('click', function(){imageCrop('#allForShangPinZhuTu', '新增商品主图');});
			$(editDialog).find('#ShangPinZhuTu .button_circle').find('i').addClass('icon-plus');			
		}
		if (theData.TuPianURL) {
			var TuPianDiZhi = theData.TuPianURL.split(',');
			for (var i = 0; i < TuPianDiZhi.length; i++) {
				var newDiv = document.createElement('div');
				newDiv.id= 'allForImage' + i + 1;
				newDiv.className = 'multi-img-preview';
				newDiv.style.width = '60px';
				newDiv.innerHTML = imgBoxHTML + delImgBtnHTML;
				$(newDiv).find('.imgBox').prop('src', '../' + TuPianDiZhi[i]);
				$(newDiv).find('.imgName').val(TuPianDiZhi[i]);
				$(editDialog).find('#ShangPinMingXiTuContainer').append(newDiv);
			}
		}
		var newDiv = document.createElement('div');
		newDiv.id= 'allForImage' + i + 1;
		newDiv.className = 'multi-img-preview';
		newDiv.style.width = '60px';
		newDiv.innerHTML = imgBoxHTML + newImgBtnHTML;
		$(editDialog).find('#ShangPinMingXiTuContainer').append(newDiv);

		standardizingUI(editDialog);
		fillInStaticInfo('商品类别&engine=static', '../getQueryResult.do', $(editDialog).find('[name="LeiBieID"]'), true, false, undefined, true);
		$(editDialog).dialog({
			title: '修改商品',
			width: 500,
			height: $('#workHere').height()-100,
			buttons: {
		 		"保存" :	function() {
		 			if (!checkValidation(editDialog)) return;
		 			//增加检查名称唯一性
//		 			var dataForUniqueCheck = {};
//		 			dataForUniqueCheck.tableName = 'gongchengzhubiao';
//		 			dataForUniqueCheck.condition = 'GongChengMingCheng = \'' + $('[name="GongChengMingCheng"]', editDialog).val() + '\'';
//		 			var checkUniqueResult = getSheetData('');
//		 			if (!checkUniqueResult) {
//		 				if (checkUniqueResult === false) {
//		 					showupHelpMessage($('[name="GongChengMingCheng"]',editDialog)[0], '新增的工程不能和原有的工程重名，请修改', false)
//		 				}
//		 				return;
//		 			}
//		 			//仅在填写了工程自编号的情况下，才检查工程自编号的唯一性
//		 			if ($('[name="GongChengZiBianHao"]').val()) {
//		 				dataForUniqueCheck.condition = 'GongChengZiBianHao = \'' + $('[name="GongChengZiBianHao"]',editDialog).val() + '\'';
//		 				var checkUniqueResult = checkUnique(dataForUniqueCheck);
//		 				if (!checkUniqueResult) {
//		 					if (checkUniqueResult === false) {
//		 						showupHelpMessage($('[name="GongChengZiBianHao"]',editDialog)[0], '新增的工程不能和原有的工程自编号相同，请修改', false)
//		 					}
//		 					return;
//		 				}		 				
//		 			}

		 			var SQLAction = {};
		 			var actionRows = [];
		 			SQLAction = {};
		 			SQLAction['action'] = 'update';
		 			SQLAction['domainName'] = 'shangpin';
		 			var willGoingData = serializeObject(editDialog);
		 			willGoingData.ImgURL = $(editDialog).find('#allForShangPinZhuTu .imgName').val();
		 			var MingXiTuValue = '';
		 			var MingXiTuContainer = $(editDialog).find('#ShangPinMingXiTuContainer .imgName');
		 			for (var i = 0; i < MingXiTuContainer.length; i++) {
		 				if (MingXiTuContainer[i].value) {
		 					MingXiTuValue += MingXiTuContainer[i].value + ',';
		 				} else {
		 					break;
		 				}
		 			}
		 			if (MingXiTuValue) MingXiTuValue = MingXiTuValue.substring(0, MingXiTuValue.length -1);
		 			willGoingData.TuPianURL = MingXiTuValue;		 			
		 			willGoingData.ID = selectedId;		 			
		 			SQLAction['dataStream'] = JSON.stringify(willGoingData);
		 			actionRows.push(SQLAction);
		 			console.log(SQLAction);
		 			var updateResult = batchUpdateBackOfficeData(actionRows);
		 			if (updateResult) {
		 				if (updateResult.status === 'OK') {
		 					showupMessageInDialog('已保存对商品<span class="label-as-badge badge-info">' 
		 							+ $('[name="MingCheng"]',editDialog).val() + '</span>的修改！', '数据保存成功');		 						
		 					$('#productList').trigger('reloadGrid');
		 					closeDialog(this);
		 				} else {
		 					showupMessageInDialog(updateResult, '修改语句返回异常','alert');		 								 						
		 				}
		 			} else {
		 				return;
		 			}
		 		},
				"退出" : function() {
					closeDialog(this);
				}
			}
		}); 
	}
	
	function troggleProduct() {
		showupMessageInDialog('功能开发中', '请稍后');
		return;
		var selectedId = $('#productList').jqGrid('getGridParam', 'selrow');
		if (!selectedId) {
			showupMessageInDialog('请先在页面左半部分的上架商品目录中，选中您要修改的商品记录，再删除工程！', 
				'没有选中要删除的工程', 'wrong');
			return;
		}
		var theData = $('#productList').jqGrid('getRowData', selectedId);
		var actionRows=[];
		var SQLAction = {};
		SQLAction = {};
		var isUpdate = false;
		if ($('#ChanPinLeiBie').html().indexOf('单机') === -1) {
			isUpdate = true;
			SQLAction['action'] = 'update';
			SQLAction['dataStream'] = JSON.stringify({
				'ShanChuBiaoJi':true, 
				'ZuiHouCaoZuoRen':$('#userId').html(),
				'ZuiHouCaoZuoShiJian': getServerTime('time','text')});
		} else {
			SQLAction['action'] = 'delete';			
		}
		SQLAction['tableName'] = 'gongchengzhubiao';
		SQLAction['condition'] = 'GongChengBiaoShi=' + theData.GongChengBiaoShi;
		var confirmHTMLContent = '您准备删除工程<br/><span class="label-as-badge">' + theData.GongChengMingCheng + '</span><br/>';;
		if (isUpdate) {
			confirmHTMLContent += bulletType1 + '您使用的是网络版本，工程资料将会放入回收站<br/>' + bulletType1 
				+ '只有在您的系统管理员执行了<span class="label-as-badge badge-success">清空工程回收站</span>操作后，才会彻底被清除<BR/>';
		} else {
			confirmHTMLContent += bulletType1 + '您使用的是单机版本，工程资料将会被彻底删除<br/>' + bulletType1 
				+ '删除的工程<span class="label-as-badge badge-warning">不可恢复</span>，请谨慎操作！<br/>';
		}
		confirmHTMLContent += '请确认是否继续操作？';
		actionRows.push(SQLAction);
		
		confirmingDialog(confirmHTMLContent, '操作确认', executeAction, function(){return;}, '继续操作', '中止删除', 'question')
	
		function executeAction(){
			var troggleResult = batchUpdateBackOfficeData(actionRows);
			if (troggleResult) {
				if (troggleResult.status === 'OK') {
					showupMessageInDialog('已删除工程<br/><span class="label-as-badge">' + theData.GongChengMingCheng + '</span>数据！', '数据保存成功');		 						
					$('#projectList').trigger('reloadGrid');
				} else {
					showupMessageInDialog(updateResult, 'SQL语句返回异常','alert');		 								 						
				}
			} else {
				return;
			}			
		}
	}
	
	function changeProductPaiXu() {
		showupMessageInDialog('功能开发中', '请稍后');
		return;
		var selectedId = $('#productList').jqGrid('getGridParam', 'selrow');
		if (!selectedId) {
			showupMessageInDialog('请先在页面左半部分的上架商品目录中，选中您要修改的商品记录，再删除工程！', 
					'没有选中要删除的工程', 'wrong');
			return;
		}
		var theData = $('#productList').jqGrid('getRowData', selectedId);
		var actionRows=[];
		var SQLAction = {};
		SQLAction = {};
		var isUpdate = false;
		if ($('#ChanPinLeiBie').html().indexOf('单机') === -1) {
			isUpdate = true;
			SQLAction['action'] = 'update';
			SQLAction['dataStream'] = JSON.stringify({
				'ShanChuBiaoJi':true, 
				'ZuiHouCaoZuoRen':$('#userId').html(),
				'ZuiHouCaoZuoShiJian': getServerTime('time','text')});
		} else {
			SQLAction['action'] = 'delete';			
		}
		SQLAction['tableName'] = 'gongchengzhubiao';
		SQLAction['condition'] = 'GongChengBiaoShi=' + theData.GongChengBiaoShi;
		var confirmHTMLContent = '您准备删除工程<br/><span class="label-as-badge">' + theData.GongChengMingCheng + '</span><br/>';;
		if (isUpdate) {
			confirmHTMLContent += bulletType1 + '您使用的是网络版本，工程资料将会放入回收站<br/>' + bulletType1 
			+ '只有在您的系统管理员执行了<span class="label-as-badge badge-success">清空工程回收站</span>操作后，才会彻底被清除<BR/>';
		} else {
			confirmHTMLContent += bulletType1 + '您使用的是单机版本，工程资料将会被彻底删除<br/>' + bulletType1 
			+ '删除的工程<span class="label-as-badge badge-warning">不可恢复</span>，请谨慎操作！<br/>';
		}
		confirmHTMLContent += '请确认是否继续操作？';
		actionRows.push(SQLAction);
		
		confirmingDialog(confirmHTMLContent, '操作确认', executeAction, function(){return;}, '继续操作', '中止删除', 'question')
		
		function executeAction(){
			var troggleResult = batchUpdateBackOfficeData(actionRows);
			if (troggleResult) {
				if (troggleResult.status === 'OK') {
					showupMessageInDialog('已删除工程<br/><span class="label-as-badge">' + theData.GongChengMingCheng + '</span>数据！', '数据保存成功');		 						
					$('#projectList').trigger('reloadGrid');
				} else {
					showupMessageInDialog(updateResult, 'SQL语句返回异常','alert');		 								 						
				}
			} else {
				return;
			}			
		}
	}
}

function YingXiaoHuoDongSetup() {
	$('#TitleOfOperation').html('营销活动管理');
	$('#operationSName').html('营销活动');
	$('#availableActions').html(standardAddBtn + standardEditBtn);
	
	$('#operationArea').html(workHere + workMessage);
	$('#workHere').html('<div class="flexInnerContainer_Col flexExpanding">' 
		+ '<table id="eventsList" class="grid flexExpanding"></table><div id="eventsListPager"></div></div>');
	$('#itemSearch input').prop('placeholder','').unbind();
	$('#itemSearch').css('visibility','hidden');
	getAndShowHint();
	
	var productGrid = $('#eventsList');
	productGrid.jqGrid({
		datatype: 'json',
		mtype: 'POST',
		url:'../getQueryResult.do',
		postData: {'infoType':'活动管理','storeID':cache['MenDianId'],'engine':'static'},
		async: true,
		colModel : [
            {label:'标识', name:'ID', key:true, hidden:true}, 
            {label:'活动名称', name:'MingCheng', width:200}, 
            {label:'开始日期', name:'StartDate', width:70, formatter:'date',
            	formatoptions:{srcformat:'ISO8601Long', newformat:'ISO8601Short'}}, 
            {label:'结束日期', name:'EndDate', width:70, formatter:'date',
        		formatoptions:{srcformat:'ISO8601Long', newformat:'ISO8601Short'}}, 
            {label:'过期', name:'GuoQi', width:50, align:'center'}, 
            {label:'活动说明', name:'ShuoMing', width:300, align:'center'}, 
        ],
        gridview : true,
        pgbuttons: false,
        pgtext: null,
        rownumbers : false,
        rowNum: maxGridRowNum,
        viewrecords : true,
        hidegrid : false,
        pager : '#eventsListPager',
        caption : '营销活动列表',
        autowidth : true,
        forceFit: false,
        onSelectRow: function(rowid, status, e){},
        loadComplete: function(){},
        subGrid: true,
        subGridRowExpanded: showEventDetail,
	});
	
	$('#gbox_eventsList').addClass('flexExpanding flexInnerContainer_Col');
	$('#gview_eventsList').addClass('flexExpanding flexInnerContainer_Col');
	$('#gview_eventsList .ui-jqgrid-bdiv').addClass('flexExpanding');
	centerCaptionOfGrid();
	
	function showEventDetail(parentRowID, parentRowKey) {
		$("#" + parentRowID).css('padding-top','20px').css('padding-left','20px')
		.html('<iframe src="../huodong.html?id=' + parentRowKey + '&preview=true" style="width:' 
				+ productGrid.width()/2 + 'px; height:400px; border:1px solid silver; padding:10px"></iframe>');
	}
}

function manipulateYingXiaoHuoDong(strAction) {
	
	var imgBoxHTML = '<img class="imgBox ui-corner-all" style="width:60px;height:60px;margin-right:1rem"/>'
		+ '<input type="hidden" class="imgName"/><input type="hidden" class="cropWidth" value="720"/>'
		+ '<input type="hidden" class="cropHeight" value=""/>';
	var newImgBtnHTML = '<span class="button_circle button-tiny btn-for-new-img" onclick="imageCrop(this, \'新增商品明细图\');">'
		+ '<i class="icon-plus icon-large"></i></span>';
	
	if (strAction === '新增') {
		newEvent();
	} else if (strAction === '编辑') {
		editEvent();
	}
	
	function newEvent() {
		var newDialog = document.createElement('div');
		$.get('./templates/yingxiaohuodong.html', function(data){
			newDialog.innerHTML = data;
		},'text');
		newDialog.className='dialog-body';
		document.body.appendChild(newDialog);
		$(newDialog).find('[name="StoreID"]').val(cache['MenDianId']);
		$(newDialog).find('#HuoDongZhuTu .button_circle').bind('click', function(){imageCrop('#allForHuoDongZhuTu', '新增营销活动宣传图');});
		$(newDialog).find('#HuoDongZhuTu .button_circle').find('i').addClass('icon-plus');
		
		standardizingUI(newDialog);
		
		$(newDialog).dialog({
			title: '新增营销活动',
			width: 500,
			height: $('#workHere').height()-100,
			buttons: {
				"新增" :	function() {
					if (!checkValidation(newDialog)) return;
					//增加检查名称唯一性
//		 			var dataForUniqueCheck = {};
//		 			dataForUniqueCheck.tableName = 'gongchengzhubiao';
//		 			dataForUniqueCheck.condition = 'GongChengMingCheng = \'' + $('[name="GongChengMingCheng"]', newDialog).val() + '\'';
//		 			var checkUniqueResult = getSheetData('');
//		 			if (!checkUniqueResult) {
//		 				if (checkUniqueResult === false) {
//		 					showupHelpMessage($('[name="GongChengMingCheng"]',newDialog)[0], '新增的工程不能和原有的工程重名，请修改', false)
//		 				}
//		 				return;
//		 			}
//		 			//仅在填写了工程自编号的情况下，才检查工程自编号的唯一性
//		 			if ($('[name="GongChengZiBianHao"]').val()) {
//		 				dataForUniqueCheck.condition = 'GongChengZiBianHao = \'' + $('[name="GongChengZiBianHao"]',newDialog).val() + '\'';
//		 				var checkUniqueResult = checkUnique(dataForUniqueCheck);
//		 				if (!checkUniqueResult) {
//		 					if (checkUniqueResult === false) {
//		 						showupHelpMessage($('[name="GongChengZiBianHao"]',newDialog)[0], '新增的工程不能和原有的工程自编号相同，请修改', false)
//		 					}
//		 					return;
//		 				}		 				
//		 			}
					
					
					var SQLAction = {};
					var actionRows = [];
					SQLAction = {};
					SQLAction['action'] = 'insert';
					SQLAction['domainName'] = 'huodong';
					var willGoingData = serializeObject(newDialog);		 			
					SQLAction['dataStream'] = JSON.stringify(willGoingData);
					actionRows.push(SQLAction);
					console.log(SQLAction);
					var insertResult = batchUpdateBackOfficeData(actionRows);
					if (insertResult) {
						if (insertResult.status === 'OK') {
							showupMessageInDialog('完成新增营销活动<span class="label-as-badge badge-info">' + $('[name="MingCheng"]',newDialog).val() + '</span>！', '数据保存成功');		 						
							$('#eventsList').trigger('reloadGrid');
							closeDialog(this);
						} else {
							showupMessageInDialog(insertResult, '新增语句返回异常','alert');		 								 						
						}
					} else {
						return;
					}
				},
				"退出" : function() {
					closeDialog(this);
				}
			}
		}); 
	}
	
	function editEvent() {
		var selectedId = $('#eventsList').jqGrid('getGridParam', 'selrow');
		if (!selectedId) {
			showupMessageInDialog('请先在页面左半部分的营销活动列表中，选中您要修改的活动，再进行修改！', '没有选中要修改的记录', 'wrong');
			return;
		}
		if ($('#eventsList').jqGrid('getCell', selectedId, 'GuoQi') === '过期') {
			showupMessageInDialog('过期的活动不需要修改，请重新选择！', '操作错误', 'wrong');
			return;
		}
		var theData = getSheetData('活动信息&engine=static&id=' + selectedId, '../getQueryResult.do', 'json');
		if (theData === false) {
			return;
		} else {
			theData = theData[0];
		}
		
		var editDialog = document.createElement('div');
		$.get('./templates/yingxiaohuodong.html', function(data){
			editDialog.innerHTML = data;
		},'text');
		editDialog.className='dialog-body';
		document.body.appendChild(editDialog);
		$(editDialog).find('[name="StoreID"]').val(cache['MenDianId']);
		fillElementsWithData(theData, editDialog);
		if (theData.ImgURL) {
			$(editDialog).find('#allForHuoDongZhuTu').find('.imgBox').prop('src','../' + theData.ImgURL);
			$(editDialog).find('#allForHuoDongZhuTu').find('.imgName').val(theData.ImgURL);
			$(editDialog).find('#HuoDongZhuTu .button_circle').bind('click', function(){imageCrop('#allForHuoDongZhuTu', '修改活动宣传图');});
			$(editDialog).find('#HuoDongZhuTu .button_circle').find('i').addClass('icon-edit');			
		} else {
			$(editDialog).find('#HuoDongZhuTu .button_circle').bind('click', function(){imageCrop('#allForHuoDongZhuTu', '新增活动宣传图');});
			$(editDialog).find('#HuoDongZhuTu .button_circle').find('i').addClass('icon-plus');			
		}
	
		standardizingUI(editDialog);
		$(editDialog).dialog({
			title: '修改营销活动',
			width: 500,
			height: $('#workHere').height()-100,
			buttons: {
				"保存" :	function() {
					if (!checkValidation(editDialog)) return;
					//增加检查名称唯一性
//		 			var dataForUniqueCheck = {};
//		 			dataForUniqueCheck.tableName = 'gongchengzhubiao';
//		 			dataForUniqueCheck.condition = 'GongChengMingCheng = \'' + $('[name="GongChengMingCheng"]', editDialog).val() + '\'';
//		 			var checkUniqueResult = getSheetData('');
//		 			if (!checkUniqueResult) {
//		 				if (checkUniqueResult === false) {
//		 					showupHelpMessage($('[name="GongChengMingCheng"]',editDialog)[0], '新增的工程不能和原有的工程重名，请修改', false)
//		 				}
//		 				return;
//		 			}
//		 			//仅在填写了工程自编号的情况下，才检查工程自编号的唯一性
//		 			if ($('[name="GongChengZiBianHao"]').val()) {
//		 				dataForUniqueCheck.condition = 'GongChengZiBianHao = \'' + $('[name="GongChengZiBianHao"]',editDialog).val() + '\'';
//		 				var checkUniqueResult = checkUnique(dataForUniqueCheck);
//		 				if (!checkUniqueResult) {
//		 					if (checkUniqueResult === false) {
//		 						showupHelpMessage($('[name="GongChengZiBianHao"]',editDialog)[0], '新增的工程不能和原有的工程自编号相同，请修改', false)
//		 					}
//		 					return;
//		 				}		 				
//		 			}
					
					var SQLAction = {};
					var actionRows = [];
					SQLAction = {};
					SQLAction['action'] = 'update';
					SQLAction['domainName'] = 'huodong';
					var willGoingData = serializeObject(editDialog);
					willGoingData.ID = selectedId;		 			
					SQLAction['dataStream'] = JSON.stringify(willGoingData);
					actionRows.push(SQLAction);
					console.log(SQLAction);
					var updateResult = batchUpdateBackOfficeData(actionRows);
					if (updateResult) {
						if (updateResult.status === 'OK') {
							showupMessageInDialog('已保存对活动<span class="label-as-badge badge-info">' 
									+ $('[name="MingCheng"]',editDialog).val() + '</span>的修改！', '数据保存成功');		 						
							$('#eventsList').trigger('reloadGrid');
							closeDialog(this);
						} else {
							showupMessageInDialog(updateResult, '修改语句返回异常','alert');		 								 						
						}
					} else {
						return;
					}
				},
				"退出" : function() {
					closeDialog(this);
				}
			}
		}); 
	}
}

function ShuJuTongJi() {
	$('#operationArea').html(workHere + workMessage);
	$.get('templates/shujutongji.html', function(data){
		$('#workHere').html(data);
	},'text');
	getAndShowHint();
	return;
};

function getAndShowHint() {
	standardizingUI('#operationArea');
	$.get('templates/hint.html', function(data){
		$('#hintArea').html(data);
	}, 'text');
}

function dispatchActions(strItemName, strAction) {
	switch (strItemName) {
	case '上架产品':
		manipulateShangJiaShangPin(strAction);
		break;
	case '营销活动':
		manipulateYingXiaoHuoDong(strAction);
		break;
	};
}

function changePWD() {
	showupMessageInDialog('功能开发中', '请稍后');
}

function exitSystem() {
	showupMessageInDialog('安全退出功能正在开发中', '请稍后');
}

function imageCrop(imgContainer, strDialogTitle){
	if (imgContainer === undefined) {
		showupMessageInDialog('函数调用错误，必须传递图片的显示容器的选择器！', 'FIT from imageCrop', 'wrong');
		return;
	}
	var container = $(imgContainer);
	if (container.children('.imgBox').length === 0) {
		var k = container.parent();
		if (container.parent().children('.imgBox').length > 0) {
			container = container.parent();
		} else {
			showupMessageInDialog('函数调用错误，图片的显示容器的格式不正确！', 'FIT from imageCrop', 'wrong');
			return;			
		}
	}
	var intCropWidth = parseInt(container.find('.cropWidth').val());
	var intCropHeight = parseInt(container.find('.cropHeight').val());
	if (isNaN(intCropWidth)) intCropWidth = 400;
	if (isNaN(intCropHeight)) intCropHeight = 225;
	var maxTuPian = parseInt(container.parent('.img-container').find('.maxTuPian').val());
	if (isNaN(maxTuPian)) maxTuPian = 1;
	var currentTuPian = parseInt(container.parent('.img-container').find('.currentTuPian').val());
	if (isNaN(currentTuPian)) currentTuPian = 1;
    var dialogBox = document.createElement('div');
    if (strDialogTitle === undefined) strDialogTitle = '图片裁剪';
    document.body.appendChild(dialogBox);
    
    $(dialogBox).addClass('dialog-body');
    $.getScript('./scripts/jquery.cropit.js');
    

    $.ajax({
    	url : 'templates/imgCrop.html',
    	type : 'GET',
    	dataType : 'text',
    	cache : true,
    	async : false,
    	success : function( data ) {
    		$(dialogBox).html(data);        	
    		$(dialogBox).find('.image-editor').cropit({
    			imageBackground: true,
    			imageBackgroundBorderWidth: 25,
    			width: intCropWidth,
    			height: intCropHeight,
    			maxZoom: 4,
    			minZoom: 'fit',
    			initialZoom: 'min',
    			freeMove: true,
    			smallImage: 'reject',
    			exportZoom: 1,
    			onFileChange: function(){
    				$(dialogBox).find('.on-loading').show();
    			},
    			onImageLoaded: function(){
    				$(dialogBox).find('.on-loading').hide();
    			},
    			onImageError: function(error){
    				alert(error.message);
    				$(dialogBox).find('.on-loading').hide();
    			}
    		});
    	},
    });
    
	$(dialogBox).dialog ({
		autoOpen : true,
		resizable : true,
		modal : true,
		width: intCropWidth + 90,
		minWidth: 500,
		height: $(dialogBox).find('.image-editor').height() + 170,
		title : strDialogTitle,
		buttons: {
			'保存': function(){
				var saveResult = imageUpload();
				if ( saveResult === null) {
					showupMessageInDialog('您没有选择图片，无法保存！', '错误', 'wrong');
				} else if (saveResult === true) {
					if (maxTuPian === -1) {
						confirmingDialog('您还可以继续加入图片，是否继续加入？', 
							'需要一个决定', function(){$(dialogBox).find('img').prop('src',''); return;}, function(){closeDialog(dialogBox);}, '继续加入图片','退出','question')						
					} else if (maxTuPian - currentTuPian > 0) {
						confirmingDialog('您还可以加入<span class="label-as-badge badge-info">' + (maxTuPian - currentTuPian) + '</span>张图片，是否继续加入？', 
							'需要一个决定', function(){$(dialogBox).find('img').prop('src',''); return;}, function(){closeDialog(dialogBox);}, '继续加入图片','退出','question')
					} else {
						confirmingDialog('图片已成功上传，将退出图片编辑功能！', '操作成功', function(){closeDialog(dialogBox);}, '好的', 'information');
					}
				};
			},
			'退出': function(){
				closeDialog(dialogBox);
			},
		},
   });


   function imageUpload(){
	   var uploadOK = false;
	   var imageData = $(dialogBox).find('.image-editor').cropit('export');
	   if (imageData === undefined) return null;
	   $(dialogBox).find('.on-loading').show();
       var outGoingData = imageData.replace(/\+/g,'%2B');
       outGoingData = outGoingData.replace(/\&/g,'%26');
       $.ajax({
           url:'uploadImg.do',
           type : 'POST',
           data: 'image-data=' + outGoingData,
           async: false,
           dataType : 'json',
           success : function( data ) {
               if (data.state==200){
            	   if (container.length > 0) {
            		   container.find('.imgBox').prop('src', imageData);
            		   container.find('.imgName').val(data.result);
            		   currentTuPian++;
            		   container.parent('.img-container').find('.currentTuPian').val(currentTuPian); 
            		   if (maxTuPian === -1 || (maxTuPian - currentTuPian) > 0) {
            			   var newDiv = document.createElement('div');
            			   container.parent('.img-container').find('.multi-img-preview').length + 1;
            			   newDiv.id= 'allForImage' + (container.parent('.img-container').find('.multi-img-preview').length + 1);
            			   newDiv.className = 'multi-img-preview';
            			   newDiv.style.width = '60px';
            			   newDiv.innerHTML = container.html();
            			   container.parent('.img-container').append(newDiv);
            			   container.find('.btn-for-new-img').remove();
            			   if (container.find('.btn-for-del-img').length === 0) {
            				   container.append(delImgBtnHTML);
            			   }
            			   container = $(newDiv);            	
            			   container.find('.imgBox').prop('src','');
            		   }
            	   }
            	   uploadOK = true;
               } else {
                 showupMessageInDialog('上传图片发生错误，请再次尝试', '抱歉', 'wrong');
               }    
           },
       });
       $(dialogBox).find('.on-loading').hide();
       return uploadOK;
   }
}


//取URL后的参数 function GetQueryString(name)
//URL的参数&参数名1=XXXX&参数名2=XXXX&参数名3=XXXX  
//alert(GetQueryString("参数名2"));
function GetQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null)
        return unescape(r[2]);
    return null;
}

var AdminData = undefined;
function InitNav() {
    $.ajax({
        url : 'getinfo.do',
        type : 'GET',
        data : 'infoType=管理员信息',
        dataType : 'json',
        async : false,
        success : function( data ) {
        	if (ajaxJsonErrorHandler(data)) {
				returnData = data.rows;
				AdminData=returnData;
				if (returnData[0].storeID!=''){
					$("#sheetTitle").html(returnData[0].storeName);
					$("title").html(returnData[0].storeName+'--设置');$("title").html(returnData[0].MingCheng);
					$("#nav").html("<ul id='nav_ul'><li id='md_LI_1'>门店概览</li><li id='md_LI_2'>门店设置</li><li id='md_LI_3'>商品设置</li><li id='md_LI_4'>活动设置</li></ul>");
				} else {
					$("#sheetTitle").html("商城设置");
					$("title").html('商城设置');
					$("#nav").html("<ul id='nav_ul'><li id='mall_LI_1'>概览</li><li id='mall_LI_2'>设置</ul>");
				}
			} else {
				
			}
        },
    });
}