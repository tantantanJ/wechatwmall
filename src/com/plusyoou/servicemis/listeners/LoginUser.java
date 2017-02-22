package com.plusyoou.servicemis.listeners;

public class LoginUser  {
	
	private String UserCode;
	private String CaoZuoMiMa;
	private int StoreID;  //门店ID，使用字符型不是数据库中的数字型
	private String StoreName;
	private String OpenID;
	private String SessionID;
	//用户当前登录的IP，在LoginCheck中赋值
	private String DengLuIP;
	//用户当前登录的时间，在LoginCheck中赋值
	private String DengLuShiJian;
	public String getUserCode() {
		return UserCode;
	}
	public void setUserCode(String userCode) {
		UserCode = userCode;
	}
	public String getCaoZuoMiMa() {
		return CaoZuoMiMa;
	}
	public void setCaoZuoMiMa(String caoZuoMiMa) {
		CaoZuoMiMa = caoZuoMiMa;
	}
	public int getStoreID() {
		return StoreID;
	}
	public void setStoreID(int storeID) {
		StoreID = storeID;
	}
	public String getStoreName() {
		return StoreName;
	}
	public void setStoreName(String storeName) {
		StoreName = storeName;
	}
	public String getOpenID() {
		return OpenID;
	}
	public void setOpenID(String openID) {
		OpenID = openID;
	}
	public String getSessionID() {
		return SessionID;
	}
	public void setSessionID(String sessionID) {
		SessionID = sessionID;
	}
	public String getDengLuIP() {
		return DengLuIP;
	}
	public void setDengLuIP(String dengLuIP) {
		DengLuIP = dengLuIP;
	}
	public String getDengLuShiJian() {
		return DengLuShiJian;
	}
	public void setDengLuShiJian(String dengLuShiJian) {
		DengLuShiJian = dengLuShiJian;
	}

	
}