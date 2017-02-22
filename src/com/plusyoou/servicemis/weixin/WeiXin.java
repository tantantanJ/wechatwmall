package com.plusyoou.servicemis.weixin;

import static com.plusyoou.servicemis.utils.CommonUtils.getIpAddr;
import static com.plusyoou.servicemis.utils.SQLUtils.insertStmtGen;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.SQLUtils;


@SuppressWarnings("serial")
public class WeiXin extends HttpServlet {
	private static String token = "weixin";  // 自定义 token需与平台设置相同
	static Logger logger = Logger.getLogger(WeiXin.class.getName());
	
    @Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
    	this.doPost(req, resp);
	}
    
    @Override
	public void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
    	request.setCharacterEncoding("UTF-8");
    	response.setCharacterEncoding("UTF-8");
    	
    	response.setContentType("text/html");
    	PrintWriter out = response.getWriter();
    	
    	Boolean hasPara=Boolean.FALSE;
    	
    	Enumeration params = request.getParameterNames(); 
    	while(params.hasMoreElements()){
    	 String paramName = (String)params.nextElement();
    	 logger.debug("请求参数列表: "+paramName+"="+request.getParameter(paramName));
//    	 out.println("请求参数列表: "+paramName+" = "+request.getParameter(paramName) +"<BR>");
    	 hasPara=Boolean.TRUE;
    	}

//由参数判断实际业务
    	String signature = request.getParameter("signature");  // 微信加密签名
        String echostr = request.getParameter("echostr");  // 随机字符串
        String timestamp = request.getParameter("timestamp");  // 时间戳
        String nonce = request.getParameter("nonce");  // 随机数
//logger.debug("signature= "+signature+" echostr= "+echostr+" timestamp= "+timestamp+" nonce= "+nonce); 
        //依据nonce参数判断是开发者接入验证
		if (nonce!=null){  
	        if (checkSignature(signature,timestamp,nonce)) {
	            response.getWriter().print(echostr);
	        }
		}
		
		//依据code参数判断是网页鉴权验证
		//通过鉴权进入的session均加WeChar=1，表明是微信用户
		//鉴权成功加openID=取得的openID
		if (request.getParameter("code")!=null){ 
			HttpSession session = request.getSession();
			session.setAttribute("WeChar", "1");

			String authUrl="https://api.weixin.qq.com/sns/oauth2/access_token?"
						+"appid=wx2a0e00e4ac6cd40d&secret=9e1e84db1c60b13dda817303cd2cfeb4"
						+"&code="+request.getParameter("code")
						+"&grant_type=authorization_code";
//logger.info("authUrl= "+authUrl);			
			String result_get = httpURLConectionGET(authUrl);
logger.info("鉴权结果= "+result_get);

			HashMap[] result= CommonUtils.deserializingDataStream(result_get);
			if (result==null || result.length !=1) {
				logger.error("鉴权返回结果不正确 ");
    			return;
    		}
			if(result[0].get("errcode")!=null){
				logger.error("鉴权返回错误，errcode= "+result[0].get("errcode")+"  code="+request.getParameter("code"));
				out.println("错误,请返回重试");
				return;
			}
			if(result[0].get("openid")!=null){
				if (session.getAttribute("openID") != null) {
					session.removeAttribute("openID");
				}
				session.setAttribute("openID", result[0].get("openid"));

				String sqlStr;
				sqlStr="SELECT ID, OpenID, NickName, HeadimgURL, Unionid FROM yonghu WHERE OpenID='"+result[0].get("openid")+"'";
				List listResults=SQLUtils.executeSelectSQL(sqlStr);
				if( listResults == null) {
					logger.info("取用户信息时发生数据库连接错误！");
					return;
				}
				if( listResults.size() > 1) {
					logger.info("取用户信息时发现重复数据！不唯一！");
				}
				if( listResults.size() == 0) {
logger.info("开始取用户信息 openID="+result[0].get("openid"));
					String openID=(String)result[0].get("openid");
					//取微信access_token
logger.info("开始取access_token");					
					result_get=httpURLConectionGET("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx2a0e00e4ac6cd40d&secret=9e1e84db1c60b13dda817303cd2cfeb4");
logger.info("取access_token返回："+result_get);
					result= CommonUtils.deserializingDataStream(result_get);
					if (result==null || result.length !=1 ||result[0].get("errcode")!=null) {
						logger.error("取access_token返回结果不正确 ");
		    		}
					if(result[0].get("access_token")!=null){
						String access_token=(String)result[0].get("access_token");
						result_get=httpURLConectionGET("https://api.weixin.qq.com/cgi-bin/user/info?access_token="+access_token+"&openid="+openID+"&lang=zh_CN");
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
				//TODO 后续应以openID查询用户表，如无记录，取用户信息并添加用户表

			}
			response.sendRedirect("mall.html");
		}
    }

    /** 
     * 验证签名 
     *  
     * @param signature 
     * @param timestamp 
     * @param nonce 
     * @return 
     */  

    public static boolean checkSignature(String signature, String timestamp, String nonce) {  
        String[] arr = new String[] { token, timestamp, nonce };  
        // 将token、timestamp、nonce三个参数进行字典序排序  
        Arrays.sort(arr);  
        StringBuilder content = new StringBuilder();  
        for (int i = 0; i < arr.length; i++) {  
            content.append(arr[i]);  
        }  
        MessageDigest md = null;  
        String tmpStr = null;  
        try {  
            md = MessageDigest.getInstance("SHA-1");  
            // 将三个参数字符串拼接成一个字符串进行sha1加密  
            byte[] digest = md.digest(content.toString().getBytes());  
            tmpStr = byteToStr(digest);  
        } catch (NoSuchAlgorithmException e) {  
            e.printStackTrace();  
        }  
        content = null;  
        // 将sha1加密后的字符串可与signature对比，标识该请求来源于微信  
        return tmpStr != null ? tmpStr.equals(signature.toUpperCase()) : false;  
    }  

    /** 
     * 将字节数组转换为十六进制字符串 
     *  
     * @param byteArray 
     * @return 
     */  
    private static String byteToStr(byte[] byteArray) {  
        String strDigest = "";  
        for (int i = 0; i < byteArray.length; i++) {  
            strDigest += byteToHexStr(byteArray[i]);  
        }  
        return strDigest;  
    }  

    /** 
     * 将字节转换为十六进制字符串 
     *  
     * @param mByte 
     * @return 
     */  
    private static String byteToHexStr(byte mByte) {  
        char[] Digit = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' };  
        char[] tempArr = new char[2];  
        tempArr[0] = Digit[(mByte >>> 4) & 0X0F];  
        tempArr[1] = Digit[mByte & 0X0F];  
        String s = new String(tempArr);  
        return s;  
    }      

    /**
     * 接口调用 GET
     */
    public static String httpURLConectionGET(String GET_URL) {
    	StringBuilder sb = new StringBuilder();
    	try {
            URL url = new URL(GET_URL);    // 把字符串转换为URL请求地址
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();// 打开连接
            connection.connect();// 连接会话
            // 获取输入流
            BufferedReader br = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
            
            while ((line = br.readLine()) != null) {// 循环读取流
                sb.append(line);
            }
            br.close();// 关闭流
            connection.disconnect();// 断开连接
            System.out.println(sb.toString());
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("失败!");
        }
    	return sb.toString();
    }
   
    /**
     * 接口调用  POST
     */
    public static void httpURLConnectionPOST (String POST_URL,String parm ) {
        try {
            URL url = new URL(POST_URL);
           
            // 将url 以 open方法返回的urlConnection  连接强转为HttpURLConnection连接  (标识一个url所引用的远程对象连接)
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();// 此时cnnection只是为一个连接对象,待连接中
            // 设置连接输出流为true,默认false (post 请求是以流的方式隐式的传递参数)
            connection.setDoOutput(true);
            // 设置连接输入流为true
            connection.setDoInput(true);
            // 设置请求方式为post
            connection.setRequestMethod("POST");
            // post请求缓存设为false
            connection.setUseCaches(false);
            // 设置该HttpURLConnection实例是否自动执行重定向
            connection.setInstanceFollowRedirects(true);
            // 设置请求头里面的各个属性 (以下为设置内容的类型,设置为经过urlEncoded编码过的from参数)
            // application/x-javascript text/xml->xml数据 application/x-javascript->json对象 application/x-www-form-urlencoded->表单数据
            connection.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
           
            // 建立连接 (请求未开始,直到connection.getInputStream()方法调用时才发起,以上各个参数设置需在此方法之前进行)
            connection.connect();
           
            // 创建输入输出流,用于往连接里面输出携带的参数,(输出内容为?后面的内容)
            DataOutputStream dataout = new DataOutputStream(connection.getOutputStream());
            
            //此句注释掉，参数在外部生成
            //String parm = "storeId=" + URLEncoder.encode("32", "utf-8"); //URLEncoder.encode()方法  为字符串进行编码
           
            // 将参数输出到连接
            dataout.writeBytes(parm);
           
            // 输出完成后刷新并关闭流
            dataout.flush();
            dataout.close(); // 重要且易忽略步骤 (关闭流,切记!)
           
            System.out.println(connection.getResponseCode());
           
            // 连接发起请求,处理服务器响应  (从连接获取到输入流并包装为bufferedReader)
            BufferedReader bf = new BufferedReader(new InputStreamReader(connection.getInputStream()));
            String line;
            StringBuilder sb = new StringBuilder(); // 用来存储响应数据
           
            // 循环读取流,若不到结尾处
            while ((line = bf.readLine()) != null) {
                sb.append(bf.readLine());
            }
            bf.close();    // 重要且易忽略步骤 (关闭流,切记!)
            connection.disconnect(); // 销毁连接
            System.out.println(sb.toString());
   
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public String transport(String url, String message) {
    	StringBuffer sb = new StringBuffer();
    	try {
	    	URL urls = new URL(url);
	    	HttpURLConnection uc = (HttpURLConnection) urls.openConnection();
	    	uc.setRequestMethod("POST");
	    	uc.setRequestProperty("content-type","application/x-www-form-urlencoded");
	    	uc.setRequestProperty("charset", "UTF-8");
	    	uc.setDoOutput(true);
	    	uc.setDoInput(true);
	    	uc.setReadTimeout(10000);
	    	uc.setConnectTimeout(10000);
	    	OutputStream os = uc.getOutputStream();
	    	DataOutputStream dos = new DataOutputStream(os);
	    	dos.write(message.getBytes("utf-8"));
	    	dos.flush();
	    	os.close();
	    	BufferedReader in = new BufferedReader(new InputStreamReader(uc.getInputStream(), "utf-8"));
	    	String readLine = "";
	    	while ((readLine = in.readLine()) != null) {
	    		sb.append(readLine);
	    	}
	    	in.close();
    	} catch (Exception e) {
	    	logger.error(e.getMessage(), e);
    	}
    	return sb.toString();
	}    
    
}   
