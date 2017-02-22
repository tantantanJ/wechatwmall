package com.plusyoou.servicemis.services;

import static com.plusyoou.servicemis.utils.CommonUtils.makeErrorReturnString;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.text.SimpleDateFormat;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Random;

import javax.imageio.ImageIO;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.xml.bind.DatatypeConverter;

import org.apache.log4j.Logger;
import org.apache.tomcat.util.codec.binary.Base64;

import sun.misc.BASE64Decoder;

import com.plusyoou.servicemis.listeners.LoginUser;
import com.plusyoou.servicemis.utils.CommonUtils;

public class UploadImg extends HttpServlet {
	static Logger logger = Logger.getLogger(UploadImg.class.getName());
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
	}

	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		response.setContentType("application/json");
    	PrintWriter out = response.getWriter();

//    	Enumeration params = request.getParameterNames(); 
//    	while(params.hasMoreElements()){
//    	 String paramName = (String)params.nextElement();
//    	 logger.debug("请求参数列表: "+paramName+"="+request.getParameter(paramName));
//    	 System.out.println("请求参数列表: "+paramName+"="+request.getParameter(paramName));
//    	}

    	int storeID;
    	HttpSession session = request.getSession(true);
    	if ((LoginUser)session.getAttribute("LoginUser")==null){
    		//错误处理未做简单返回
    		out.println(makeErrorReturnString("application/json","请重新登录"));
    		return;
    	}
   		
    	storeID = ((LoginUser)session.getAttribute("LoginUser")).getStoreID();
    	
logger.info("storeID="+storeID);
    	logger.info("'" + ((LoginUser)session.getAttribute("LoginUser")).getUserCode() + "' 启动文件上传模块。");
    	String imgFilePath = "upload//"+""+storeID;
		File descFolder = new File(getServletContext().getRealPath("/")+ imgFilePath);
		if (!descFolder.exists()) {
			if (!descFolder.mkdirs()) {
				logger.error("创建文件夹失败，停止服务！");
				out.println(makeErrorReturnString("application/json","创建文件夹失败，请通知系统管理员！"));
				out.close();
				return;                		
			}
		}                		

    	String imgFileName = new SimpleDateFormat("yyyyMMdd").format(new java.util.Date()) + new Random().nextInt(999999)+".png";

    	
    	String inStr=request.getParameter("image-data");
    	inStr = inStr.replace("%2B", "+");
    	inStr = inStr.replace("%26", "&");
//System.out.println(inStr);


    	byte[] imagedata = javax.xml.bind.DatatypeConverter.parseBase64Binary(inStr.substring(inStr.indexOf(",") + 1));
    	//GenerateImage(inStr.substring(inStr.indexOf(",") + 1),getServletContext().getRealPath("/")+imgFilePath+"\\"+imgFileName);
    	//decodeBase64ToImage(inStr.substring(inStr.indexOf(",") + 1),getServletContext().getRealPath("/")+imgFilePath+"\\",imgFileName);
    	BufferedImage bufferedImage = ImageIO.read(new ByteArrayInputStream(imagedata));
    	ImageIO.write(bufferedImage, "png", new File(getServletContext().getRealPath("/")+imgFilePath+"/"+imgFileName));
logger.info("创建文件="+getServletContext().getRealPath("/")+imgFilePath+"/"+imgFileName );
    	
    	
    	
    	
        response.setStatus(200);
        //前端要求参数：state=200，message为自定义信息，result：现保存存储的图片路径
		out.println("{\"state\":200,\"message\":\"OK\", \"result\":\"upload/"+storeID+"/"+imgFileName+"\"}");
        out.close();


	}

	public static boolean GenerateImage(String imgStr, String imgFilePath) {  // 对字节数组字符串进行Base64解码并生成图片  
		if (imgStr == null) // 图像数据为空  
		return false;  
		BASE64Decoder decoder = new BASE64Decoder();  
		try {  
		// Base64解码  
		byte[] bytes = decoder.decodeBuffer(imgStr);  
		for (int i = 0; i < bytes.length; ++i) {  
		if (bytes[i] < 0) {// 调整异常数据  
		bytes[i] += 256;  
		}  
		}  
		// 生成jpeg图片  
		OutputStream out = new FileOutputStream(imgFilePath);  
		out.write(bytes);  
		out.flush();  
		out.close();  
		return true;  
		} catch (Exception e) {  
		return false;  
		}  
		}  

	  public static void decodeBase64ToImage(String base64, String path,
		      String imgName) {
		    BASE64Decoder decoder = new BASE64Decoder();
		    try {
		      FileOutputStream write = new FileOutputStream(new File(path
		          + imgName));
		      byte[] decoderBytes = decoder.decodeBuffer(base64);
		      write.write(decoderBytes);
		      write.close();
		    } catch (IOException e) {
		      e.printStackTrace();
		    }
		  }
//	  public static String decode(String data) throws UnsupportedEncodingException {
//			byte[] b = Base64.decodeBase64(data.getBytes(ENCODING));
//			return new String(b, ENCODING);
//		}	
}
