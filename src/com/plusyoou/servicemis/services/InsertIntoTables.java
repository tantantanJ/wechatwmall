/**
 * 向数据库中插入新纪录的服务：
 * 服务输入：domainName  =  需要插入的记录的基本信息，以demainName作为关键字，通过查询配置文件
 * 				servicemis.properties获取com.plusyoou.servicemis.domain下的
 * 				javabean名称，数据库表名等信息。
 * 			autoIncrease  =  表的PK值是否自增，有三种取值：
 * 				true：自增方式，对应的javabean中没有主键属性，程序无需考虑主键；
 * 				false: 非自增方式，程序需通过查询配置文件，确定主键方式；
 * 					查询"domainName+Category"结果: 
 * 						self  ------表明数据自带主键值
 * 						非self------表明需要通过系统规则生成主键，且查询值为数据表中主键字段名
 * 			dataStream  =   数据流，json格式编码；
 * 			logMaker  =  true -----需要记录录入人和录入日期信息，数据库设计中需要约定：录入人字段名=LuRuRen
 * 								       录入日期字段名=LuRuRiQi
 * 						false -----无需记录录入人和录入日期信息。
 * 服务输出： 自增方式下，返回新增的主键值；
 * 			非自增方式下，如果是系统规则生成的主键，返回主键； 如果是自带主键，返回插入的记录条数。
 * 			错误值：	"ERROR"插入发生错误，通常是SQL语句出错；
 * 					"NONE"没有插入成功，可能是数据库锁定或网络传输错误;
 * 					"NO VALID DATA"前端没有传入数据。
 * 服务方式：	POST方式，不支持GET方式。
 * 服务限制：	只接受JSON数据格式的传入，使用程序前，需按照约定配置servicemis.properties文件。
 * 			允许一次插入多行。
 * 改进方向：需关注JSON解码的效率。
 * 
 * @author harry
 * @version 1.1 2013-12-17
 * 
 * 1.2版本简述：
 * 2013-12-18：与executeInsertSQL方法配合修改，将单条插入，改成批量插入。
 * 2013-12-18：增加logger日志的记录。
 * 
 * @version 1.2 2013-12-18
 * 
 * 1.3版本简述：
 * 对服务输出进行了修改，配合系统filter能够区分ajax返回和http返回的改进，进行了如下修改：
 * 
 * 服务输出： 正常插入，返回：status=OK，hasData=TRUE, id=
 * 				1)自增方式下，返回新增的主键值；
 * 				2)非自增方式下，如果是系统规则生成的主键，返回主键； 
 * 				3)如果是自带主键，不返回id， 而返回 rows=插入的记录条数。
 * 			错误值：	1）status=ERROR：插入发生错误，通常是SQL语句出错或数据库连接出错；
 * 					2）status=OK, hasData=FALSE: 没有插入行，可能是数据库锁定或网络传输错误，
 * 										但也可能是正常，例如主表插入行，但是子表没有数据的情况
 * 					3） status=NODATA：没有正确地接受前端传送的数据。
 * 前端可根据返回值进行不同的处理。
 * 
 * @author harry
 * @version 1.3 2013-12-27
 * 
 * 1.4版本简述：
 * 
 * 调整了记录录入人和录入时间的控制方式，改前端控制为通过servicemis.properties文件控制。
 * 调整了插入记录是否自增PK的控制方式，改前端控制为通过servicemis.properties文件控制。
 * 
 * @author harry
 * @version 1.4 2013-12-29	
 * 
 * 1.5版本简述：
 * 
 * 增加时记录增加人工号和时间的数据库字段配置可通过properties文件读入，如果该文件没有配置，则使用缺省的
 * LuRuRen，LuRuShiJian字段名。
 * 注意：配置文件中只能配置字段名前面的字符，程序会自动添加Ren, ShiJian字符串到配置的字符后面。
 * 
 * @author harry
 * @version 1.5 2014-1-4
 * 
 * 1.6版本简述：
 * 根据session中记录内容的调整，进行了相应的调整。由原来的session.getAttribute("YongHuMing")修改为：
 * 			(LoginUser)session.getAttribute("LoginUser").getYongHuMing() 等等
 * 
 *  @author harry
 *  @version 1.6 2014-2-20		
 */
package com.plusyoou.servicemis.services;

import com.plusyoou.servicemis.listeners.LoginUser;
import com.plusyoou.servicemis.utils.CommonUtils;

import static com.plusyoou.servicemis.utils.CommonUtils.makeErrorReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.makeNoResultReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.notEmptyObject;

import com.plusyoou.servicemis.utils.PropertiesHandler;
import static com.plusyoou.servicemis.utils.SQLUtils.createPlusyoouId;

import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.Field;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;

import org.apache.log4j.Logger;

import flexjson.JSONDeserializer;

public class InsertIntoTables extends HttpServlet {
	static Logger logger = Logger.getLogger(InsertIntoTables.class.getName());
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public InsertIntoTables() {
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

	@SuppressWarnings({ "rawtypes" })
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
		
		HttpSession session = request.getSession();
		logger.info(((LoginUser)session.getAttribute("LoginUser")).getUserCode() + "启动该模块。");
		
		String userCode = ((LoginUser)session.getAttribute("LoginUser")).getUserCode();
		String domainName = request.getParameter("domainName");
		String dataStream = request.getParameter("dataStream");
		
		SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		String currentTime = dateFormatter.format(new java.util.Date());
		
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
		if (dataStream.equals("undefined")){
			logger.info("前端数据为空或传输格式错误！****" + dataStream);
			out.println(makeErrorReturnString(acceptContent, "NODATA"));
			return;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		String domainCat = ph.getProperty(domainName + "Category");
		String domainCatWithDate = ph.getProperty(domainName + "CategoryWithDate");
		//domainName + "Log"配置现在仅用于table更改时记录日志。暂时不在新增时使用。今后需要扩展再增加
//		String logMaker = ph.getProperty(domainName+"Log");
		//2013-1-4添加：新增记录时录入录入人和录入时间的字段名配置可以由properties文件读出。如果没有配置则使用缺省字段名。 --Harry
		String makerColumnName = ph.getProperty(domainName + "Maker");
		boolean autoIncrease = true;
		if ((ph.getProperty(domainName + "AI") != null) && (ph.getProperty(domainName +"AI").equalsIgnoreCase("false"))) {
			autoIncrease = false;
		}

    	JSONDeserializer jsonD = new JSONDeserializer();
    	HashMap[] Beans = null ;
    	Object objBeans = jsonD.deserialize(dataStream);

    	if ("java.util.ArrayList".equals(objBeans.getClass().getName())) {
    		@SuppressWarnings({ "unchecked" })
			ArrayList<HashMap> newBeans=(ArrayList<HashMap>)objBeans;
        	Beans=(HashMap[]) newBeans.toArray(new HashMap[newBeans.size()]);
    	} else {
    		Beans = new HashMap[1];
    		Beans[0]=(HashMap)objBeans;
    	}
    	
    	String strSQL;
    	String[] strSQLBatch = new String[Beans.length];
    	String columnNames;
    	String values;
    	String insertID;
    	boolean returnID = true; 
    	//生成单号的语句改为静态方法后，似乎在ph的使用上发生了冲突，导致静态方法之后，ph变量不可用，因此先暂时改为将值事先读到变量中。
    	//有空再仔细研究。
    	String PKFields = ph.getProperty(domainName +"PK");
    	if (domainCat != null && domainCat.equalsIgnoreCase("self")) returnID = false;
    	if (!autoIncrease && returnID) {
    		if (!notEmptyObject(domainCatWithDate)) {
    			insertID = createPlusyoouId(domainCat);    			
    		} else {
    			insertID = createPlusyoouId(domainCat, domainCatWithDate);    			    			
    		}
			if (insertID.contains("错误：")) {
				insertID = insertID.substring(insertID.indexOf("错误：") + 3);
				out.println(makeErrorReturnString("json/application", insertID));
				return;
			}
    	} else {
    		insertID = "";
    	};

    	String insertResult = null;
    	
    	for (int i = 0; i < Beans.length; i++) {
    		strSQL = "INSERT INTO " + tableName + " (";
        	columnNames = "";
        	values = "";       	
        	
        	if (!autoIncrease && (!domainCat.equals("self"))) {
        		values += "'" + insertID + "',";
        		columnNames += PKFields +",";
        	};

        	try {
        		int c = 0;
    			Class clazz = Class.forName(className);
    			Field[] fieldNames = clazz.getDeclaredFields();
    			for (Field field: fieldNames) {
    				if (Beans[i].get(field.getName()) != null) {
    					columnNames += field.getName()+",";
    					c++;
    					if (Beans[i].get(field.getName()).equals("")) {
    						values += null + ",";
    					} else {
    						if (field.getType().equals(String.class)) {
    							values += "'" + Beans[i].get(field.getName()) + "',";
    						} else if (field.getType().equals(Date.class)) {
    							values += "'" + Beans[i].get(field.getName()) + "',";
    						} else {
    							values += Beans[i].get(field.getName()) + ",";	
    						}
    					}
    				}
    			}
    			logger.info("共找到：" + c + " 项可插入数据库的字段");
    			//仅在配置文件中定义了Maker配置时进行新增操作人的信息记录。其他情况下不记录。----Harry	2014-3-28
    			if (makerColumnName != null ) {
					columnNames += makerColumnName + "Ren, " + makerColumnName + "ShiJian,";
					values += "'" + userCode + "','" + currentTime+"',";
    			}
    			if (columnNames.length()!=0) {
    				columnNames = columnNames.substring(0, columnNames.length()-1);	
    			};
    			if (values.length()!=0) {
    				values = values.substring(0, values.length()-1);	
    			};
    			
    			strSQL += columnNames + ") VALUES (" + values + ")";			
    		} catch (ClassNotFoundException e) {
    			// TODO Auto-generated catch block
    			e.printStackTrace();
    			out.println(makeErrorReturnString(acceptContent, ""));
    		}
        	strSQLBatch[i] = strSQL;       	
    	}	
    	insertResult = (new CommonUtils((DataSource)request.getServletContext().getAttribute("DS"))).executeInsertSQL(strSQLBatch, autoIncrease);
    	//插入语句执行函数本身要进行日志记录的工作，因此这里不在记录日志。
		if (insertResult == null) {
			out.println(makeErrorReturnString(acceptContent, "插入语句语法错误, 请联系系统管理员！"));
			return;
		};
		if( Integer.parseInt(insertResult.split(",")[0]) == 0 ) {
			out.println(makeNoResultReturnString(acceptContent));
			return;
		};
		
		if (!returnID) {
			out.println("{\"status\":\"OK\", \"hasData\":\"TRUE\", \"rows\": " + insertResult + "}");
		} else if (autoIncrease) {
			out.println("{\"status\":\"OK\", \"hasData\":\"TRUE\", \"id\": \"" + insertResult + "\"}");
		} else {
			out.println("{\"status\":\"OK\", \"hasData\":\"TRUE\", \"id\": \"" + insertID + "\"}");
		}
	}
}
