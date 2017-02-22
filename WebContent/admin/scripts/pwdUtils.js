/**
 * 
 */
/*
 * 触发修改密码弹出窗口的函数。
 * 前提：	无
 * 输入:		无
 * 出口：	关闭后回到调用页面。
 * 返回：	无
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-1-1
 * 
 * 1.1版本简述
 * 其实1.0版本是以前基于#putDialogHere的div元素的版本，后来修改为所有元素由程序生成。
 * 本版进行了如下调整：
 * 1）	页面元素放入template文件中，由程序读取，目的是充分利用缓存，节省网络流量。
 * 2）	页面元素增加了随机密码生成器的链接，增加了密码强度值得计算结果显示。
 * 
 * @author Harry
 * @version 1.1 2014-2-26
 * 
 * 调用者：	1）菜单：修改密码	
 */
function changePassword(domElemFromWhich) {
	var blnInsideDialog = false;
	var changePWDDialog;
	if (domElemFromWhich !== undefined) {
		blnInsideDialog = true;
		changePWDDialog = iniContextObject(domElemFromWhich , '.dialog-body');
	}
	if (!blnInsideDialog) {
		changePWDDialog = document.createElement('div');
		changePWDDialog.className = 'dialog-body';
		$.get('resource/templates/changingpwd.html',function( data ) {
			changePWDDialog.innerHTML = data;
		},'text');
		
		document.body.appendChild(changePWDDialog);
		standardizingUI(changePWDDialog);
		$(changePWDDialog).dialog({
			title: '修改登录密码',
			buttons: {
				"修改密码" :	actualChangePwd,
				"退出" : function() {
					closeDialog(changePWDDialog);
				}
			}
		});
	} else {
		actualChangePwd();
	}
//内部函数：检查旧密码是否正确
//关键点有两个：1）一定要同步方式，不检查完，不返回结果；2）一定要指定返回数据类型为text
	function checkOldPWDRemotely() {
		var result = null;
		$.ajax ({
			url: 'logincheck.do',
			type: 'POST',
			async: false,
			data: 'pwd=' + md5($("[name='oldpwd']").val()),
			dataType: 'text',
			success: function(data){
				result = ajaxTextProcessing(data);
			}
		});
		if (result == null ) {
			showupHelpMessage($("[name='oldpwd']")[0], '您的旧密码输入错误', false);
			return false;
		} else {
			return result;
		}	
	};
	
	function actualChangePwd(){
		clearupHelpMessage();
		var changeResult = 0;
		if (checkOldPWDRemotely()&&checkNewPWD('newpwd', 'retypepwd')) {
			if ($("[name='oldpwd']").length > 0) {
				if ($("[name='oldpwd']").val() === $("[name='newpwd']").val()) {
					showupHelpMessage($("[name='oldpwd']")[0], '新密码和旧密码完全一致，不用修改了吧？！', false);					
				}
			}
			$.ajax ({
				url: 'changePWD.do',
				async: false,
				data: 'pwd=' + md5($("[name='newpwd']").val()),
				dataType: 'text',
				success: function(data){ 
					changeResult = ajaxTextProcessing(data);
				}
			});
			if (changeResult == 1) {
				closeDialog(changePWDDialog)
				showupMessageInDialog('您的密码已修改成功！', '请知晓');
			}
			if (changeResult == null) {
				showupMessageInDialog('修改密码时发生错误，请重试！', '请重试','wrong');
			}
		}
	}
};

/*
 * 检查新密码的符合性。
 * 前提：	无
 * 输入:		参数1：新密码单元的name值
 * 			参数2：确认密码单元的name值
 * 出口：	返回调用点。
 * 返回：	true/false
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-1-1
 * 
 * 1.1版本简述
 * 其实1.0版本仅针对密码有无和两次输入的一致性进行了检查，并调用checkPasswordPattern函数检查密码的长度。
 * 本版进行完成了如下调整：
 * 1）	取消密码有无的检查，因为密码长度检查已经杜绝了空密码的情况。
 * 2）	取消checkPasswordPattern函数的调用。
 * 3）	丰富了密码检查的内容，排除了2位连续重复，3位连续重复，以及简单密码的情况。
 * 
 * @author Harry
 * @version 1.1 2014-2-26
 * 
 * 调用者：	1）	函数：changePassword()；
 * 			2）	页面changeorgpwd.html的更改密码按键；
 */
function checkNewPWD (nameOfPWD, nameOfReTyping) {
//	if (!notEmptyCheck('form')) {return false;};
	if ($("[name=" + nameOfPWD+ "]").val() != $("[name=" + nameOfReTyping + "]").val() ) {
		showupHelpMessage($("[name=" + nameOfPWD + "]")[0], '您两次输入的新密码不相同',false);
		return false;
	} else {
//		return checkPasswordPattern($("[name=" + nameOfPWD + "]")[0]);	
		var thePWDElem = $("[name=" + nameOfPWD + "]")[0];
		clearupHelpMessage();
		var pwd = thePWDElem.value;
		if(pwd.length < 6){
			showupHelpMessage(thePWDElem, '密码长度应不小于6位数字或字母',false);
			return false;
		}
		for (var i = 0; i < pwd.length; i+=2){
			if (pwd.substr(i,2) == pwd.substr(i+2,2)) {
				showupHelpMessage(thePWDElem, '您的密码存在连续的两位字符重复，请选用更安全的密码！',false);
				return false;					
			}
		}
		for (var i = 0; i < pwd.length; i+=3){
			if (pwd.substr(i,3) == pwd.substr(i+3,3)) {
				showupHelpMessage(thePWDElem, '您的密码存在连续的三位字符重复，请选用更安全的密码！',false);
				return false;					
			}
		}
		if (pwdStrength(pwd) < 8000) {
			showupHelpMessage(thePWDElem, '您的密码过于简单，强度未达到8000',false);
			return false;		
		}
		return true;
	};
};

/*
 * 随机密码生成器。
 * 前提：	无
 * 输入:		无
 * 出口：	返回调用点。
 * 返回：	无
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-2-26
 * 
 * 调用者：	1）	函数：changePassword()中的随机密码生成器的链接；
 * 			2）	页面changeorgpwd.html的随机密码生成器的链接；
 */
function pwdGenerator() {
	var randomPWD = document.createElement('div');
	$.get('resource/templates/pwdgenerator.html', function( data ) {
			randomPWD.innerHTML=data;
		}, 'text');	
	var contentHTML = '';
	for (var i =0; i< 6;i++) {
		contentHTML += '<input class="formated-input ui-widget-content ui-corner-all" '
			+ 'size="1" style="text-align:center; height:31px;margin:0 1rem" disabled="disabled">';
	}
	
	$(randomPWD).children('fieldset').html(contentHTML);
	$(randomPWD).addClass='dialog-body';
	document.body.appendChild(randomPWD);

	var charNumbers=[];
	var charUpperCases=[];
	var charLowerCases=[];
	for (i = 0; i < 10; i++) {
		charNumbers.push(i);
	}	 				
	for (i = 0; i < 26; i++) {
		if (i==14) continue;
		charUpperCases.push(String.fromCharCode(65 + i));
	}	 				
	for (i = 0; i < 26; i++) {
		if (i==14) continue;
		charLowerCases.push(String.fromCharCode(97 + i));
	}				
	
	var spinner = $( "#spinner" ).spinner({
		max: 18,
		min: 6,
		spin: function(event, ui){
			var characterBox = $(randomPWD).children('fieldset');
			contentHTML='';
			for (var i = 0; i < ui.value; i++){
				contentHTML += '<input class="formated-input ui-widget-content ui-corner-all" '
					+ 'size="1" style="text-align:center;height:31px;margin:0 1rem" disabled="disabled">';
				if (((i+1)%6)==0) { contentHTML += '<br>';}
			}
			characterBox.html(contentHTML);
		},
	});
	
	spinner.spinner( "value", 6 );
	$(randomPWD).dialog({
		title: '随机密码生成器',
	   	autoOpen : true,
		height: 430,
		buttons: {
	 		"芝麻开门，给我一个好密码吧！": function(){
	 			var chars=[];
	 			switch ($('input[name="numberOrLetter"]:checked').val()) 
	 			{
	 			case '1':
		 			for (var i = 0; i < charNumbers.length; i++) {
		 				chars.push(charNumbers[i]);
		 			}
		 			switch ($('input[name="upperOrLower"]:checked').val())
		 			{
		 			case '1':
		 				for (var i = 0; i < charUpperCases.length; i++) {
			 				chars.push(charUpperCases[i]);
			 			}
		 				for (var i = 0; i < charLowerCases.length; i++) {
		 					chars.push(charLowerCases[i]);
		 				}
		 				break;
		 			case '2':
		 				for (var i = 0; i < charUpperCases.length; i++) {
		 					chars.push(charUpperCases[i]);
		 				}
		 				break;
		 			case '3':
		 				for (var i = 0; i < charLowerCases.length; i++) {
		 					chars.push(charLowerCases[i]);
		 				}
		 				break;
		 			}
	 				break;
	 			case '2':
	 				for (var i = 0; i < charNumbers.length; i++) {
	 					chars.push(charNumbers[i]);
	 				}
	 				break;
	 			case '3':
	 				switch ($('input[name="upperOrLower"]:checked').val())
	 				{
	 				case '1':
	 					for (var i = 0; i < charUpperCases.length; i++) {
	 						chars.push(charUpperCases[i]);
	 					}
	 					for (var i = 0; i < charLowerCases.length; i++) {
	 						chars.push(charLowerCases[i]);
	 					}
	 					break;
	 				case '2':
	 					for (var i = 0; i < charUpperCases.length; i++) {
	 						chars.push(charUpperCases[i]);
	 					}
	 					break;
	 				case '3':
	 					for (var i = 0; i < charLowerCases.length; i++) {
	 						chars.push(charLowerCases[i]);
	 					}
	 					break;
	 				}
	 				break;
	 			};
	 			var characterBox = $(randomPWD).children('fieldset').children('input');
	 			var pwd ='';
	 			for (var i = 0; i < characterBox.length; i++) {
	 				var j = Math.ceil(Math.random()*chars.length)-1;
	 				characterBox[i].value=chars[j];
	 				pwd += chars[j];
	 			}
	 			$('#strength').html(pwdStrength(pwd));
	 		},
	 		"退出" : function() {
	 			closeDialog(this);
			}
		}
	});
};

/*
 * 密码强度值计算。
 * 前提：	无
 * 输入:		参数1：	密码字符串
 * 出口：	返回调用点。
 * 返回：	密码强度值
 * 改进：	无
 * 
 * @author Harry
 * @version 1.0 2014-2-26
 * 
 * 调用者：	1）	函数：changePassword()中的随机密码生成器的链接；
 * 			2）	页面changeorgpwd.html的随机密码生成器的链接；
 * 			3）	函数：pwdGenerator()；
 */
function pwdStrength(thePWD){
	var charDiff = [];
	var charVal = 1;
	for (var i = 0; i < thePWD.length-1; i++) {
		charDiff[i] = Math.abs((thePWD.substr(i,1)).charCodeAt() - (thePWD.substr(i+1,1)).charCodeAt());
	}
	for (var i = 0; i < charDiff.length; i++) {
		charVal = charVal * (charDiff[i]+1);
	}
	return charVal;
};

/**
 * 
 */

//触发重置密码弹出窗口的函数，由相应菜单项的click事件触发
function resetPassword() {
	var resetPWD =function(){
		var r="";
		$.ajax ({
			url: "changePWD.do",
			dataType: 'text',
			data: 'userCode=' + document.getElementById('userCode').value,
			success: r = function(data){
				r = ajaxTextProcessing(data);
			}
		});
		if (r == 1) {
			showupMessageInDialog('操作员【' + $('#userCode', resetPWDDialog).find(':selected').text() + '】的密码已成功重置为系统初始密码123456！','请知晓');
		}
		if (r == null) {
			showupMessageInDialog('重置操作员【' + $('#userCode', resetPWDDialog).find(':selected').text() + '】的密码发生错误，请检查工号！','请检查','alarm');
		};
		closeDialog(resetPWDDialog);
	};

	var resetPWDDialog = document.createElement('div');
	resetPWDDialog.innerHTML='<div style="margin:1rem"><label style="padding-left:1rem" >'
		+ '请选择人员：</label><select id="userCode" class="not-empty"'
		+' style="width: 12rem; margin-left:1rem; margin-top: 1.5rem"></div>';
	resetPWDDialog.className='dialog-body';
	document.body.appendChild(resetPWDDialog);
	fillInStaff(undefined, $('#userCode',resetPWDDialog));
//	$('#userCode', resetPWDDialog).pyCombobox();
	standardizingUI(resetPWDDialog);
	
	$(resetPWDDialog).dialog({
		title: '重置登录密码',
	   	autoOpen : true,
		height: 'auto',
		width: 350,
		buttons: {
	 		"重置密码" :	function() {
	 			if (checkValidation(resetPWDDialog)) {
	 				confirmingDialog('您准备重置<span class="label-as-badge badge-success">' 
 						+ $('#userCode', resetPWDDialog).find(':selected').text() 
 						+ '</span>的操作密码！<br/><br/>'
 						+ bulletType1 + '点击<span class="ui-state-default">&quot;确认&quot;</span>将重置密码为初始密码；'
 						+ '</br />' + bulletType1 
 						+ '点击<span class="ui-state-default">&quot;放弃&quot;</span>将保留现在的密码。', 
 						'请确认', resetPWD, function(){return;}, '确认', '放弃', 'alarm');
	 			};
	 		},
			"退出" : function() {
				closeDialog(this);
			}
		}
	}); 
};
