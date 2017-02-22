var Inid;
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
        	    	var htmlStr="";
        	    	htmlStr=htmlStr+"<ul>";
    				for (var i = 0; i <returnData.length ; i++) {
                       htmlStr=htmlStr+"<li>";
                       htmlStr=htmlStr+"<a href='javascript:void xianshishangpin("+returnData[i].ID+",\""+getText+"\")' id="+returnData[i].ID+"><span class='value'>"+returnData[i].MingCheng+"</span></a></li>";
       				   if ((i+1)% 4== 0){
						 htmlStr=htmlStr+"</ul>";
						 htmlStr=htmlStr+"<ul>";
						}
    				};
					htmlStr=htmlStr+"</ul>";
				    $("#xuanleibie").html(htmlStr);
					
        	    }
        	
         },
       });
		
      xianshishangpin();
      $('#queren').click(function(){
    	   var text=$(".searchBar").val();
    	   var getId=$(".current").attr("id");
    		   xianshishangpin(getId,text);
       })
		
});

        
function xianshishangpin(idNum,Text){
	Inid=GetQueryString("storeId");
	if(Text==""){
		var getTxt=$(".searchBar").val();
	}
	else{getTxt=Text;}
	var outgoingData = 'infoType=类别商品&engine=static';
	if (idNum==null) {
		outgoingData += '&MingCheng='+getTxt;
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
	if(Inid){
		outgoingData +='&LeiBie=' + idNum+'&MingCheng='+getTxt+'&MenDianID='+Inid;
		$('.choosebox li a').removeClass("current");
		$("#"+idNum).addClass("current");
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
				htmlStr=htmlStr+"<ul class='list'>";
				for (var i = 0; i<returnData.length ; i++) {
					htmlStr=htmlStr+"<li><a href=product.html?id="+(returnData[i].ID)+">";
					htmlStr=htmlStr+"<p class='productimg'><img src="+(returnData[i].ImgURL)+"></p>";
					htmlStr=htmlStr+"<p class='productname'>"+(returnData[i].MingCheng)+"</p>";
					htmlStr=htmlStr+"</p><p class='storename'>";
					htmlStr=htmlStr+"<p class='productprice'>&yen;<b>"+(returnData[i].JiaGe)+"</b>/"+(returnData[i].DanWei);
					htmlStr=htmlStr+"</p></a></li>";
					
					if ((i-1)% 2 == 0){
					htmlStr=htmlStr+"</ul>";
					htmlStr=htmlStr+"<ul class='list'>";
					}
				};
				for(var j=0;j<i%2;j++){htmlStr=htmlStr+"<li style='border:0'></li>"}
				htmlStr=htmlStr+"</ul>";
			}
			$("#shangpin").html(htmlStr);
		},
	});
	

}
