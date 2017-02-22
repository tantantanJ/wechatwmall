package com.plusyoou.servicemis.listeners;


import static com.plusyoou.servicemis.utils.CommonUtils.get32BitMD5;
import static com.plusyoou.servicemis.utils.CommonUtils.get16BitMd5;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Calendar;
import java.util.Date;
import java.util.LinkedList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.sql.DataSource;

import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.PropertiesHandler;
/**
 * Application Lifecycle Listener implementation class ContextInitialization
 *
 */
public class AppContextInit implements ServletContextListener {
	private static final long PERIOD_DAY = 24*60*60*1000;
	private String startupLog;
    /**
     * Default constructor. 
     */
    public AppContextInit() {
        // TODO Auto-generated constructor stub
    	this.setStartupLog("\r\n系统启动： " + new Date() + "\r\n");
    	this.setStartupLog(this.getStartupLog() + "操作系统：" + System.getProperty("os.name") + "\r\n");
    	this.setStartupLog(this.getStartupLog() + "操作系统版本：" + System.getProperty("os.version") + "\r\n");
    	this.setStartupLog(this.getStartupLog() + "JAVA虚拟机版本：" + System.getProperty("java.version") + "\r\n");
    	this.setStartupLog(this.getStartupLog() + "JAVA虚拟机厂商：" + System.getProperty("java.vendor") + "\r\n");
    }
    

	/**
     * @see ServletContextListener#contextInitialized(ServletContextEvent)
     */
    @SuppressWarnings("rawtypes")
	public void contextInitialized(ServletContextEvent arg0) {
        // TODO Auto-generated method stub
    	ServletContext servletCTX = arg0.getServletContext();
    	/**
    	 * 用于外网虚拟服务器上确定Log4j日志文件位置
    	 * 取服务器上应用的真实地址，将之放在系统参数中，供log4j.properties中取用
    	 * log4jdir:/home/plusyoouup8luu6sey0oropu/wwwroot/
    	 */
    	String rootDir = servletCTX.getRealPath("/");
    	this.setStartupLog(this.getStartupLog() + "应用程序根目录：" + rootDir + "\r\n");
    	
  	  	System.setProperty("log4jdir", rootDir);
  	  	//这个语句起不了作用，因为JAVA系统的缺省编码是在虚拟机启动是就固定了的。无法在应用程序中修改。
  	  	//
//  	  	System.setProperty("file.encoding","utf-8");

		try {
			Context iniCTX = new InitialContext();
			PropertiesHandler ph = new PropertiesHandler(CommonUtils.getAppPath()+"WEB-INF/", "plusyoouresource.properties");
			String DSName = ph.getProperty("source.name");
			Context context = (Context) iniCTX.lookup("java:comp/env");
			DataSource ds = (DataSource) context.lookup(DSName);
			servletCTX.setAttribute("DS", ds);			
		} catch (NamingException e) {
			this.setStartupLog(this.getStartupLog() + "不能连接数据源，请联系系统员！\r\n");
			e.printStackTrace();
		}
	
    }

	/**
     * @see ServletContextListener#contextDestroyed(ServletContextEvent)
     */
    public void contextDestroyed(ServletContextEvent arg0) {
        // TODO Auto-generated method stub
    	System.getProperties().remove("log4jdir");
    	arg0.getServletContext().removeAttribute("DS");
    }


	public String getStartupLog() {
		return startupLog;
	}


	public void setStartupLog(String startupLog) {
		this.startupLog = startupLog;
	}
}
