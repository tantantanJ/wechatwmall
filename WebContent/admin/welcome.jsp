<?xml version="1.0" encoding="UTF-8" ?>
<%@ page language="java" contentType="text/html; charset=UTF-8"
	pageEncoding="UTF-8"
	import="com.plusyoou.servicemis.listeners.LoginUser"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html>
<head>
 
<title><%= ((LoginUser)session.getAttribute("LoginUser")).getStoreName()%>的设置</title>

  <link rel="stylesheet" type="text/css" href="css/imgareaselect-default.css" />
  <link href="css/bootstrap.min.css" rel="stylesheet" />
  <link href="css/cropper.css" rel="stylesheet" />
  <link href="css/croppermain.css" rel="stylesheet" />

    <style>
      .cropit-preview {
        background-color: #f8f8f8;
        background-size: cover;
        border: 1px solid #ccc;
        border-radius: 3px;
        margin-top: 7px;
        width: 250px;
        height: 250px;
      }

      .cropit-preview-image-container {
        cursor: move;
      }

      .image-size-label {
        margin-top: 10px;
      }

      input {
        display: block;
      }

      button[type="submit"] {
        margin-top: 10px;
      }

      #result {
        margin-top: 10px;
        width: 900px;
      }

      #result-data {
        display: block;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        word-wrap: break-word;
      }
    </style>

<style type="text/css">
.ui-button .ui-icon.close {
	background-image: url("resource/close.png");
	width: 16;
	height: 16;
}

.ui-button .ui-icon.next {
	background-image: url("resource/next.png");
	width: 16;
	height: 16;
}

.ui-button .ui-icon.prev {
	background-image: url("resource/previous.png");
	width: 16;
	height: 16;
}

.popups {
	font-size: 0.9em;
	background-color: blue;
	border-radius: 5px;
	box-shadow: 0 0 25px 10px #999;
	padding: 5px;
	min-width: 400px;
}

.report-tip {
	padding: 5px;
}
/*  .ui-widget-overlay {  */
/*  	background:black;  */
/*  	opacity: 0.6;  */
/*  }  */
</style>


</head>

<body>
	<!-- <div class="box-hold-everything"> -->
	<div class="title"><%= ((LoginUser)session.getAttribute("LoginUser")).getStoreName()%></div>
	<div class="nav">
	   <button onclick="click_image()">概览</button>
	   <button onclick="click_product_add()">添加商品</button>
       <button onclick="">活动</button>
	</div>
    <div id="input-area" >
        <div>
            <label>店铺地址：</label>   <input type="text" />    
        </div>
        <div>
            <label>主营产品：</label>   <input type="text" />
        </div>
        <div>
            <label>店铺说明：</label>  <input type="text" />
        </div>
        <div>
            <label>联系电话：</label>     <input type="text" />
        </div>
        <div>
            <label>微信名片：</label>
		    <div id="weixintupian" class="avatar-view" title="微信名片">
		      <img src="img/picture.jpg" alt="微信名片" onclick="click_image()" />
		    </div>
        </div>
        <div>
            <label>LOGO：</label>
		    <div class="avatar-view" title="店面LOGO">
		      <img src="img/picture.jpg" alt="店面LOGO" onclick="click_image()" />
		    </div>
        </div>
        <div>
            <label>店招：</label>
		    <div class="avatar-view" title="店招图片">
		      <img src="img/picture.jpg" alt="店招图片" onclick="click_image()" />
		    </div>
        </div>

    </div>

<!-- <div class="container" id="crop-avatar"> -->
<!--             <div id="weixintupian" class="avatar-view" title="微信名片"> -->
<!--               <img src="img/picture.jpg" alt="微信名片"  /> -->
<!--             </div> -->

    <!-- Cropping modal -->
<!--     <div class="modal fade" id="avatar-modal" aria-hidden="true" aria-labelledby="avatar-modal-label" role="dialog" tabindex="-1"> -->
<!--       <div class="modal-dialog modal-lg"> -->
<!--         <div class="modal-content"> -->
<!--           <form class="avatar-form" action="fileUploading.do" enctype="multipart/form-data" method="post"> -->
<!--             <div class="modal-header"> -->
<!--               <button class="close" data-dismiss="modal" type="button">&times;</button> -->
<!--               <h4 class="modal-title" id="avatar-modal-label">Change Avatar</h4> -->
<!--             </div> -->
<!--             <div class="modal-body"> -->
<!--               <div class="avatar-body"> -->

<!--                 Upload image and data -->
<!--                 <div class="avatar-upload"> -->
<!--                   <input class="avatar-src" name="avatar_src" type="hidden" /> -->
<!--                   <input class="avatar-data" name="avatar_data" type="hidden" /> -->
<!--                   <label for="avatarInput">选择图片</label> -->
<!--                   <input class="avatar-input" id="avatarInput" name="avatar_file" type="file" /> -->
<!--                 </div> -->

<!--                 Crop and preview -->
<!--                 <div class="row"> -->
<!--                   <div class="col-md-9"> -->
<!--                     <div class="avatar-wrapper"></div> -->
<!--                   </div> -->
<!--                   <div class="col-md-3"> -->
<!--                     <div class="avatar-preview preview-lg"></div> -->
<!--                     <div class="avatar-preview preview-md"></div> -->
<!--                     <div class="avatar-preview preview-sm"></div> -->
<!--                   </div> -->
<!--                 </div> -->

<!--                 <div class="row avatar-btns"> -->
<!--                   <div class="col-md-9"> -->
<!--                     <div class="btn-group"> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="-90" type="button" title="Rotate -90 degrees">Rotate Left</button> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="-15" type="button">-15deg</button> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="-30" type="button">-30deg</button> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="-45" type="button">-45deg</button> -->
<!--                     </div> -->
<!--                     <div class="btn-group"> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="90" type="button" title="Rotate 90 degrees">Rotate Right</button> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="15" type="button">15deg</button> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="30" type="button">30deg</button> -->
<!--                       <button class="btn btn-primary" data-method="rotate" data-option="45" type="button">45deg</button> -->
<!--                     </div> -->
<!--                   </div> -->
<!--                   <div class="col-md-3"> -->
<!--                     <button class="btn btn-primary btn-block avatar-save" type="submit">完成</button> -->
<!--                   </div> -->
<!--                 </div> -->
<!--               </div> -->
<!--             </div> -->
<!--             <div class="modal-footer">
<!--               <button class="btn btn-default" data-dismiss="modal" type="button">Close</button> -->
<!--             </div> --> -->
<!--           </form> -->
<!--         </div> -->
<!--       </div> -->
<!--     </div>/.modal -->

<!--     Loading state -->
<!--     <div class="loading" aria-label="Loading" role="img" tabindex="-1"></div> -->

<!-- </div> -->

      <div class="image-editor">
        <input type="file" class="cropit-image-input">
        <div class="cropit-preview"></div>
        <div class="image-size-label">
          Resize image
        </div>
        <input type="range" class="cropit-image-zoom-input">
        <input type="hidden" name="image-data" class="hidden-image-data" />
        <button id="sub">Submit</button>
      </div>
    <div id="result">
      <code>$form.serialize() =</code>
      <code id="result-data"></code>
    </div>

  <script src="scripts/jquery.min.js"></script>
//  <script src="scripts/bootstrap.min.js"></script>
//  <script src="scripts/cropper.js"></script>
//  <script src="scripts/croppermain.js"></script>
  <script type="text/javascript" src="scripts/jquery.cropit.js"></script>

    <script>
      $(function() {
        $('.image-editor').cropit();
        
        $('#sub').click(function() {
          // Move cropped image data to hidden input
          var imageData = $('.image-editor').cropit('export');
          $('.hidden-image-data').val(imageData);
console.log("IMGDATA:" + imageData);

          // Print HTTP request params
          var formValue = $(this).serialize();
          $('#result-data').text(formValue);
          
          $.ajax({
              url:'uploadImg.do',
              type : 'POST',
              data: 'image-data='+JSON.stringify({"img":imageData}),
              async: false,
              dataType : 'json',
              success : function( data ) {
            	  alert(data);
                  },
          });
          
          
          
          // Prevent the form from actually submitting
          return false;
        });
      });
    </script>
	
<script>


function click_product_add(){
    $("#input-area").empty();
}
function click_image(){
	$().CropAvatar(getImageData);
	
}

</script>


</body>
</html>