/**
 * 微信服务过滤器：session处理  对前台html页面起作用，
 * 
 * 判断是否有code参数，有code进行鉴权，依据鉴权返回设置session
 *   鉴权失败：如返回错误码，判断为非微信访问，设置WeChar=0
 *   鉴权成功：设置openID，设置WeChar=1，查询数据库有无此微信信息，无则取用户信息存储
 * 判断是否新session，
 *   新session，
 *     判断是否微信浏览器，
 *       是 则sendRedirect至进行微信鉴权网址，
 *       否 则设置WeChar=0
 *   旧session，
 *     判断session中WeChar
 *       无WeChar，
 *         判断是否微信浏览器，
 *           是 则sendRedirect至进行微信鉴权网址，
 *           否 则设置WeChar=0
 *       WeChar=0，放过，
 *       WeChar=1 无openID，记录错误日志 
 * 
 */
package com.plusyoou.servicemis.filters;

import static com.plusyoou.servicemis.utils.CommonUtils.getIpAddr;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.listeners.LoginUser;
import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.SQLUtils;
import com.plusyoou.servicemis.weixin.WeiXin;

public class WinXinSession implements Filter {
	static Logger logger = Logger.getLogger(WinXinSession.class.getName());
	
	public WinXinSession() {
		logger.info("WinXinSession filter actived!");
	}

	@Override
	public void destroy() {
	
	}

	@Override
	public void doFilter(ServletRequest request, ServletResponse response,
			FilterChain chain) throws IOException, ServletException {
		//filter接口的参数，request和response不是HttpServletRequest和HttpServletResponse，而是其父类，因此
		//需要进行类型转换。
		HttpServletRequest req = (HttpServletRequest)request;
		HttpServletResponse resp = (HttpServletResponse)response;
		HttpSession session = req.getSession();
		String clientIP = getIpAddr(req);
		LoginUser loginUser = (LoginUser)session.getAttribute("LoginUser");

		//判断code参数 带code的是鉴权返回，进行后续鉴权取openID流程，流程正常完成设置openID和WeChar
		if (req.getParameter("code")!=null){
			String authUrl="https://api.weixin.qq.com/sns/oauth2/access_token?"
					+"appid=wx2a0e00e4ac6cd40d&secret=9e1e84db1c60b13dda817303cd2cfeb4"
					+"&code="+req.getParameter("code")
					+"&grant_type=authorization_code";
//logger.info("authUrl= "+authUrl);			
			String result_get = WeiXin.httpURLConectionGET(authUrl);
logger.info("鉴权结果= "+result_get);
			HashMap[] result= CommonUtils.deserializingDataStream(result_get);
			if (result==null || result.length !=1) {
				logger.error("鉴权返回结果不正确 ");
				chain.doFilter(request, response);
				return;
			}
			if(result[0].get("errcode")!=null){
				logger.error("返回鉴权错误信息，errcode= "+result[0].get("errcode")+"  code="+req.getParameter("code"));
				session.setAttribute("WeChar", "0");
				chain.doFilter(request, response);
				return;
			}
			if(result[0].get("openid")!=null){
				String openID=(String)result[0].get("openid");
				session.setAttribute("openID", result[0].get("openid"));
				session.setAttribute("WeChar", "1");
	
				String sqlStr;
				sqlStr="SELECT ID, OpenID, NickName, HeadimgURL, Unionid FROM yonghu WHERE OpenID='"+openID+"'";
				List listResults=SQLUtils.executeSelectSQL(sqlStr);
				if( listResults == null) {
					logger.info("取用户信息时发生数据库连接错误！");
					return;
				}
				if( listResults.size() > 1) {
					logger.info("取用户信息时发现重复数据！不唯一！");
				}
				if( listResults.size() == 0) {
logger.info("开始取用户信息 openID="+openID);
					//取微信access_token
logger.info("开始取access_token");					
					result_get=WeiXin.httpURLConectionGET("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx2a0e00e4ac6cd40d&secret=9e1e84db1c60b13dda817303cd2cfeb4");
logger.info("取access_token返回："+result_get);
					result= CommonUtils.deserializingDataStream(result_get);
					if (result==null || result.length !=1 ||result[0].get("errcode")!=null) {
						logger.error("取access_token返回结果不正确 ");
		    		}
					if(result[0].get("access_token")!=null){
						String access_token=(String)result[0].get("access_token");
						result_get=WeiXin.httpURLConectionGET("https://api.weixin.qq.com/cgi-bin/user/info?access_token="+access_token+"&openid="+openID+"&lang=zh_CN");
logger.info("取用户信息返回："+result_get);
						//result= CommonUtils.deserializingDataStream(result_get);
						HashMap insertMap=new HashMap();
						insertMap.put("insertMap", "system");
						insertMap.put("domainName", "yonghu");
						insertMap.put("dataStream", result_get);
						LinkedList<String> tempStmt = new LinkedList<String>();
						StringBuffer operMessage = new StringBuffer();
						tempStmt=SQLUtils.insertStmtGen(insertMap, operMessage, "INSERT");
logger.info("生成插入SQL存数据返回结果tempStmt="+tempStmt);
						String insert_result=SQLUtils.executeSQLStmt(new String[]{tempStmt.get(0)});
logger.info("存数据返回结果insert_result="+insert_result);
					}
				}
			}
			chain.doFilter(request, response);
			return;
		}

		//生成请求URL的URLEncoder，带请求参数
		StringBuffer url = new StringBuffer();
		url = req.getRequestURL();
		String queryString=req.getQueryString();
		String urlEncode;
		if(queryString!=null && !queryString.equals("")){
			urlEncode=URLEncoder.encode(url.toString()+"?"+queryString, "utf-8");
		}else{
			urlEncode=URLEncoder.encode(url.toString(), "utf-8");
		}
		
    	if (session.isNew()) {  //新session，判断是否微信浏览器，==重定向到微信鉴权网址  !=设置WeChar
    		String headUserAgent=req.getHeader("User-Agent");
    		if(headUserAgent.indexOf("MicroMessenger") > 0 || headUserAgent.toLowerCase().indexOf("micromessenger") > 0){
				logger.info("新session :" + session.getId() + " ；微信浏览器  ；重定向到微信鉴权网址，其中redirect_uri= "+urlEncode);
				resp.sendRedirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2a0e00e4ac6cd40d&redirect_uri="+urlEncode+"&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect");
				return;
    		}else{
    			session.setAttribute("WeChar", "0");
    			logger.info("新session :" + session.getId() + " ；非微信浏览器，设置WeChar");
    			chain.doFilter(request, response);
    			return;
    		}
    	} else {
    		if(session.getAttribute("WeChar")==null){
    			logger.error("旧session无WeChar设置："+session.getId());
        		String headUserAgent=req.getHeader("User-Agent");
        		if(headUserAgent.indexOf("MicroMessenger") > 0 || headUserAgent.toLowerCase().indexOf("micromessenger") > 0){
    				logger.info("旧session :" + session.getId() + " ；微信浏览器  ；重定向到微信鉴权网址，其中redirect_uri= "+urlEncode);
    				resp.sendRedirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2a0e00e4ac6cd40d&redirect_uri="+urlEncode+"&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect");
    				return;
        		}else{
        			session.setAttribute("WeChar", "0");
        			logger.info("旧session :" + session.getId() + " ；非微信浏览器，设置WeChar");
        			chain.doFilter(request, response);
        			return;
        		}
    		}
    		if (session.getAttribute("WeChar").equals("0")){
    			chain.doFilter(request, response);
    			return;
    		}
    		if (session.getAttribute("WeChar").equals("1") && session.getAttribute("openID")==null){
    			logger.error("错误 : 旧session："+session.getId()+" WeChar=1 openID=null");
				resp.sendRedirect("https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx2a0e00e4ac6cd40d&redirect_uri="+urlEncode+"&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect");
				return;
    		}
    		
			chain.doFilter(request, response);
			return;
    		
    	}

	}

	@Override
	public void init(FilterConfig arg0) throws ServletException {
	}
	
}
