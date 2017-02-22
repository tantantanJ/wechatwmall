/**
 * 登录验证服务：
 * 服务输入：从request中获取用户输入的用户工号（usercode）和密码（password）；
 * 服务输出：登录成功后记录用户信息到session的Attributes中。
 *           session中可用的Attributes有：
 *            用户名：     yongHuMing;
 *            用户工号： yongHuGongHao;
 *            用户密码：caoZuoMiMa;     -- 16位md5加密后的映像
 *            用户电话：dianHuaHaoMa;   -- 如果登记了用户内部短号，这里是短号，如果没有，这里是主要联系电话
 *            销售组织：xiaoShouDanWei; -- 如果用户属于多个销售组织，则销售组织标识之间用,分隔。与数据库中保存的内容一致，可能为null
 *            系统角色：xiTongJiaoSe;   -- 与用户数据库中保存的内容一致
 *          登录不成功，引导至非法登录提示页面。提示页面没有对不成功的原因进行区分
 *           以下情况属于非法登录：
 *            用户工号错；
 *            密码错；
 *            用户工号未找到；
 *            系统中有一个以上相同的工号；
 * 服务方式：只接受post方式过来的请求，不接受get方式过来的请求   
 * 改进方向：需在以后版本中加入，对登录终端的合法性验证
 * 
 * @author harry
 * @version 1.0 2013-11-25
 * 
 * 1.1 版本简述：
 * 引入了Log4j进行日志记录，删除原来使用的后台打印方式。
 * 日志记录全部为info级别的信息，出错时记录。
 * 特别记录：密码验证出错时，对出错密码进行明码记录，目的是判断密码尝试型破译的情况是否存在。
 * 
 * @author harry
 * @version 1.1 2013-12-26
 * 
 * 1.2 版本简述：
 * 修改了本服务自身管理connection的方法，均与其他模块统一为使用commonUtils中的公用方法。
 * 增加了对输入的用户名的非法字符检查。
 * 增加了对最近登录ip和登录时间的记录。
 * 
 * @author harry
 * @version 1.2 2014-1-24
 * 
 * 1.3版本简述
 * 修改了session中attributes的配置：
 * 	LoginUser = LoginUser的实例，代表当前的登录用户信息；
 * 	MenuItems = 当前用户权限所拥有的主菜单项。
 * 修改了密码检查的输出格式，统一到标准的ok,error输出方式。
 * 
 * @author harry
 * @version 1.3 2014-2-26
 */
package com.plusyoou.servicemis.services;

import java.io.IOException;
import java.io.PrintWriter;
import java.text.SimpleDateFormat;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.Cookie;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;

import org.apache.log4j.Logger;

import static com.plusyoou.servicemis.utils.CommonUtils.*;

import com.plusyoou.servicemis.listeners.LoginUser;
import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.PropertiesHandler;

import static com.plusyoou.servicemis.utils.SQLUtils.*;


/**
 * Servlet implementation class LoginCheck
 */
public class LoginCheck extends HttpServlet {
	static Logger logger = Logger.getLogger(LoginCheck.class.getName());
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public LoginCheck() {
        super();
        // TODO Auto-generated constructor stub
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		//系统不允许使用GET方式传递用户名和密码，因此，doGet方法不允许响应。
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	@SuppressWarnings({ "rawtypes", "unchecked" })
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		HttpSession session = request.getSession();
		String clientIP = getIpAddr(request);

		//对response进行的ContentType进行约定，本服务仅使用text格式返回结果，不是用其他格式。
		response.setContentType("text/html");
	
		String userCode = request.getParameter("userCode");
		
		//这里应该有防止传输错误的处理，例如对参数的判断，如果为空，返回错误信息。
		if (userCode == null || userCode.contains("'") || userCode.contains("\"") 
				|| userCode.contains("%") || userCode.contains("&")) {
			logger.info("客户机 '" + clientIP + "'请求验证的工号为： '" + userCode + "', 该工号不合法！");
			response.sendRedirect("exceptions/invalid.html");
			return;
		}
		
		String strSQL = "SELECT a.UserCode, a.CaoZuoMiMa, a.StoreID, b.Mingcheng AS StoreName, MiMaCuoWuCiShu "
			+ "FROM manager a "
			+ "LEFT JOIN mendian b ON a.StoreID=b.ID "
			+ "WHERE ShenXiao= TRUE AND UserCode='" + userCode +"'";
		CommonUtils sqlTool = new CommonUtils((DataSource)request.getServletContext().getAttribute("DS"));
		List listResults = executeSelectSQL(strSQL);
		
		logger.debug(strSQL);
		
		if( listResults == null) {
			logger.info("客户机 '" + clientIP + "', 登录验证时发生数据库连接错误！");
			response.sendRedirect("exceptions/error.html?errCode=02");
			return;
		}
		if( listResults.size() == 0) {
			logger.info("客户机 '" + clientIP + "', 请求验证的 '" + userCode + "' 工号不存在！");
			response.sendRedirect("exceptions/invalid.html");
			return;
		}
		if( listResults.size() > 1) {
			logger.info("客户机 '" + clientIP + "', 请求验证的 '" + userCode + "' 工号不唯一！");
			response.sendRedirect("exceptions/invalid.html");
			return;
		}
			
		HashMap result = (HashMap)listResults.get(0);
		
		//计算密码错误次数，如超过5次，则视为账号封锁，不再验证密码，直接退出。
		int miMaCuoWu;
		if (result.get("MiMaCuoWuCiShu")==null) {
			miMaCuoWu = 1;
		} else {
			miMaCuoWu = (Integer) result.get("MiMaCuoWuCiShu") + 1; 
		}
		if (miMaCuoWu > 5) {
			logger.error("客户机 '" + clientIP + "' 使用已锁定的工号  '" + userCode + "' 试图登录！");
			response.sendRedirect("exceptions/lockednotice.html");
			return;
		}
		//生成登录IP和登录时间的记录。
		String strDengLuShiJian;
		String strDengLuIP;
		SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String currentTime = dateFormatter.format(new java.util.Date());
		strDengLuShiJian = (String) result.get("ZuiJinDengLuShiJian");
		strDengLuIP = (String) result.get("ZuiJinDengLuIP");
		if (strDengLuShiJian == null || strDengLuShiJian.equals("")) {
			strDengLuShiJian = currentTime;
			strDengLuIP = clientIP;
		} else {
			String[] dengLuShiJian;
			dengLuShiJian = strDengLuShiJian.split(",");
			if (dengLuShiJian.length >= 20) {
				strDengLuShiJian = strDengLuShiJian.substring(strDengLuShiJian.indexOf(",")+1, strDengLuShiJian.length()) + "," + currentTime;
				strDengLuIP = strDengLuIP.substring(strDengLuIP.indexOf(",")+1, strDengLuIP.length()) + "," + clientIP;
			} else {
				strDengLuShiJian += "," + currentTime;
				strDengLuIP += "," + clientIP;
			}
		}
		//从request中取前端传输的密码信息；
		String password = request.getParameter("password");

		//验证密码，错误时，记录登录时间和登录IP，更新密码错误次数。
		if (  !get16BitMd5(password).equals( result.get("CaoZuoMiMa")  ) ) {
//		if (!get16BitMd5(password).equals(result.get("CaoZuoMiMa"))) {
			strSQL = "UPDATE manager SET ZuiJinDengLuShiJian = '" + strDengLuShiJian + "', ZuiJinDengLuIP = '" + strDengLuIP + 
					"', MiMaCuoWuCiShu = " + miMaCuoWu + " WHERE UserCode = '" + userCode + "'";
			String[] strSQLBatch = {strSQL};
			sqlTool.executeUpdateSQL(strSQLBatch);
			logger.info("客户机 '" + clientIP + "' (sid=" + request.getRequestedSessionId() + ") 输入的密码 --" + password + "-- 错误");
			response.sendRedirect("exceptions/invalid.html");
			return;
		};
		
		//密码正确时，记录登录时间和登录IP，并重置密码错误次数。
		strSQL = "UPDATE manager SET ZuiJinDengLuShiJian = '" + strDengLuShiJian + "', ZuiJinDengLuIP = '" + strDengLuIP + 
				"', MiMaCuoWuCiShu = 0 WHERE UserCode = '" + userCode + "'";
		String[] strSQLBatch = {strSQL};
		int updateResult = sqlTool.executeUpdateSQL(strSQLBatch);
		//更新登录记录错误时，视为登录不成功。
		if (updateResult != 1) {
			logger.info("客户机 '" + clientIP + "' (sid=" + request.getRequestedSessionId() + ") 未能成功更新登录成功信息！");
			response.sendRedirect("exceptions/error.html?errCode=03");
			return;
		}

		//记录cookie，将系统根目录信息记录到cookie中。
		Cookie[] cookies = request.getCookies();
		Boolean foundContextCookie = false;
		Boolean foundUserCodeCookie = false;
		if (cookies!=null) {
			for(int i = 0; i < cookies.length; i++) {
				if (cookies[i].getName().equals("ContextPath")) {
					cookies[i].setValue(request.getContextPath());
					foundContextCookie = true;
					break;
				}
				if (cookies[i].getName().equals("UserCode")) {
					cookies[i].setValue(userCode);
					foundUserCodeCookie = true;
					break;
				}
			} 			
		}
		if (!foundContextCookie) {
			Cookie cookieForContext = new Cookie("ContextPath", request.getContextPath());
			cookieForContext.setMaxAge(48*60*60);
			response.addCookie(cookieForContext); 
		}
		if (!foundUserCodeCookie) {
			Cookie cookieForUserCode = new Cookie("UserCode", userCode);
			cookieForUserCode.setMaxAge(-1);
			response.addCookie(cookieForUserCode); 
		}

		//验证通过，将用户相关信息记录到session的attribute中，备用。
		//如果是旧session，可能包含有原来的登录信息，首先清除可能存在的登录信息。
		if (session.getAttribute("LoginUser") != null) {
			session.removeAttribute("LoginUser");
		}
		
		LoginUser loginUser = new LoginUser();
		loginUser.setUserCode((String)result.get("UserCode"));
		loginUser.setCaoZuoMiMa((String)result.get("CaoZuoMiMa"));
		loginUser.setStoreID((int)result.get("StoreID"));
		loginUser.setStoreName((String)result.get("StoreName"));
		loginUser.setSessionID(session.getId());
		loginUser.setDengLuIP(clientIP);
		loginUser.setDengLuShiJian(currentTime);
		
		session.setAttribute("LoginUser", loginUser);

		if (password.equals("123456")) {
			response.sendRedirect("changeorgpwd.html");				
		} else {
			response.sendRedirect("admin/MenDianGuanLi.html");				
		}
		
		
		//用dispatcher方式完成的页面跳转，留在这里备用。
//			RequestDispatcher view = request.getRequestDispatcher("welcome.jsp");
//			view.forward(request, response);
	}


}
