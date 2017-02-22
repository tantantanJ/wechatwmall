package com.plusyoou.servicemis.services;

import static com.plusyoou.servicemis.utils.CommonUtils.deserializingDataStream;
import static com.plusyoou.servicemis.utils.CommonUtils.makeErrorReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.makeNoResultReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.notEmptyObject;

import static com.plusyoou.servicemis.utils.SQLUtils.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.utils.PropertiesHandler;

import flexjson.JSONSerializer;
import flexjson.transformer.DateTransformer;

/**
 * Servlet implementation class ManipulateData
 */
public class ManipulateData extends HttpServlet {
	static Logger logger = Logger.getLogger(ManipulateData.class.getName());
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public ManipulateData() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		
		String dataStream = request.getParameter("dataStream");
		
		String acceptContent = request.getHeader("Accept");
		if (acceptContent.indexOf(",")<0) {
			acceptContent="text/plain";
		} else {
			acceptContent = acceptContent.substring(0, acceptContent.indexOf(","));
		}
    	response.setContentType(acceptContent + ";charset=UTF-8");
    	
    	//初始化response写入器    	
    	PrintWriter out = response.getWriter();
    	//判断前端数据的有效性，如果数据为空，结束程序，报错。
		if (!notEmptyObject(dataStream) || dataStream.equals("undefined")){
			logger.info("前端数据为空或传输格式错误！***" + dataStream);
			out.println(makeErrorReturnString(acceptContent, "NODATA"));
			return;
		}


		HashMap[] Beans = deserializingDataStream(dataStream);
		StringBuffer operMessage = new StringBuffer();
    	
		LinkedList<String> SQLStmt = new LinkedList<String>();
		LinkedList<String> tempStmt = new LinkedList<String>();

		String insertID = "";
		String rtnPK = "";
		
		for (int i = 0; i < Beans.length; i++) {
    		if (!notEmptyObject((String)Beans[i].get("action"))) {
    			out.println(makeErrorReturnString(acceptContent, "前端参数格式错误！"));
    			return;
    		}
    		if (((String)Beans[i].get("action")).equals("update")) {
    			Beans[i].remove("action");
    			tempStmt = updateStmtGen(Beans[i], operMessage);
    		} else if(((String)Beans[i].get("action")).equals("delete")) {
    			Beans[i].remove("action");
    			Beans[i].put("referer", request.getHeader("Referer"));
    			tempStmt = deleteStemGen(Beans[i], operMessage);
    		} else if (((String)Beans[i].get("action")).equals("status")) {
    			tempStmt = changeStatusStmtGen(Beans[i], operMessage);    			    			
    		} else if (((String)Beans[i].get("action")).equals("insert") || ((String)Beans[i].get("action")).equals("replace")) {
    			String insertMode = "INSERT";
    			if (((String)Beans[i].get("action")).equals("insert")) {
    				insertMode = "INSERT";
    			} else {
    				insertMode = "REPLACE";    				
    			}
    			PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
    			String domainName = (String)Beans[i].get("domainName");
    			String tableName = ph.getProperty(domainName+"TableName");
    			if (!notEmptyObject(tableName)) {
    				logger.info("系统配置错误，没有找到对应的数据库表名配置项！");
    				out.println(makeErrorReturnString(acceptContent, "domain name [" + domainName + "]没有对应的数据表！"));
    				return;			
    			}
    			String[] domainPK = ph.getProperty(domainName +"PK").split(",");
    			boolean autoIncrease = true;
    			if ((ph.getProperty(domainName + "AI") != null) && (ph.getProperty(domainName +"AI").equalsIgnoreCase("false"))) {
    				autoIncrease = false;
    			}
    			if (!autoIncrease) {
    				String domainCat = ph.getProperty(domainName + "Category");
    				String domainCatWithDate = ph.getProperty(domainName + "CategoryWithDate");
    				HashMap[] actionBeans = deserializingDataStream((String)Beans[i].get("dataStream"));
    				JSONSerializer jsonS = new JSONSerializer().transform(new DateTransformer("yyyy-MM-dd HH:mm:ss"), Date.class);;
    				String strActionDataStream = "[";
    				if (!domainCat.equalsIgnoreCase("self")) {
    					//进入系统PK算法，限制条件：使用系统自算PK的表，只能有一个PK字段。
    					if (domainPK.length > 1 ) {
    						out.println(makeErrorReturnString(acceptContent, "数据配置错误，数据表的自算PK数量大于1！"));
    						return;
    					}
    					if (!notEmptyObject(domainCatWithDate)) {
    		    			insertID = createPlusyoouId(domainCat);    			
    		    		} else {
    		    			insertID = createPlusyoouId(domainCat, domainCatWithDate);    			    			
    		    		}
    					if (insertID.contains("错误：")) {
    						insertID = insertID.substring(insertID.indexOf("错误：") + 3);
    						out.println(makeErrorReturnString(acceptContent, insertID));
    						return;
    					}
    					rtnPK += insertID + ",";
    					for (int z = 0; z < actionBeans.length; z++) {
    						actionBeans[z].put(domainPK[0], insertID);
    						strActionDataStream = strActionDataStream + jsonS.serialize(actionBeans[z]) +",";
    					}
    				} else {
    					for (int z = 0; z < actionBeans.length; z++) {
    						int foundPK = 0;
    						String needFillPK="";
    						for (int y =0; y < domainPK.length; y++) {
    							if ( notEmptyObject(actionBeans[z].get(domainPK[y])) ) {
    								foundPK ++;
    							} else {
    								needFillPK = domainPK[y];
    							}
    						}
    						
    						if ((domainPK.length - foundPK)>1 ) {
    							logger.fatal("在前端传来的数据中，缺少对表格的PK字段的约束，中止更新！"
    									+ "***表名：" + tableName + ", 前端数据：" + dataStream);
    							out.println(makeErrorReturnString(acceptContent, "NOPK"));
    							return;    				
    						}
       						if (notEmptyObject(needFillPK)) {
       							actionBeans[z].put(needFillPK, insertID);
       						}
       						strActionDataStream = strActionDataStream + jsonS.serialize(actionBeans[z]) +",";        							
    					}
    				}
    				strActionDataStream = strActionDataStream.substring(0, strActionDataStream.length()-1);
    				strActionDataStream = strActionDataStream + "]";
    				Beans[i].put("dataStream", strActionDataStream);
    			}
    			Beans[i].remove("action");
    			tempStmt = insertStmtGen(Beans[i], operMessage, insertMode); 
    		} else {
    			out.println(makeErrorReturnString(acceptContent, "前端参数格式错误！"));
    			return;	
    		}
    		if (tempStmt!=null) {
    			SQLStmt.addAll(SQLStmt.size(), tempStmt);    				
    		} else {
    			out.println(makeErrorReturnString(acceptContent, operMessage.toString()));
    			return;
    		}
    	}
    	String updateResult = "";
    	
    	updateResult = executeSQLStmt(SQLStmt.toArray(new String[SQLStmt.size()]));
		if (updateResult == null) {
			out.println(makeErrorReturnString(acceptContent, "更新时发生系统错误，请联系管理员，检查SQL语句！"));
			return;
		}
		if (updateResult.indexOf("AIPK=") != -1) {
			rtnPK += updateResult.substring(5, updateResult.indexOf("%")) + ",";
		} else {
			rtnPK += updateResult;
		}
		if (rtnPK.length() > 0) rtnPK = rtnPK.substring(0, rtnPK.length() -1);			

		if (notEmptyObject(rtnPK)) {
			if (acceptContent.contains("plain")) {
				out.println("OK~TRUE~" + rtnPK);
			} else {
				out.println("{\"status\":\"OK\", \"hasData\":\"TRUE\", \"rows\": \"" + rtnPK + "\"}");
			}
		} else {
			out.println(makeNoResultReturnString(acceptContent));
		}		
	}
}
