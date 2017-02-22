
$(function(){
	var preview = GetQueryString("preview"); 
	var inID = GetQueryString("id");
	
	var xxxx;
	
	if (preview === null || preview !== 'true') {
		$.get('storeNav.html', function(data){
			$('body').find('footer').append(data);
			$("#links").prop('href', "searchGoods.html?storeId="+inID);
			$("#dianhualinks").prop('href', "weixintu.html?dianhuaid="+xxxx.DianHua+"&wxid="+xxxx.wxURL);
		},'text');
	}	
	
	if(inID==null) { //参数错误未处理
		alert("未接收到ID号");
		return;
	};   
	$("#storeSM").html("输入ID= "+inID);
    $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=门店信息&engine=static&id='+inID,
        async: false,
        dataType : 'json',
        success : function( data ) {
				returnData = data.rows;
				xxxx=returnData[0];
				if(returnData!=undefined && returnData.length!=0){
				htmlStr="";
				htmlStr=htmlStr+"<li class='logo'>";
				htmlStr=htmlStr+"<img src="+(returnData[0].LogoURL)+"></li>";
				htmlStr=htmlStr+"<li class='logoinfo'><p class='storebanner_name'>"+(returnData[0].MingCheng)+"</p>";
				htmlStr=htmlStr+"<p class='storebanner_loc'><img src='./upload/icon/location_bai.png' class='loc'>"+(returnData[0].DiZhi)+"</p>";
				htmlStr=htmlStr+"</li>";
				$("#storeXX").html(htmlStr);
				$("#storeSM").html(returnData[0].JianJie);
				$("title").html(returnData[0].MingCheng); 
				
			    $(".storebanner").css("background","url("+returnData[0].BnanerURL+") no-repeat");
			    
				}
				
		},
		
    });
    var testID=$("#links");
    $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=门店活动&engine=static&id='+inID,
        async: false,
        dataType : 'json',
        success : function( data ) {
				returnData = data.rows;
				if(returnData!=undefined && returnData.length!=0){
				htmlStr="";
				for (var i = 0; i <returnData.length ; i++) {
					htmlStr=htmlStr+"<div class='swiper-slide'>"+"<a href=huodong.html?id=";
					htmlStr=htmlStr+(returnData[i].ID)+">";
					htmlStr=htmlStr+"<img src=";
					htmlStr=htmlStr+(returnData[i].ImgURL)+">";
					htmlStr=htmlStr+"<div class='active'>";
					htmlStr=htmlStr+"<h3 class=''>"+(returnData[i].MingCheng)+"</h3>";
					htmlStr=htmlStr+"<p >"+(returnData[i].ShuoMing)+"</p>";
					htmlStr=htmlStr+"</div></a></div>";
					};
				$("#storeHD").html(htmlStr);	
			    var swiper = new Swiper('.swiper-container-a', {
			        pagination: '.swiper-pagination-a',
			        paginationClickable: true,
			        spaceBetween: 30,
			        centeredSlides: true,
			        autoplay: 2500,
			        autoplayDisableOnInteraction: false
			    });
				}
       },
    });
    
    $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=门店商品&engine=static&id='+inID,
        async: true,
        dataType : 'json',
        success : function( data ) {
				returnData = data.rows;
				if(returnData!=undefined && returnData.length!=0){
				htmlStr="";
				htmlStr=htmlStr+"<ul class='list'>";
				for (var i = 0; i <returnData.length ; i++) {
					htmlStr=htmlStr+"<li><a href=product.html?id=";
					htmlStr=htmlStr+(returnData[i].ID);
					htmlStr=htmlStr+"><p class='productimg'><img src=";
					htmlStr=htmlStr+(returnData[i].ImgURL);
					htmlStr=htmlStr+"></p><p class='productname'>";
					htmlStr=htmlStr+(returnData[i].MingCheng);
					htmlStr=htmlStr+"</p><p class='productprice'>&yen;<b>";
					htmlStr=htmlStr+(returnData[i].JiaGe)+"</b>/"+(returnData[i].DanWei);
					htmlStr=htmlStr+"</p></a></li>";
					if ((i-1)% 2== 0){
						htmlStr=htmlStr+"</ul>";
						htmlStr=htmlStr+"<ul class='list'>";
					}
				};
				for(var j=0;j<i%2;j++){htmlStr=htmlStr+"<li style='border:0'></li>"}
				htmlStr=htmlStr+"</ul>";
				$("#productView").html(htmlStr);	
				}
        	
       },
    });
   
    $.ajax({
        url : 'wmall.do',
        type : 'POST',
        data: 'active=enter&store='+inID,
        async: true,
        dataType : 'json',
        success : function( data ) {
        },
    });
    
});

