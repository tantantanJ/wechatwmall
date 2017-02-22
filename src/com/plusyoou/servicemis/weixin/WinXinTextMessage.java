package com.plusyoou.servicemis.weixin;


public class WinXinTextMessage extends WeiXinMessage{
    private String Content;  // 回复的消息内容  

    public String getContent() {  
        return Content;  
    }  

    public void setContent(String content) {  
        Content = content;  
    }  
}
