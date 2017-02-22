package com.plusyoou.servicemis.services;

import static com.plusyoou.servicemis.utils.SQLUtils.executeSelectSQL;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Timestamp;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.PyException;
import com.plusyoou.servicemis.utils.SQLUtils;


public class RiZhiRecord extends HttpServlet{
	static Logger logger = Logger.getLogger(RiZhiRecord.class.getName());

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		this.doPost(req, resp);
	}

	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		String acceptContent = request.getHeader("Accept");
		//处理前端传来的accept=*/*的情况，禁止后台报错，并缺省设置Accept为json格式。
		if (acceptContent.indexOf(",")<0) {
			acceptContent="application/json";
		} else {
			acceptContent = acceptContent.substring(0, acceptContent.indexOf(","));
		}

    	response.setContentType(acceptContent + ";charset=UTF-8");

		//初始化response写入器
		PrintWriter out = response.getWriter();
		
    	//从session获取用户openID等信息
    	HttpSession session = request.getSession(true);

    	String strSQL="";
    	String ziduan="";
    	String shuzhi="";
    	String queryStr="";


    	if (request.getParameter("active").equals("enter")){
    		strSQL="select ID, ShiJian from fangwenrizhi where sessionID='"+session.getId()+"' and DongZhuo='进入' ORDER BY ShiJian DESC";
    		List listResults = executeSelectSQL(strSQL);
    		if( listResults == null) {
    			logger.info("查询访问日志时发生数据库连接错误！");
    		}
    		if( listResults.size() == 0) {
    			logger.info("未查询到上次进入页面记录");
    		}
    		if( listResults.size() >= 1) {
    			HashMap result = (HashMap)listResults.get(0);
    			DateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    			CommonUtils sqlTool = new CommonUtils((DataSource)request.getServletContext().getAttribute("DS"));
    			long diffTime=0;
    			Timestamp ts = (Timestamp)result.get("ShiJian");
    			diffTime =( ( new java.util.Date().getTime() - ts.getTime() )/1000);
    			strSQL = "UPDATE fangwenrizhi SET DongZhuo = '查看', TingLiuShiChang =" + diffTime + " WHERE ID =" + result.get("ID") + ";";
    			String[] strSQLBatch = {strSQL};
    			sqlTool.executeUpdateSQL(strSQLBatch);
    		}
    	}
    	
    	
    	strSQL = "INSERT INTO fangwenrizhi ";
    	
    	if (session.getAttribute("openID")!=null){
    		ziduan=ziduan+"openID,";
    		shuzhi=shuzhi+"'"+session.getAttribute("openID")+"',";
    	}
    	if (request.getParameter("store")!=null){
    		ziduan=ziduan+"storeID,";
    		shuzhi=shuzhi+request.getParameter("store")+",";
    	}
    	if (request.getParameter("product")!=null){
    		ziduan=ziduan+"productID,";
    		shuzhi=shuzhi+request.getParameter("product")+",";
    	}
    	if (request.getParameter("huodong")!=null){
    		ziduan=ziduan+"HuoDongID,";
    		shuzhi=shuzhi+request.getParameter("huodong")+",";
    	}
    	if (request.getParameter("leibie")!=null){
    		ziduan=ziduan+"LeiBieID,";
    		shuzhi=shuzhi+request.getParameter("leibie")+",";
    	}
    	if (request.getParameter("fujia")!=null){
    		ziduan=ziduan+"FuJiaCanShu,";
    		shuzhi=shuzhi+"'"+request.getParameter("fujia")+"',";
    	}
		ziduan=ziduan+"ShiJian,";
		shuzhi=shuzhi+"'"+new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date())+"',";
		ziduan=ziduan+"sessionID,";
		shuzhi=shuzhi+"'"+session.getId()+"',";
		ziduan=ziduan+"DongZhuo";
		switch (request.getParameter("active")){
		case "enter":
			shuzhi=shuzhi+"'进入'";
			break;
		case "leave":
			shuzhi=shuzhi+"'离开'";
			break;
		case "view":
			shuzhi=shuzhi+"'查看'";
			break;
		case "search":
			shuzhi=shuzhi+"'寻找'";
			break;
		case "tel":
			shuzhi=shuzhi+"'电话'";
			break;
		case "click":
			shuzhi=shuzhi+"'点击'";
			break;
		default:
			shuzhi=shuzhi+"'进入'";
		}

		strSQL  = "INSERT INTO fangwenrizhi ("+ziduan+") VALUES ("+shuzhi+");";
logger.info("strSQL="+strSQL);		
		String[] sqlStm = new String[1];
		sqlStm[0]=strSQL;
		String sqlResult = SQLUtils.executeSQLStmt(sqlStm);
		if (sqlResult == null){
			logger.error("新增访问日志记录发生SQL语句错误！未完成！SQL="+strSQL);
			return;
		}
		if (acceptContent.contains("plain")) {  
			out.println("OK~TRUE");
		} else {
			out.println("{\"status\":\"OK\", \"hasData\":\"FALSE\"}");
		}
		return;
		
	}
	
}
