/**
 * 获取数据库中记录的服务：
 * 
 * 版本简述：	集合了原版本中getStaticInfo, getStataicInfo, widgetsSupport三个servlet的功能。
 * 
 * 主要功能：	1）根据request中type参数确定需要启用的SQL语句生成引擎，
 * 			2）执行SQL语句引擎生成的语句，并处理查询异常
 * 			3）按request的acceptContent对结果进行编码返回
 * 			4）融合了jqGrid的多页面查询和结果处理（仅限tableInfoType枚举对象的内容）
 * 
 * 服务限制：	目前仅支持staticInfoType, tableInfoType, widgetsInfoType三个枚举对象中的查询内容。
 * 
 * 服务输入：	本服务从用户request中获取infoType信息，从request中获取page和rows信息，判断是否进行分页输出；
 * 			本服务需要读取session中的用户销售组织信息进行操作
 * 
 * 服务输出：	获取accept信息，并据此对结果数据按plain text或json进行编码输出。
 * 			异常分两种：	1）错误：返回ERROR，如果jdbc抛出异常，也归类到错误
 * 						2）无结果：返回NONE
 *          异常也按照用户的数据格式要求进行编码。
 *          异常信息可在com.plusyoou.servicemis.utils.CommonUtils类中的相关方法中进行修改。
 *          
 * @author harry
 * @version 1.0 2015-12-01
 */

package com.plusyoou.servicemis.services;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.utils.PyException;

import static com.plusyoou.servicemis.utils.CommonUtils.*;

import com.plusyoou.servicemis.utils.QueryingSQLGenerator;

import static com.plusyoou.servicemis.utils.SQLUtils.*;

/**
 * Servlet implementation class GetStaticInfo
 */
public class GetQueryResult extends HttpServlet {
	static Logger logger = Logger.getLogger(GetQueryResult.class.getName());
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GetQueryResult() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	@SuppressWarnings({ "rawtypes", "unchecked" })
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
    	request.setCharacterEncoding("UTF-8");
    	response.setCharacterEncoding("UTF-8");
    	
    	Enumeration paramss = request.getParameterNames(); 
    	while(paramss.hasMoreElements()){
    	 String paramName = (String)paramss.nextElement();
    	}

		
		//对response进行编码，防止中文乱码
		String acceptContent = acceptContentProcessing(request.getHeader("Accept"));;

		response.setContentType(acceptContent + ";charset=UTF-8");
//		初始化response写入器
		PrintWriter out = response.getWriter();

    	String engineType = request.getParameter("engine"); 
    	if (!notEmptyObject(engineType)) {
    		out.println(makeErrorReturnString(acceptContent, "查询infoType=" 
				+ request.getParameter("infoType") + "，缺少SQL引擎的类型参数，请检查程序！"));
    		return;
    	}
    	
    	List listResults;
    	String strSQL = "";
    	String strOut = "";
    	String callStmt = "";
    	String[] params = new String[0];
    	int totalPages=0;
    	int totalRecords=0;

    	QueryingSQLGenerator SQLEngine;
		try {
			SQLEngine = new QueryingSQLGenerator(request);
		} catch (PyException e) {
			logger.info(e.getMessage());
			out.println(makeErrorReturnString(acceptContent, e.getMessage()));
			return;
		}
		
		if (engineType.equalsIgnoreCase("static")) {
			
			try {
				strSQL = SQLEngine.QueryingStaticInfoSQL();
			} catch (PyException e) {
				// TODO Auto-generated catch block
	    		logger.info(e.getMessage());
	    		out.println(makeErrorReturnString(acceptContent, e.getMessage()));
				return;
			}
		} else if (engineType.equalsIgnoreCase("table")) {
			try {
				String[] backFromEngine = new String[3];
				backFromEngine = SQLEngine.QueryingTableInfoSQL();
				totalPages = Integer.parseInt(backFromEngine[0]);
				totalRecords = Integer.parseInt(backFromEngine[1]);
				strSQL = backFromEngine[2];
			} catch (PyException e) {
				// TODO Auto-generated catch block
				logger.info(e.getMessage());
				out.println(makeErrorReturnString(acceptContent, e.getMessage()));
				return;
			}
		} else if (engineType.equalsIgnoreCase("widget")) {
			try {
				strSQL = SQLEngine.QueryingWidgetsInfoSQL();
			} catch (PyException e) {
				// TODO Auto-generated catch block
				logger.info(e.getMessage());
				out.println(makeErrorReturnString(acceptContent, e.getMessage()));
				return;
			}
		} else if (engineType.equalsIgnoreCase("routine")) {
			String[] backFromEngine;
			try {
				backFromEngine = SQLEngine.QueryingRoutineInfoSQL();
			} catch (PyException e) {
				// TODO Auto-generated catch block
				logger.info(e.getMessage());
				out.println(makeErrorReturnString(acceptContent, e.getMessage()));
				return;
			}

			int sizeOfBackFromEngine = backFromEngine.length;
			if (sizeOfBackFromEngine > 0) {
				callStmt = backFromEngine[0];				
			}
			
			if (sizeOfBackFromEngine-1 > 0) {
				params = new String[sizeOfBackFromEngine -1];
				for (int i = 1; i < backFromEngine.length; i++) {
					params[i-1] = backFromEngine[i];
				}				
			}
		} else {
			out.println(makeErrorReturnString(acceptContent, "SQL引擎名称错误！--" + engineType));
			return;
		}

		if (notEmptyObject(strSQL)) {
			logger.debug(strSQL);
			listResults = executeSelectSQL(strSQL);	
			if (listResults != null && listResults.size() != 0) {
				//结果集特殊情况处理
			}
		} else if (notEmptyObject(callStmt)) {
			listResults = executeRoutineBackRecordsets(callStmt, params);
			//正常返回SP执行结果时，listResults要么为0长度，代表没有数据；要么包含的均为LinkedHashMap类型的数据
			//只有在查询异常时，listResults中包含的String类型的数据，因此这里需要判断执行是否异常，才能正确装入异常处理
			if (listResults != null && listResults.size() != 0 
					&& listResults.get(0).getClass().getName().equalsIgnoreCase("java.lang.String")) {
				String mayErrorMsg = (String)listResults.get(0);
				if (mayErrorMsg.equalsIgnoreCase("NODS")) {
					logger.error("getQueryResult类执行" + callStmt + "结果错误：没有正确获得数据库配置！");
					out.println(makeErrorReturnString(acceptContent, "不能正确连接到数据库，请通知系统管理管理员！"));
					return;					
				}
				if (mayErrorMsg.equalsIgnoreCase("ERROR")) {
					out.println(makeErrorReturnString(acceptContent, callStmt + "执行结果错误，请通知系统管理管理员！"));
					return;					
				}
			}
		} else {
			logger.info("infoType=" + request.getParameter("infoType") + "--for " + engineType + "--没有查询语句！");
			listResults = new ArrayList();
		}
		
		if (listResults == null) {
			logger.error("SQL查询异常，检查语句");
			out.println(makeErrorReturnString(acceptContent, "查询语句异常，请通知系统管理管理员！"));
			return;
		} 
		
		if( listResults.size() == 0) {
			logger.info("查询没有返回任何结果！");
			out.println(makeNoResultReturnString(acceptContent));
			return;
		}
		
		if (acceptContent.contains("plain")) {  
			strOut = serializeToPlainText(listResults);
			//暂时未决定是否需要对文本输出格式加入状态字头，目前还有没有前端页面请求类似数据。留待以后有需要在研究》
			//		-----harry 2013-12-28
			out.println(strOut);
		} else {
			strOut = serializeToJson(listResults);
			//如果是分页数据请求，则按照jqGrid的数据规范拼接页数/行数信息的json头，并附加到转换好的字符串上。
			if (totalPages!=0 && totalRecords != 0) {
				strOut = "{\"status\":\"OK\", \"hasData\":\"TRUE\",\"page\":" + request.getParameter("page") + ", \"total\":" + 
						totalPages + ", \"records\":" + totalRecords + ", \"rows\": " + strOut + "}";
			} else {
				strOut = "{\"status\":\"OK\", \"hasData\":\"TRUE\", \"rows\":" + strOut +"}";
			};
			out.println(strOut);
		}
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}	
}
