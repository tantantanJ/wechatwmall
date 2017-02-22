package com.plusyoou.servicemis.utils;


import java.io.FileInputStream;
import java.io.FileNotFoundException;  
import java.io.FileOutputStream;
import java.io.IOException;  
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Enumeration;
import java.util.Properties;

import org.apache.log4j.Logger;

public class PropertiesHandler {

	private static Properties prop; 
	private String fileName;
	static Logger logger = Logger.getLogger(PropertiesHandler.class.getName());
	
	@SuppressWarnings("static-access")
	public PropertiesHandler(String path, String fileName) {
		this.prop=new Properties();

        try {            
        	InputStreamReader in = new InputStreamReader(new FileInputStream(path + fileName), "UTF-8");
        	this.fileName = path + fileName;
        	prop.load(in);
        	this.prop.load(in);
            in.close();
            if (fileName.contains("plusyoouresource")) {
            	logger.info(this.getAllProperties());
            }
        } catch (FileNotFoundException e) {
        	logger.fatal("没有找到文件'" + path + fileName + "'!");
        	e.printStackTrace();  
        } catch (IOException e) {
        	logger.fatal("读取文件'" + path + fileName + "'时发生严重错误！");
        	e.printStackTrace();  
        }
    }
	
	@SuppressWarnings("static-access")
	public PropertiesHandler(String fileName) {
		this.prop=new Properties();
		
        try {            
        	InputStreamReader in = new InputStreamReader(PropertiesHandler.class.getClassLoader().getResourceAsStream(fileName), "UTF-8");        	
        	this.fileName = fileName;
        	prop.load(in);
        	this.prop.load(in);
            in.close();
            if (fileName.contains("plusyoouresource")) {
            	logger.info(this.getAllProperties());
            }
        } catch (FileNotFoundException e) {
        	logger.fatal("classpath下没有找到文件'" + fileName + "'!");
        	e.printStackTrace();  
        } catch (IOException e) {
        	logger.fatal("classpath下读取文件'" + fileName + "'时发生严重错误！");
        	e.printStackTrace();  
        }
	}
      
    public String getProperty(String key) { 
    	return prop.getProperty(key);  
    }
    
    @SuppressWarnings("rawtypes")
	public String getAllProperties() {
    	Enumeration em = prop.keys();
    	String returnStr = "";
    	while(em.hasMoreElements()){
    		String keyStr = (String)em.nextElement();
    		returnStr += keyStr + ":" + prop.getProperty(keyStr) + "^";
    	}
    	if (returnStr != "") returnStr = returnStr.substring(0,returnStr.length()-1);
		return returnStr;
    }
      
    public void setProperty(String key,String value) throws Exception {  
    	//setProperty方法比put方法层级高，其要求的参数均必须为String，而put方法继承于hashmap，两个参数可以为object。
    	//另外，getProperty调用的也是put方法。
    	OutputStreamWriter out;
		out = new OutputStreamWriter(new FileOutputStream(this.fileName), "UTF-8");
		prop.setProperty(key, value);
		prop.store(out, null);
		out.close();


    }

    
	public static void main(String[] args) {
		PropertiesHandler ph = new PropertiesHandler("/", "plusyoouresource.properties");
		System.out.println(ph.getProperty("source.name"));
	}

}
