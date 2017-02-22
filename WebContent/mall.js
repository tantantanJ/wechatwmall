$(function(){
	
		var preview = GetQueryString("preview"); 
		if (preview === null || preview !== 'true') {
			$.get('mallNav.html', function(data){
				$('body').find('footer').append(data);
			},'text');
		}	
      $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=门店显示&engine=static',
        async: true,
        dataType : 'json',
        success : function( data ) {
        	    returnData = data.rows;
        	    if(returnData!=undefined && returnData.length!=0){
    				htmlStr="";
    				htmlStr="<div class='swiper-slide'><ul class='list4 more'>";
    				for (var i = 0; i <returnData.length ; i++) {
    					htmlStr=htmlStr+"<li><a href=store.html?id=";
    					htmlStr=htmlStr+(returnData[i].ID);
    					htmlStr=htmlStr+"><p class='stroeimg'><img src=";
    					htmlStr=htmlStr+(returnData[i].LogoURL);
    					htmlStr=htmlStr+"></p><p class='storename'>";
    					htmlStr=htmlStr+(returnData[i].MingCheng);
    					htmlStr=htmlStr+"</p></a></li>";
    					if ( (i+1) % 4 == 0){
    						htmlStr=htmlStr+"</ul></div><div class='swiper-slide'><ul class='list'>";
    					}
    				};
    				for(var j=0;j<(i+1)%4;j++){htmlStr=htmlStr+"<li style='border:0'></li>"}
    				htmlStr=htmlStr+"</ul></div>";
    				$("#storeView").html(htmlStr);	

    				var swiper = new Swiper('.swiper-container-b', {
    			    pagination: '.swiper-pagination-b',
    			    paginationClickable: true
    			    }); 
        	    };
       },
    });

   $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=商品显示&engine=static',
        async: true,
        dataType : 'json',
        success : function( data ) {
				returnData = data.rows;
			    if(returnData!=undefined && returnData.length!=0){
				htmlStr="";
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
				    $("#productView").html(htmlStr);
			    };
        },
    });
    
    $.ajax({
        url : 'getQueryResult.do',
        type : 'POST',
        data: 'infoType=所有活动&engine=static',
        async: true,
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
					htmlStr=htmlStr+"<h3 class=''><span>"+(returnData[i].MingCheng)+"</span></h3>";
					htmlStr=htmlStr+"<p >"+(returnData[i].ShuoMing)+"</p>";
					htmlStr=htmlStr+"</div></a></div>";
					};
				$("#huoDong").html(htmlStr);	
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
    
	var count=$("#storeView li").length;
		if(count==2){
			$("#storeView").addClass("list2");
	}
		else if(count==3){
			$("#storeView").addClass("list3");
	}
		else if(count==4){
			$("#storeView").addClass("list4");
		}
	var count=$("#productView li").length;
		if(count==2){
			$("#productView").addClass("list2");
	}
		else if(count==3){
			$("#productView").addClass("list3");
	}
		else if(count==4){
			$("#productView").addClass("list4");
		}
	
	$.ajax({
	    url : 'wmall.do',
	    type : 'POST',
	    data: 'active=enter&fujia=mall',
	    async: true,
	    dataType : 'json',
	    success : function( data ) {
	    },
	});
});

