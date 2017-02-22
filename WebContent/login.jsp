<?xml version="1.0" encoding="UTF-8" ?>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
<head>
<title>登录</title>
<link rel="shortcut icon" href="resource/favicon.ico" />
<script type="text/javascript" src="admin/scripts/md5.js"></script>
<style type="text/css">
html {
	font-family: 微软雅黑, 宋体, Arial;
	font-size: 12px;
}

#backgroundPicture {
	background-image: url("resource/login.jpg");
	background-repeat: no-repeat;
	background-size: 100% 100%;
	position: absolute;
	margin: 0px;
	padding: 0px;
	top: 0px;
	left: 0px;
	border: 0;
	height: 100%;
	width: 100%;
	z-index: -9999;
}

/* 	border-radius是css3新属性，在老版本的IE中不支持	*/
input {
	border-radius: 5px;
	padding: 0px;
}

#input-area {
    font-size: 16px;
    top: 35%;
    left: 65%;
    display: table;
    position: absolute;
}

.table-row {
	display: table-row;
	/*  	font-weight: bold;  */
	vertical-align: middle;
}

.table-row p {
	display: table-cell;
	padding: 8px;
}

.table-row input {
	width: 150px;
	height: 28px;
}

.table-row p:first-child {
	text-align: right;
}

.table-row label {
	display: inline-block;
	text-align: right;
}

#nameOfCompany { 
	font-size: 35px;
	float: left;
	position: absolute;
	left: 28%;
	top: 18%;
	font-weight: bold;
	letter-spacing: 0.8rem;
	color: #B46E1E;
}

.need-bulletin {
	background-color: AntiqueWhite;
	background: AntiqueWhite;
}
</style>

<script language="javascript">
function checkForm(theForm){
	if ((checkUserCode(theForm))){
		return true;
	} else {
		return false;
	}
} 
	
function checkUserCode(theForm){
	if(!/^[\u4e00-\u9fa5_a-zA-Z0-9]+$/.test(theForm["userCode"].value)){
		document.getElementById("helper").style.visibility="visible";
		theForm["userCode"].className="need-bulletin";
		return false;
	} else {
		document.getElementById("helper").style.visibility="hidden";
		theForm["userCode"].className="";
		return true;
	} 
	
}
function login(){
	if (!checkForm(document.getElementById('input-area'))) {return false;}
    var theForm = document.createElement("form");
    theForm.method='post';
    theForm.action='loginCheck.do';
    document.body.appendChild(theForm);
    var input = document.createElement("input");
    input.name = 'userCode';
    input.value = document.getElementById('userCode').value;
    theForm.appendChild(input);
    input = document.createElement("input");
    input.name = 'password';
    input.value = md5(document.getElementById('password').value);
    theForm.appendChild(input);
    theForm.submit();
    document.body.removeChild(theForm);
}

</script>
</head>

<body
	onload="document.getElementById('helper').style.visibility='hidden'; document.getElementById('userCode').focus();">

	<div id="backgroundPicture"></div>
<!-- 	<div id="nameOfCompany"> -->
<%-- 		<%= application.getInitParameter("companyName") %></div> --%>
	<form id="input-area" method="post"
		onsubmit="return checkForm(this); this.disabled=true;">
		<div id="helper" class="table-row"
			style="text-align: right; display: table-caption; font-size: 14px; background-color: #728C00; color: white; visibility: hidden">
			工号只能含汉字、数字或字母，请改正</div>
		<div class="table-row">
			<img src="resource/code.png" />
			<p>
				<input id="userCode" type="text" name="userCode"
					onblur="checkUserCode(this.form)" />
			</p>
		</div>

		<div class="table-row">
			<img src="resource/pwd.png" />
			<p>
				<input id="password" type="password" name="password" />
			</p>
		</div>

		<div class="table-row">
			<p>&nbsp;</p>
			<p>
				<input type="button" onclick="login()" 
				  name="ok" style="background: url(resource/logtosys.png) center center no-repeat; background-color: lightgray; width: 100%" />
			</p>
		</div>
	</form>

</body>
</html>