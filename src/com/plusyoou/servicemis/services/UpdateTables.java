/**
 * 更新数据库中纪录的服务：
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
 * 			logMaker  =  true -----需要记录修改人和修改日期信息，数据库设计中需要约定：修改人字段名=LuRuRen
 * 								       修改日期字段名=LuRuRiQi
 * 						false -----无需记录修改人和修改日期信息。
 * 服务输出： 自增方式下，返回新增的主键值；
 * 			正常情况；返回更新的记录条数。
 * 			错误值：	"ERROR"插入发生错误，通常是SQL语句出错；
 * 					"NO PK"没有插入成功，前端没有指定需更新数据的PK值;
 * 					"NONE"没有插入成功，可能是数据库锁定或网络传输错误;
 * 					"NO VALID DATA"前端没有传入数据。
 * 服务方式：	POST方式，不支持GET方式。
 * 服务限制：	只接受JSON数据格式的传入，使用程序前，需按照约定配置servicemis.properties文件。
 * 			允许一次插入多行。
 * 改进方向：需关注JSON解码的效率。
 * 
 * @author harry
 * @version 1.0 2013-12-24
 * 
 * 1.1版本简述：
 * 对服务输出进行了修改，配合系统filter能够区分ajax返回和http返回的改进，进行了如下修改：
 * 
 * 服务输出： 正常更新，返回：status=OK，hasData=TRUE, rows=修改的记录数
 * 			错误值：	1）status=ERROR：插入发生错误，通常是SQL语句出错或数据库连接出错；
 * 					2）status=OK, hasData=FALSE: 没有修改行，可能是数据库锁定或网络传输错误，
 * 										但也可能是正常情况
 * 					3） status=NODATA：没有正确地接受前端传送的数据。
 * 					4） status=NOPK：前端语句试图进行全表更新，被禁止
 * 前端可根据返回值进行不同的处理。
 * 
 * @author harry
 * @version 1.1 2013-12-27
 * 
 * 1.2版本简述：
 * 修改更新操作记录操作人和时间的方式，从前端控制改为通过servicemis.properties文件配置；
 * 删除了调试过程中的控制台打印命令，完善了日志记录功能。
 * 
 * @author harry
 * @version 1.2 2013-12-29
 * 
 * 1.3版本简述：
 * 
 * 修改时记录修改人工号和时间的数据库字段配置可通过properties文件读入，如果该文件没有配置，则使用缺省的
 * LuRuRen，LuRuShiJian字段名。
 * 注意：配置文件中只能配置字段名前面的字符，程序会自动添加Ren, ShiJian字符串到配置的字符后面。
 * 
 * @author harry
 * @version 1.3 2014-1-9
 * 
 * 1.4版本简述：
 * 
 * 配合销售订单表的详细状态日志记录功能（由触发器完成），增加了对自动详细日志记录功能的支持。
 * 需与servicemis.properties配置文件的 **DetailLog和**DetailLogMaker配置项配合使用。
 * 
 * @author harry
 * @version 1.4 2014-1-13	
 * 
 * 1.5版本简述：
 * 
 * 更新库存单据明细时，发现对多个字段构成PK的表不能要求前端数据带有所有的PK字段。对此进行了修改，只要有一个PK字段就可以修改。
 * 将UpdataTableStatus.java的内容合并到本class中，今后需要淘汰掉 UpdateTableStatus.java类。
 * 另外：删除了对找不到WHERE表述时的报错和日志记录，因，表格的修改where字段只能来自pk字段，因此，两个错误是合二为一的。
 * 
 * @author harry
 * @version 1.5 2014-1-22	
 * 
 * 1.6版本简述
 * 根据session中记录内容的调整，进行了相应的调整。由原来的session.getAttribute("YongHuMing")修改为：
 * 			(LoginUser)session.getAttribute("LoginUser").getYongHuMing() 等等
 * 
 * @author harry
 * @version 1.6 2014-2-20
 * 
 * 1.7版本简述
 * 修改上一版本中，多条更新时sql语句拼接错误的问题。
 * 本版中修正了对表格pk字段的约束要求，要求对所有的PK字段都必须约束才允许更新。
 * 
 * @author harry
 * @version 1.7 2014-3-5
 */
package com.plusyoou.servicemis.services;

//import static com.plusyoou.servicemis.utils.CommonUtils.*;
import static com.plusyoou.servicemis.utils.CommonUtils.makeErrorReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.makeNoResultReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.makeUpdatResultReturnString;
import static com.plusyoou.servicemis.utils.CommonUtils.deserializingDataStream;
import static com.plusyoou.servicemis.utils.CommonUtils.notEmptyObject;

import com.plusyoou.servicemis.listeners.LoginUser;
import com.plusyoou.servicemis.utils.CommonUtils;
import com.plusyoou.servicemis.utils.PropertiesHandler;

import java.io.IOException;
import java.io.PrintWriter;
import java.lang.reflect.Field;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.sql.DataSource;

import org.apache.log4j.Logger;

public class UpdateTables extends HttpServlet {
	static Logger logger = Logger.getLogger(UpdateTables.class.getName());
	private static final long serialVersionUID = 1L;
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public UpdateTables() {
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
		String userName = ((LoginUser)session.getAttribute("LoginUser")).getUserCode();
		logger.info( userName + "启动该模块。");
		
		String userCode = ((LoginUser)session.getAttribute("LoginUser")).getUserCode();
		String domainName = request.getParameter("domainName");
		String dataStream = request.getParameter("dataStream");
		String revise = request.getParameter("revise");
		
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
		if (dataStream!=null && dataStream.equals("undefined")){
			logger.info("前端数据为空或传输格式错误！***" + dataStream);
			out.println(makeErrorReturnString(acceptContent, "数据传输错误！"));
			return;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		if (!notEmptyObject(tableName)) {
			logger.info("系统配置错误，没有找到对应的数据库表名配置项！");
			out.println(makeErrorReturnString(acceptContent, "数据配置错误！"));
			return;			
		}
		String[] domainPK = ph.getProperty(domainName +"PK").split(",");
		boolean logChange = false;
		if(notEmptyObject(ph.getProperty(domainName+"Log")) && ph.getProperty(domainName+"Log").equalsIgnoreCase("true")) logChange = true;
		String strLastReviser = ph.getProperty(domainName + "LastReviser");
		String[] statusField = null;
		if (notEmptyObject(ph.getProperty(domainName + "StatusField"))) {
			statusField = ph.getProperty(domainName + "StatusField").split(",");
		}
		
		HashMap[] Beans = deserializingDataStream(dataStream);
    	
    	String strSQL;
    	String strLogChange = "";
    	String strLogChangeFixedParts = "(0, '" + tableName + "', '" + userCode + "', '" + currentTime +"', ";
    	String strLogPK = "";
    	String[] strSQLBatch = new String[Beans.length];
    	String whereClause;;

    	int updateResult = -1;
    	
    	for (int i = 0; i < Beans.length; i++) {
    		strSQL = "UPDATE " + tableName + " SET ";
    		whereClause = " WHERE ";
    		if (logChange) strLogChange = "INSERT INTO shujugenggairizhi VALUES ";
    		strLogPK = "";

        	try {
        		int countOfFittedColumn = 0;
    			Class clazz = Class.forName(className);
    			Field[] fieldNames = clazz.getDeclaredFields();
    			//boolean数组的初始化值均为false，而Boolean数组的初始化为null。另如果要初始化为true，可使用Arrays.fill(PKFound, true)
    			boolean[] PKFound = new boolean[domainPK.length];
    			Arrays.fill(PKFound, false);
    			for (Field field: fieldNames) {
    				//检查dataStream中是否含有对单据状态字段的更新内容，如有，则禁止服务。
    				if (statusField != null) {
    					for (int v = 0; v < statusField.length; v++) {
    						if (Beans[i].containsKey(statusField[v])) {
    							logger.info("前端请求数据中含有状态字段的更新要求，拒绝提供服务！");
    							out.println(makeErrorReturnString(acceptContent, "服务调用错误，请通知系统管理员！"));
    							return;		
    						}    					    						
    					}
    				}
    				//检查dataStream中是否包含足够的pk字段信息，本服务仅支持以所有PK字段进行约束的数据更新。
    				for (int j =0; j < domainPK.length; j++) {
    					if (field.getName().equals(domainPK[j]) && notEmptyObject(Beans[i].get(field.getName()))) {
    						if (PKFound[j]) {
    							logger.info("前端请求数据中含有对同一pk字段'" + domainPK[j]+ "'的多个约束条件，造成了服务的理解混乱，拒绝提供服务！");
    							out.println(makeErrorReturnString(acceptContent, "服务调用错误，请通知系统管理员！"));
    							return;		    							
    						} else {
    							PKFound[j] = true;
    						}
    						whereClause += field.getName() + " = ";
    						
    						if (field.getType().equals(String.class)) {
    							whereClause += "'" + Beans[i].get(field.getName()) + "' AND ";
    						} else if (field.getType().equals(Date.class)) {
    							whereClause += "'" + Beans[i].get(field.getName()) + "' AND ";
    						} else {
    							whereClause += Beans[i].get(field.getName()) + " AND ";
    						}
    						if (logChange) {
    							strLogPK  += "'" + Beans[i].get(field.getName()) + ",";
    						}
    						Beans[i].remove(field.getName());
    					}
    				}

    				//处理需要记入数据更新日志的pk记录的字尾。
    				if (notEmptyObject(strLogPK) && !(strLogPK.substring(strLogPK.length()-1)).equals(" ")) {
    					strLogPK = strLogPK.substring(0, strLogPK.length() -1) + "', ";
    				}
    				
    				//梳理dataStream中的其他字段，拼接成SQL语句。
    				if (Beans[i].containsKey(field.getName())) {
    					strSQL += field.getName() + "=";
    					if (logChange) {
    						strLogChange += strLogChangeFixedParts + strLogPK + "'" + field.getName() + "', ";
    					}
    					countOfFittedColumn++;
    					if (Beans[i].get(field.getName()).equals("")) {
    						strSQL += null + ",";
    					} else {
    						if (field.getType().equals(String.class) || field.getType().equals(Date.class)) {
    							strSQL += "'" + Beans[i].get(field.getName()) + "',";
    						} else {
    							strSQL += Beans[i].get(field.getName()) + ",";	
    						}
    						if (logChange) {
    							strLogChange += "'" + Beans[i].get(field.getName()) + "'), ";    							
    						}
    					}
    				}
    			}
    			
    			int FoundedPKs = 0;
    			for (boolean pks: PKFound) {
    				if (pks) FoundedPKs ++;
    			}
    			if (FoundedPKs != domainPK.length) {
    				logger.fatal("在前端传来的数据中，没有对表格的所有PK字段进行约束，表格共计" + domainPK.length + "项PK字段，仅约束了" + FoundedPKs +"项，中止更新！"
    						+ "***表名：" + tableName + ", 前端数据：" + dataStream);
    				out.println(makeErrorReturnString(acceptContent, "NOPK"));
    				return;    				
    			}

    			if (countOfFittedColumn==0) {
					logger.fatal("在前端传来的数据中，除PK字段外没有发现需要更新的内容。服务结束！");
					out.println(makeErrorReturnString(acceptContent, "没有需要更新的内容"));
					return;
    			}
    			
    			logger.info("共找到：" + countOfFittedColumn + " 项需进行修改的字段");
				//根据配置，记录最后修改人和修改时间。
    			//销售订单有触发器，可以记录不能在状态修改人栏中的记录的状态改变情况。	--- Harry 2014-1-13
    			if (!notEmptyObject(revise) || !revise.equalsIgnoreCase("false")) {
    				if (notEmptyObject(strLastReviser)) {
    					strSQL += strLastReviser + "Ren='" + userCode + "'," + strLastReviser + "ShiJian='" + currentTime +"',";
    				}    				
    			}
    			
				strSQL = strSQL.substring(0, strSQL.length()-1);				
				whereClause = whereClause.substring(0, whereClause.length()-5);
    			strSQL += whereClause;
    			if (logChange) strLogChange = strLogChange.substring(0, strLogChange.length() - 2);
    		} catch (ClassNotFoundException e) {
    			// TODO Auto-generated catch block
    			e.printStackTrace();
    		}
        	strSQLBatch[i] = strSQL;
			
        	if (notEmptyObject(strLogChange)) {
        		updateResult = (new CommonUtils((DataSource)request.getServletContext().getAttribute("DS"))).executeUpdateSQL(new String[]{strLogChange});        		
        	}
    	}
    			
    	updateResult = (new CommonUtils((DataSource)request.getServletContext().getAttribute("DS"))).executeUpdateSQL(strSQLBatch);
    	
		if (updateResult == -1) {
			out.println(makeErrorReturnString(acceptContent, "更新数据的SQL语句错误，请通知系统管理员！"));
			return;
		}
		
		if( updateResult == 0 ) {
			out.println(makeNoResultReturnString(acceptContent));
			return;
		}
		out.println(makeUpdatResultReturnString(acceptContent, updateResult));
	}
}
