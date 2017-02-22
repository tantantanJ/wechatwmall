package com.plusyoou.servicemis.weixin;


public class WeiXinImageMessage extends WeiXinMessage{
    private String PicUrl;  // 图片链接  

    public String getPicUrl() {  
        return PicUrl;  
    }  

    public void setPicUrl(String picUrl) {  
        PicUrl = picUrl;  
    }  
}
