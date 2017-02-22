package com.plusyoou.servicemis.services;

import static com.plusyoou.servicemis.utils.CommonUtils.makeErrorReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.notEmptyObject;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.PropertiesHandler;


/**
 * Servlet implementation class GetSystemParams
 */
public class GetSystemParams extends HttpServlet {
	private static final long serialVersionUID = 1L;
	static Logger logger = Logger.getLogger(GetSystemParams.class.getName());
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public GetSystemParams() {
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
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		
    	response.setContentType("text/plain;charset=UTF-8");
    	PrintWriter out = response.getWriter();
    	String requestedInfoType = request.getParameter("infoType");
    	
    	if (!notEmptyObject(requestedInfoType)) {
    		out.println(makeErrorReturnString("text/plain","缺少参数名"));
    		return;
    	}
    	String[] infos = requestedInfoType.split(",");
    	
        PropertiesHandler config = new PropertiesHandler(CommonUtils.getAppPath() + "WEB-INF/", "systemParams.properties");
        String param;
        String strOut = "OK~TRUE~";
        if (requestedInfoType.equals("all")) {
        	strOut += config.getAllProperties();
        	out.println(strOut);
        	return;
        }
        strOut = strOut.substring(0, strOut.length()-1);
        out.println(strOut);
	}
	
	public static String getSysParameters(String parameterName){
		PropertiesHandler config = new PropertiesHandler(CommonUtils.getAppPath() + "WEB-INF/", "systemParams.properties");
		return config.getProperty(parameterName);
	}

}
