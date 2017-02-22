$(function(){
	var inHuoDong = GetQueryString("huodong"); 
	var preview = GetQueryString("preview"); 
	if (preview === null || preview !== 'true') {
		$.get('searchNav.html', function(data){
			$('body').find('footer').append(data);
		},'text');
	}

      $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=商品类别&engine=static',
        async: false,
        dataType : 'json',
        success : function( data ) {
        	    var getText=$(".searchBar").val();
        	    returnData = data.rows;
        	    if(returnData!=undefined && returnData.length!=0){
        	    	htmlStr="";
        	    	htmlStr=htmlStr+"<ul>";
    				for (var i = 0; i <returnData.length ; i++) {
                       htmlStr=htmlStr+"<li>";
                       htmlStr=htmlStr+"<a href='javascript:void xianshimendian("+returnData[i].ID+",\""+getText+"\")' id="+returnData[i].ID+"><span class='value'>"+returnData[i].MingCheng+"</span></a></li>";
    				};
					htmlStr=htmlStr+"</ul>";
				    $("#xuanleibie").html(htmlStr);
        	    }
         },
       });
       xianshimendian();
       $('#queren').click(function(){
     	   var text=$(".searchBar").val();
     	   var getId=$(".current").attr("id");
     	       xianshimendian(getId,text);
        })
});


function xianshimendian(idNum,Text){
	var getTxt=(Text=="")?$(".searchBar").val():Text;
	var outgoingData = 'infoType=类别门店&engine=static';
	if (idNum==null) {
		outgoingData +='&MingCheng='+getTxt;
	    $.ajax({
	        url : 'wmall.do',
	        type : 'POST',
	        data: 'active=search&fujia='+Text,
	        async: true,
	        dataType : 'json',
	        success : function( data ) {
	        },
	    });
	}
	if (idNum) {
		outgoingData +='&LeiBie=' + idNum+'&MingCheng='+getTxt;
		$('.choosebox li a').removeClass("current");
		$("#"+idNum).addClass("current");
	    $.ajax({
	        url : 'wmall.do',
	        type : 'POST',
	        data: 'active=search&leibie='+idNum,
	        async: true,
	        dataType : 'json',
	        success : function( data ) {
	        },
	    });
	}
	
	$.ajax({
		url : 'getQueryResult.do',
		type : 'POST',
		data: outgoingData,
		async: false,
		dataType : 'json',
		success : function( data ) {
			returnData = data.rows;
			var htmlStr="";
			if(returnData!=undefined && returnData.length!=0){
				for (var i = 0; i <returnData.length ; i++) {
					htmlStr+=" <div class='storeList'><div class='storeLogo'><img src=";
					htmlStr+=(returnData[i].LogoURL)+"></div>";
					htmlStr+="<div class='storeInfo'><p>"+(returnData[i].Mingcheng)+"</p>";
					htmlStr+="<p><img src='./upload/icon/location_lan.png' class='loc'>"+(returnData[i].DiZhi)+"</p></div><div><a class='jindianBtn' href=store.html?id="+(returnData[i].ID)+">进店</a></div></div>";
				}
			}
			$("#mendian").html(htmlStr);
		},
	});
	

}