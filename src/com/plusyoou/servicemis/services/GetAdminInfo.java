
/**
 * 获取管理员信息服务：
 * 
 * 
 */
package com.plusyoou.servicemis.services;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.listeners.LoginUser;
import com.plusyoou.servicemis.utils.PyException;
import com.plusyoou.servicemis.utils.QueryingSQLGenerator;

import static com.plusyoou.servicemis.utils.CommonUtils.*;
import static com.plusyoou.servicemis.utils.SQLUtils.*;


/**
 * 
 */
public class GetAdminInfo extends HttpServlet {
	static Logger logger = Logger.getLogger(GetAdminInfo.class.getName());
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GetAdminInfo() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	@SuppressWarnings("rawtypes")
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		String acceptContent = request.getHeader("Accept");
		//处理前端传来的accept=*/*的情况，禁止后台报错，并缺省设置Accept为json格式。
		if (acceptContent.indexOf(",")<0) {
			acceptContent="application/json";
		} else {
			acceptContent = acceptContent.substring(0, acceptContent.indexOf(","));
		}

    	response.setContentType(acceptContent + ";charset=UTF-8");


    	List listResults = null;
    	String strOut = "";
    	String strSQL="";
		//初始化response写入器
		PrintWriter out = response.getWriter();
    	//从session获取登录用户所属的销售组织代码，可能为null
    	HttpSession session = request.getSession(true);
    	
		if (request.getParameter("infoType").equals("我是谁")) {
			if (acceptContent.contains("plain")) {  
				strOut = "OK~TRUE~" + ((LoginUser)session.getAttribute("LoginUser")).getUserCode() 
						+ "^" + ((LoginUser)session.getAttribute("LoginUser")).getStoreID()
						+ "^" + ((LoginUser)session.getAttribute("LoginUser")).getStoreName();
				out.println(strOut);
			} else {
				strOut = "{\"status\":\"OK\", \"hasData\":\"TRUE\", \"rows\":[{\"myCode\": \"" 
						+ ((LoginUser)session.getAttribute("LoginUser")).getUserCode() + "\", \"myStore\": \"" 
						+ ((LoginUser)session.getAttribute("LoginUser")).getStoreID() 
						+ "\", \"storeName\": \"" 
						+ ((LoginUser)session.getAttribute("LoginUser")).getStoreName() +"\"}]}";
			out.println(strOut);
			}
			return;
		} else {
			try {
				QueryingSQLGenerator SQLEngine = new QueryingSQLGenerator(request);
				strSQL = SQLEngine.QueryingStaticInfoSQL();
			} catch (PyException e) {
				// TODO Auto-generated catch block
	    		logger.info(e.getMessage());
	    		out.println(makeErrorReturnString(acceptContent, e.getMessage()));
				return;
			}
		}
    	
		if (notEmptyObject(strSQL)) {
			logger.debug(strSQL);
			listResults = executeSelectSQL(strSQL);			
			if (listResults == null) {
				logger.error("SQL查询异常，检查语句");
				out.println(makeErrorReturnString(acceptContent,"查询语句异常，请通知系统管理管理员！"));
				return;
			}
			
			if(listResults.size() == 0) {
				logger.info("查询没有返回任何结果！");
				out.println(makeNoResultReturnString(acceptContent));
				return;
			}
			
			if (acceptContent.contains("plain")) {  
				strOut = serializeToPlainText(listResults);
				out.println(strOut);
			} else {
				strOut = serializeToJson(listResults);
				strOut = "{\"status\":\"OK\", \"hasData\":\"TRUE\", \"rows\": " + strOut + "}";
				out.println(strOut);
			}
//			logger.debug(strOut);
		} else {
			logger.info("没有生成查询语句！");
			out.println(makeNoResultReturnString(acceptContent));
			return;			
		}
	}

	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		doPost(request, response);
	}	
}
