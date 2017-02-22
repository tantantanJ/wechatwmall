
$(function(){
	var inID = GetQueryString("id"); 
	if(inID==null) { //参数错误未处理
		alert("未接收到ID号");
		return;
	};   
	var preview = GetQueryString("preview"); 
	if (preview === null || preview !== 'true') {
		$.get('huodongNav.html', function(data){
			$('body').find('footer').append(data);
			if(inID!=1){
				$("#links1").prop('href', "huodong.html?id="+(parseInt(inID)-1));
			}
				$("#links2").prop('href', "huodong.html?id="+(parseInt(inID)+1));
		},'text');
	}
    $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=活动信息&engine=static&id='+inID,
        async: false,
        dataType : 'json',
        success : function( data ) {
				returnData = data.rows;
				if(returnData!=undefined && returnData.length!=0){
				htmlStr="";
				htmlStr=htmlStr+"<li>";
				htmlStr=htmlStr+"<img src="+(returnData[0].ImgURL)+">";
				htmlStr=htmlStr+"<div class='huodongtitle'>";
				htmlStr=htmlStr+"<p>"+(returnData[0].MingCheng)+"</p>";
				htmlStr=htmlStr+"</div></li>";
				$("#huodongXX").html(htmlStr);
				$("#huodongSM").html(returnData[0].ShuoMing);
				if(returnData[0].Preducts!=null && returnData[0].Preducts!=""){
					fillHuoDongShangPing(returnData[0].Preducts);
					}
				$("title").html(returnData[0].MingCheng);
				var huodongxiangqing=$('#huodongSM').html();
				if(huodongxiangqing==""){
					$('.huodongsection').addClass('yincang');   /*如果没输内容，隐藏整个section*/
				}
			} 
            },
    });
  
    $.ajax({
        url : 'wmall.do',
        type : 'POST',
        data: 'active=enter&huodong='+inID,
        async: true,
        dataType : 'json',
        success : function( data ) {
        },
    });
    
});

function fillHuoDongShangPing(Preducts) { 
    $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=活动商品&engine=static&Preducts='+Preducts,
        async: false,
        dataType : 'json',
        success : function( data ) {
				returnData = data.rows;
				if(returnData!=undefined && returnData.length!=0){
				htmlStr="";
				htmlStr=htmlStr+"<ul class='list'>";
				for (var i = 0; i <returnData.length ; i++) {
					htmlStr=htmlStr+"<li><a href=product.html?id="+(returnData[i].ID)+"&huodong=true>";
					htmlStr=htmlStr+"<p class='huodongLogo'><img src="+(returnData[i].ImgURL)+"></p>";
					htmlStr=htmlStr+"<p class='huodongName'>"+(returnData[i].MingCheng)+"</p>";
					htmlStr=htmlStr+"<p class='huodongPrice'>&yen;<b>"+(returnData[i].HuoDongJia)+"</b>/"+(returnData[i].DanWei);
					htmlStr=htmlStr+"<p class='huodongoldPrice'><b>&yen;"+(returnData[0].YuanJia)+"/"+(returnData[0].DanWei)+"</b></p>";
					htmlStr=htmlStr+"</p></a></li>";
					
					if ((i-1)% 2 == 0){
						htmlStr=htmlStr+"</ul>";
						htmlStr=htmlStr+"<ul class='list'>";
						}
				};
				for(var j=0;j<i%2;j++){htmlStr=htmlStr+"<li class='temp' style='border:0'></li>"}
				htmlStr=htmlStr+"</ul>";
				$("#huodongshangpin").html(htmlStr);	
			} 
        	
       },
    });

}
