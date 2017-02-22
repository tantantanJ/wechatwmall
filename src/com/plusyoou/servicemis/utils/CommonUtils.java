package com.plusyoou.servicemis.utils;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Properties;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.sql.DataSource;

import org.apache.log4j.Logger;

import com.plusyoou.servicemis.utils.PropertiesHandler;

import static com.plusyoou.servicemis.utils.SQLUtils.*;
import flexjson.JSONDeserializer;
import flexjson.JSONSerializer;
import flexjson.transformer.DateTransformer;

/**
 * 公用方法集
 *
 */
public class CommonUtils {
	private final DataSource ds;
	static Logger logger = Logger.getLogger(CommonUtils.class.getName());
	
	
	public CommonUtils(DataSource ds) {
		super();
		this.ds = ds;
	}

	public static String get16BitMd5(String s) {

		char hexChar[] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
				'a', 'b', 'c', 'd', 'e', 'f' };
		// md5加密算法的加密对象为字符数组，这里是为了得到加密的对象
		byte[] b = s.getBytes();
		try {
			MessageDigest md = MessageDigest.getInstance("MD5");
			md.update(b);
			byte[] b2 = md.digest();// 进行加密并返回字符数组
			char str[] = new char[b2.length << 1];
			int len = 0;
			// 将字符数组转换成十六进制串，形成最终的密文
			for (int i = 0; i < b2.length; i++) {
				byte val = b2[i];
				str[len++] = hexChar[(val >>> 4) & 0xf];
				str[len++] = hexChar[val & 0xf];
			}
			return new String(str);
		} catch (NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return null;
	}

	public static String get32BitMD5(String str) {
		try {
			MessageDigest md = MessageDigest.getInstance("MD5");
			md.update(str.getBytes());
			byte[] byteDigest = md.digest();
			int i;
			StringBuffer buf = new StringBuffer("");
			for (int offset = 0; offset < byteDigest.length; offset++) {
				i = byteDigest[offset];
				if (i < 0)
					i += 256;
				if (i < 16)
					buf.append("0");
				buf.append(Integer.toHexString(i));
			}
			// 32位加密
			// return buf.toString();
			// 16位的加密
			return buf.toString().substring(8, 24);
		} catch (NoSuchAlgorithmException e) {
			e.printStackTrace();
			return null;
		}

	}
	
	public static boolean notEmptyObject (Object obj) {
		if (obj == null) return false;
		if (obj instanceof String) {
			if (((String) obj).isEmpty()) {
				return false;
			} else if (((String) obj).equalsIgnoreCase("undefined")) {
				return false;
			} else if (((String) obj).equalsIgnoreCase("null")){
				return false;
			}
		}
		return true;
	}
/*******************************************************************************************
 * 执行查询sql语句，并对结果进行转换，以LIST格式返回的方法。
 * 
 * 输入参数：	strSQL = 以字符串形式传递的查询SQL语句；
 * 输出：	List<LinkedHashMap> 格式的查询结果
 * 			异常：返回 null；	
 * 简要描述：	对输入的SQL语句进行了日志记录。
 * 			采用读取配置文件方式取得数据库连接字符串
 * 
 * @author: Harry
 * @version: 1.1  2013/12/23
 ******************************************************************************************/
	
//	@SuppressWarnings({ "rawtypes", "unchecked" })
//	public List executeSelectSQL(String strSQL) {
//
////		Context iniCTX;
////		Context context;
////		PropertiesHandler ph = new PropertiesHandler("/");
////		String sourceName = ph.getProperty("source.name");
//		
//		Connection conn = null;
//		Statement stmt = null;
//		ResultSet rs = null;
//
//		if (this.ds == null) return null;
//		try {
//			// 通过jndi获取在web服务器中注册的数据库连接池
////			iniCTX = new InitialContext();
////			context = (Context) iniCTX.lookup("java:comp/env");
////			DataSource ds = (DataSource) context.lookup(sourceName);
//			// 建立数据库连接
//			conn = ds.getConnection();
//			stmt = conn.createStatement();
//
//			// 执行sql语句
//			rs = stmt.executeQuery(strSQL);
//
//			// 获取resultset的元数据信息
//			ResultSetMetaData md = rs.getMetaData();
//			// 获取返回结果的列数
//			int columns = md.getColumnCount();
//
//			// 最早版本使用这个方式获取，rs总行数，再声明相应size的ArrayList。
//			// 现改为动态决定ArrayList的长度。
//			// rs.last();
//			// int rows = rs.getRow();
//
//			ArrayList listResults = new ArrayList();
//
//			rs.beforeFirst();
//			while (rs.next()) {
//				// 程序的最早版本是使用
//				// HashMap存储，但是HashMap天生的put和get的顺序不一致，造成取值时控制不了需要的列顺序。
//				// 控制列顺序在项目自定义的plain数据格式中，是必须的。因此改用LinkedHashMap解决这个问题，但是一定牺牲了性能
//				// 如果输出是json格式，就不需要严格的列顺序了，由此也看出了json的好处。
//				// 如果今后服务端的效率需要优化，这个是一个可以考虑的点，可弃用项目自定义的plain数据格式，改为json。
//				// 2013-12-1 ----Harry
//				LinkedHashMap row = new LinkedHashMap(columns);
//				for (int i = 1; i <= columns; ++i) {
//					// getColumnName取出的是表格中的字段名，本项目中是驼峰方式的字段名
//					// row.put(md.getColumnName(i),rs.getObject(i));
//					// getColumnLable取出的是 sql语句中字段名后面 as 部分的名字；
//					row.put(md.getColumnLabel(i), rs.getObject(i));
//				};
//				listResults.add(row);
//			};
//
////			// 关闭数据库连接，交出缓冲池
////			rs.close();
////			conn.close();
//
//			// 正常返回结果
//			return listResults;
//		} catch (Exception e) {
//			e.printStackTrace();
//			return null;
//		} finally {
//			if (rs != null)	try {rs.close();} catch (Exception ignore) {}
//			if (stmt != null) try {stmt.close();} catch (Exception ignore) {}
//			if (conn != null) try {conn.close();} catch (Exception ignore) {}
//		}
//	}

/*******************************************************************************************
 * 批量插入新记录的方法。
 * 输入参数：	strSQLBatch = 以字符数组形式传递的批量插入SQL语句；
 * 			strAutoIncrease = 是否自增pk的布尔量。
 * 输出：	自增时：输出新增记录的自增量；
 * 			非自增时：输出插入的记录数；
 * 			异常：输出-1；	
 * 简要描述：	采用事务处理形式，批量中的SQL语句一次统一提交，如有问题，回滚。保证数据的完整性。
 * 			对插入过程进行了日志记录。
 * 			采用读取配置文件方式取得数据库连接字符串
 * 
 * @author: Harry
 * @version: 1.1  2013/12/23
 * 
 * 1.2版本简述：
 * 方法的return值由int修改为String:
 * 		当autoIncrease=true时，返回的是所有新增行的自增pk，以","分隔。
 * 		当autoIncrease=false时，返回的是插入记录的行数。
 * 		异常时：输出为null。
 * 更改了数据连接建立的方式，取全局变量ds完成后续的数据库访问。
 * 
 * @author harry
 * @version 1.2 2014-3-12
 * 
 ******************************************************************************************/
	public String executeInsertSQL(String[] strSQLBatch, boolean autoIncrease) {

		Connection conn = null;
		Statement stmt = null;
		
		try {
			// 建立数据库连接
			conn = ds.getConnection();
			stmt = conn.createStatement();
			
			for (int i = 0; i < strSQLBatch.length; i++) {
				stmt.addBatch(strSQLBatch[i]);
				logger.debug(strSQLBatch[i]);
			}
			
			int[] batchResult =null;
			// 执行sql语句
			try {
				conn.setAutoCommit(false);
//				stmt.execute("START TRANSACTION");
				batchResult = stmt.executeBatch();
//				stmt.execute("COMMIT");
				try {
					conn.commit();
				} catch (Exception SQLException) {
					conn.rollback();
					logger.error("批量提交插入语句时错误：" + SQLException.getMessage());
					conn.setAutoCommit(true);
					if (!stmt.isClosed()) {stmt.close();};
					if (!conn.isClosed()) {conn.close();};
					return null;
				};
			} catch (Exception SQLException) {
				logger.error("SQL语句错误：" + SQLException.getMessage());
				conn.setAutoCommit(true);
				if (!stmt.isClosed()) {stmt.close();};
				if (!conn.isClosed()) {conn.close();};
				return null;				
			};
			conn.setAutoCommit(true);
			for (int i =0; i < batchResult.length; i++) {
				if (batchResult[i] !=1) {
					logger.error("第" + (i+1) + "条插入语句执行结果错误：" + batchResult[i]);
					conn.rollback();
					conn.setAutoCommit(true);
					stmt.close();
					conn.close();
					return null;
				}
			};
			int intAffectedRows = batchResult.length;
			String returnStr = "";
			logger.info("本次共插入" + intAffectedRows + "条记录");
			if (autoIncrease && intAffectedRows > 0) {
//				ResultSet rs = stmt.executeQuery("SELECT LAST_INSERT_ID()");
				//jdbc3.0支持getGeneratedKeys方法。
				ResultSet rs = stmt.getGeneratedKeys();
				rs.beforeFirst();
				while (rs.next()) {
					returnStr += String.valueOf(rs.getInt(1)) + ",";
				}
				//处理返回字符串的尾部。
				if (!returnStr.equals("")) returnStr = returnStr.substring(0,returnStr.length()-1);
//				intAffectedRows = rs.getInt(intAffectedRows);	
			} else {
				returnStr = String.valueOf(intAffectedRows);
			};
			// 正常返回结果
			return returnStr;
		}
		catch (Exception e) {
			e.printStackTrace();
			return null;
		} finally {
			if (stmt != null) try {stmt.close();} catch (Exception ignore) {}
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}
	}
	
/*******************************************************************************************
 * 批量更新记录的方法。
 * 输入参数：	strSQLBatch = 以字符数组形式传递的批量更新SQL语句；
 * 输出：	正常：输出插入的记录数；
 * 			异常：输出-1；	
 * 简要描述：	采用事务处理形式，批量中的SQL语句一次统一提交，如有问题，回滚。保证数据的完整性。
 * 			对更新过程进行了日志记录。
 * 			采用读取配置文件方式取得数据库连接字符串
 * 
 * @author: Harry
 * @version: 1.1  2013/12/24
 * 
 * 1.2 版本简述：
 * 修改原版本中，只允许一条语句更新一条记录的做法；允许一次更新多条语句。
 * 当更新结果为0或EXECUTE_FAILED时才进行错误记录和事务回退。
 * 
 * @author: Harry
 * @version: 1.2  2014/1/22
 *******************************************************************************************/
	@SuppressWarnings("static-access")
	public int executeUpdateSQL(String[] strSQLBatch) {

//		Context iniCTX;
//		Context context;
//		PropertiesHandler ph = new PropertiesHandler("/");
//		String sourceName = ph.getProperty("source.name");
		Connection conn = null;
		Statement stmt = null;
		
		try {
			// 通过jndi获取在web服务器中注册的数据库连接池
//			iniCTX = new InitialContext();
//			context = (Context) iniCTX.lookup("java:comp/env");
//			DataSource ds = (DataSource) context.lookup(sourceName);
			// 建立数据库连接
			conn = ds.getConnection();
			stmt = conn.createStatement();
			
			for (int i = 0; i < strSQLBatch.length; i++) {
				stmt.addBatch(strSQLBatch[i]);
				logger.debug(strSQLBatch[i]);
			}
			
			int[] batchResult =null;
			// 执行sql语句
			try {
				conn.setAutoCommit(false);
//					stmt.execute("START TRANSACTION");
				batchResult = stmt.executeBatch();
//					stmt.execute("COMMIT");
				try {
					conn.commit();
				} catch (Exception SQLException) {
					conn.rollback();
					logger.error("批量提交更新语句时错误：" + SQLException.getMessage());
					conn.setAutoCommit(true);
					if (!stmt.isClosed()) {stmt.close();};
					if (!conn.isClosed()) {conn.close();};
					return -1;
				};
			} catch (Exception SQLException) {
				logger.error("SQL语句错误：" + SQLException.getMessage());
				conn.setAutoCommit(true);
				if (!stmt.isClosed()) {stmt.close();};
				if (!conn.isClosed()) {conn.close();};
				return -1;				
			};
			conn.setAutoCommit(true);
			int intAffectedRows = 0;
			for (int i =0; i < batchResult.length; i++) {
				if (batchResult[i] == stmt.EXECUTE_FAILED && batchResult[i]==0) {
					logger.error("第" + (i+1) + "条更新语句执行结果错误：" + batchResult[i]);
					conn.rollback();
//						conn.setAutoCommit(false);
					stmt.close();
					conn.close();
					return -1;
				}
				intAffectedRows += batchResult[i];
			};
			logger.info("本次共更新" + intAffectedRows + "条记录");
			// 正常返回结果
			return intAffectedRows;
		}
		catch (Exception e) {
			e.printStackTrace();
			return -1;
		} finally {
			if (stmt != null) try {stmt.close();} catch (Exception ignore) {}
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}
	}

/*******************************************************************************************
 * 删除记录的方法。
 * 输入参数：	strSQL = 以字符形式传递的删除SQL语句；
 * 输出：	正常：输出删除的记录数，包括没有记录被删除；
 * 			异常：输出-1；	
 * 简要描述：	对更新过程进行了日志记录。
 * 			采用读取配置文件方式取得数据库连接字符串
 * 
 * @author: Harry
 * @version: 1.0  2013/12/29
 *******************************************************************************************/
	public int executeDeleteSQL(String strSQL) {
		
//		Context iniCTX;
//		Context context;
//		PropertiesHandler ph = new PropertiesHandler("/");
//		String sourceName = ph.getProperty("source.name");
		Connection conn = null;
		Statement stmt = null;
		
		try {
			// 通过jndi获取在web服务器中注册的数据库连接池
//			iniCTX = new InitialContext();
//			context = (Context) iniCTX.lookup("java:comp/env");
//			DataSource ds = (DataSource) context.lookup(sourceName);
			// 建立数据库连接
			conn = ds.getConnection();
			stmt = conn.createStatement();

			if (!stmt.execute(strSQL)) {
				logger.debug("语句'" + strSQL +"'共删除了" + stmt.getUpdateCount() + "条记录！");
				return stmt.getUpdateCount();
			};
			logger.fatal("异常！！语句'" + strSQL +"'执行结果的返回值为true！");
			return -1;
		}
		catch (Exception e) {
			e.printStackTrace();
			logger.fatal("异常！！语句'" + strSQL +"'执行后抛出错误信息！", e);
			return -1;
		} finally {
			if (stmt != null) try {stmt.close();} catch (Exception ignore) {}
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}
	}

/********************************************************************************************
 * 功能：	读取软件配置参数
 * 
 * 输入：	参数名称，字符型
 * 输出：	参数的取值。
 * 异常：	无
 *
 * @author harry
 * @version 1.0 2015-04-06
 * 
 ********************************************************************************************/
	public static String getSystemParameter(String paraName){		
		if (notEmptyObject(paraName)) {
			PropertiesHandler config = new PropertiesHandler(CommonUtils.getAppPath() + "WEB-INF/", "systemParams.properties");
			return config.getProperty(paraName);			
		} else {
			return null;
		}
	}

/********************************************************************************************
 * 功能：	统一处理返回的格式类型
 * 
 * 输入：	参数名称，字符型
 * 输出：	处理后的返回格式 。
 * 异常：	无
 *
 * @author harry
 * @version 1.0 2015-12-01
 * 
 ********************************************************************************************/
	public static String acceptContentProcessing(String acceptContent){		
		if (acceptContent.indexOf(",")<0) {
			 return "application/json";
		} else {
			return acceptContent.substring(0, acceptContent.indexOf(","));
		}
	}
	
/********************************************************************************************
 * 功能：	格式化查询结果到系统自定义的plain/text格式
 * 
 * 输入：	与本类中，executeSelectSQL方法输出格式配套的LIST类型的查询结果
 * 输出：	符合本系统规范的文本格式的字符串。
 * 异常：	无
 * 格式规范："	第1行第1列,第1行第2列,......第1行最后列; 
 * 				第2行第1列,第2行第2列,......第2行最后列;
 * 				......
 * 				最末行第1列,最末行第2列,......最末行最后列"
 * 其他：	使用了多态技术，row声明成HashMap，但executeSelectSQL方法返回的是其子类LinkedHashMap。
 * 			可能存在的一个故障点：取出服务的返回值时，必须做casting，转为 HashMap，不知是否丢失了插入时的列顺序，
 *			就目前的测试来看，还没有出现，但是，今后是否会出现，还需要留意。	---2013/12/1 Harry
 *
 * @author harry
 * @version 1.0 2013-12-24
 * 
 * 1.1版本简述
 * 1）	编码分隔符由","";"改变为"^""~"；
 * 2）	增加了输入参数的null值判断，扩展程序的适应性。
 * 		null值的引入用于密码正确性判断时，直接输出结果，没有查询结果可转化。
 * 3）	格式规范中增加了如下约定：
 * 		如果数据部分为""，空字符串，表明操作结果正确，但没有返回数据。
 * 
 * @author harry
 * @version 1.1 2014-2-26
 * 
 *  * 1.2版本简述
 * 1）	增加可变参数strSeparator, 如传入该参数，则行间隔、字符间隔不适用缺省的"~"和"^"
 * 		限制：该参数的传入顺序：字串头，行间隔，字符间隔。顺序不能改变
 * 
 * @author harry
 * @version 1.2 2014-12-18
 * 
 ********************************************************************************************/
	@SuppressWarnings("rawtypes")
	public static String serializeToPlainText(List list, String... strSeparator) {
		HashMap row;
		Set rowName;
		boolean hasSeparator = false;
		if (strSeparator.length > 1) hasSeparator = true;
		String strOut = "OK~TRUE~";
		if (hasSeparator && strSeparator[0] != null) strOut = strSeparator[0];
		if (list != null) {
			for (int i=0; i < list.size(); i++) {
				row = (HashMap) list.get(i);
				rowName = row.keySet();
				Iterator it = rowName.iterator();
				while (it.hasNext()) {
					if (hasSeparator && strSeparator[2] != null) {
						strOut += row.get(it.next()) + strSeparator[2];						
					} else {
						strOut += row.get(it.next()) + "^";
					}
				}
				if (hasSeparator && strSeparator[1] != null) {
					strOut = strOut.substring(0, strOut.length()-1) + strSeparator[1];										
				} else {
					strOut = strOut.substring(0, strOut.length()-1) + "~";					
				}
			}
			strOut = strOut.substring(0, strOut.length()-1);			
		} else {
			strOut += "";
		}
		return strOut;
	}
	
/********************************************************************************************
 * 功能：	格式化查询结果到标准的json格式
 * 
 * 输入：	与本类中，executeSelectSQL方法输出格式配套的LIST类型的查询结果
 * 输出：	符合规范的json格式的字符串。
 * 异常：	无
 * 格式规范：	标准json
 * 其他：	使用了多态技术，row声明成HashMap，但executeSelectSQL方法返回的是其子类LinkedHashMap。
 * 			可能存在的一个故障点：取出服务的返回值时，必须做casting，转为 HashMap，不知是否丢失了插入时的列顺序，
 *			就目前的测试来看，还没有出现，但是，今后是否会出现，还需要留意。	---2013/12/1 Harry
 *			序列化时使用了flexJson的transform类，避免在缺省情况下，日期时间字段被格式化成"毫秒u"。
 *																	---2013/12/23 Harry
 *
 * @author harry
 * @version 1.0 2013-12-24
 ********************************************************************************************/
	@SuppressWarnings("rawtypes")
	public static String serializeToJson(List list) {
    	JSONSerializer jsonS = new JSONSerializer().transform(new DateTransformer("yyyy-MM-dd HH:mm:ss"), Date.class);
//    	JSONSerializer jsonS = new JSONSerializer();
    	HashMap row;
		String strOut = "[";
		for (int i=0; i < list.size(); i++) {
			row = (HashMap)list.get(i);
			strOut = strOut + jsonS.serialize(row) +",";
		}
		strOut = strOut.substring(0, strOut.length()-1);
		strOut = strOut + "]";
		return strOut;
	}
	
/********************************************************************************************
 * 功能：	根据要求的格式，将查询无结果时需要反馈前端的字符串，进行编码。
 * 			支持格式： plaintext, json
 * 			支持自定义输出文字内容
 * 			缺省输出NONE
 * 
 * 输入：	acceptType:	String, 要求的编码格式。如果参数中含 "plain"字串，则进行文本编码，不含则进行json编码。
 * 			strMessage：String， 自定义的输出内容。如果为空字符串，则输出缺省内容"NONE".
 * 输出：	符合参数要求的字符串。
 * 异常：	无
 * 格式规范：	文本或json
 * 其他：	无
 * 
 * @author harry
 * @version 1.0 2013-12-25
 * 
 * 1.1 版本简述
 * 删除了第二参数strMessage，如果需要自定义内容的输出，都统一使用makeErrorReturnString方法。
 * 
 * @author harry
 * @version 1.1 2014-1-25
 * 
 * 1.2版本简述：
 * 1）	文本输出时，编码分隔符由","";"改变为"^""~"；
 * 
 * @author harry
 * @version 1.2 2014-2-20
 ********************************************************************************************/	
	public static String makeNoResultReturnString(String acceptType){
		if (acceptType.contains("plain")) {
			return "OK~FALSE";
		} else {
			return "{\"status\":\"OK\", \"hasData\":\"FALSE\"}";
		}	
	};

/********************************************************************************************
 * 功能：	根据要求的格式，将更新表格后，影响的记录数，进行编码。
 * 			支持格式： plaintext, json
 * 
 * 输入：	acceptType:	String, 要求的编码格式。如果参数中含 "plain"字串，则进行文本编码，不含则进行json编码。
 * 			updatedRows：Integer， 更新的记录行数。
 * 输出：	符合参数要求的字符串。
 * 异常：	无
 * 格式规范：	文本或json
 * 其他：	无
 * 
 * @author harry
 * @version 1.0 2014-1-25
 * 
 * 1.1版本简述：
 * 1）	文本输出时，编码分隔符由","";"改变为"^""~"；
 * 
 * @author harry
 * @version 1.1 2014-2-20
 ********************************************************************************************/
	public static String makeUpdatResultReturnString(String acceptType, int updatedRows){
		if (acceptType.contains("plain")) {
			return "OK~TRUE~" + updatedRows;
		} else {
			return "{\"status\":\"OK\", \"hasData\":\"TRUE\", \"rows\": " + updatedRows + "}";
		}	
	};

/********************************************************************************************
 * 功能：	根据要求的格式，将查询错误时需要反馈前端的字符串，进行编码。
 * 			支持格式： plaintext, json
 * 			支持自定义输出文字内容
 * 			缺省输出ERROR
 * 
 * 输入：	acceptType:	String, 要求的编码格式。如果参数中含 "plain"字串，则进行文本编码，不含则进行json编码。
 * 			strMessage：String， 自定义的输出内容。如果为空字符串，则输出缺省内容"ERROR".
 * 输出：	符合参数要求的字符串。
 * 异常：	无
 * 格式规范：	文本或json
 * 其他：	无
 * 
 * @author harry
 * @version 1.0 2013-12-25
 * 
 * 1.1版本简述：
 * 1）	文本输出时，编码分隔符由","";"改变为"^""~"；
 * 
 * @author harry
 * @version 1.1 2014-2-20
 * 
 * 1.2版简述：
 * 1）增加了对relogin错误的特殊处理，直接将relogin作为回传数据的状态进行编码。
 * 
 * @author harry
 * @version 1.2 2014-4-25
 ********************************************************************************************/	
	public static String makeErrorReturnString(String acceptType, String strMessage){
		if (strMessage==null || strMessage.equals("")) {
			if (acceptType.contains("plain")) {
				return "ERROR";
			} else {
				return "{\"status\":\"ERROR\"}";
			}	
		} else if (strMessage.equalsIgnoreCase("relogin")) {
			if (acceptType.contains("plain")) {
				return "RELOGIN";
			} else {
				return "{\"status\":\"RELOGIN\"}";
			}				
		} else if (acceptType.contains("plain")) {
			return "ERROR~" + strMessage + "~";
		} else {
			return "{\"status\":\"ERROR\", \"message\":\"" + strMessage +"\"}";
		}
	};
	
/********************************************************************************************
 * 功能：	根据登录用户所属的SU（销售组织），拼接用于sql语句的销售组织权限限制字符串
 * 
 * 输入：	strBelongedSU:	String Array, 用户所在的SU标识组成的数组。
 * 			strColumnName：String， 在对应的表中 销售组织标识关联的字段的名字
 * 输出：	1）空字符，当两个参数中有一个为空时，输出空字符。
 * 			2）以" AND "开头的符合sql语句where 部分要求的字符串，尾部已处理干净，除whitespace外无其他多余字符
 * 异常：	无
 * 其他：	无
 * 
 * @author harry
 * @version 1.0 2013-12-25
 * 
 * 1.1 版本简述：
 * 1) 函数名称由makeWhereClauseAboutSaleUnit 更改为 makeWhereClauseWithInStatement
 * 2) 函数的使用也由销售组织的限制语句生成扩展到仓库和品牌的限制。
 * 3) 变量strBlongedSU 更名为 strBelongedCriterias
 * 
 * 
 * @author harry
 * @version 1.1 2014-08-20
 ********************************************************************************************/	
	public static String makeWhereClauseWithInStatement(String[] strBelongedCriterias, String strColumnName) {
		String strWhere = "";
		if (strBelongedCriterias.length !=0 && !strColumnName.equals("")) {
			if (strBelongedCriterias.length ==1) {
				//如果用户只属于一个销售组织，用=进行sql限制
				strWhere += " AND " + strColumnName + " = '" + strBelongedCriterias[0] + "'"; 
			} else {
				//如果用户属于多个销售组织，用in进行sql限制
				strWhere += " AND " + strColumnName + " IN (";  
				for (int i=0; i < strBelongedCriterias.length ; i++) {
					strWhere += "'" + strBelongedCriterias[i] + "', ";
				}
				//处理sql语句的结尾。
				strWhere = strWhere.substring(0, strWhere.length()-2) + ")";
			}
		}
		return strWhere;
	}
//	@SuppressWarnings("rawtypes")
//	public static String makeWhereClauseWithInStatement(List strBelongedCriterias, String strColumnName) {
//		String strWhere = "";
//		if (strBelongedCriterias.size() !=0 && !strColumnName.equals("")) {
//			if (strBelongedCriterias.size() ==1) {
//				//如果用户只属于一个销售组织，用=进行sql限制
//				strWhere += " AND " + strColumnName + " = '" + strBelongedCriterias.get(0) + "'"; 
//			} else {
//				//如果用户属于多个销售组织，用in进行sql限制
//				strWhere += " AND " + strColumnName + " IN (";  
//				for (int i=0; i < strBelongedCriterias.size() ; i++) {
//					strWhere += "'" + strBelongedCriterias.get(i) + "', ";
//				}
//				//处理sql语句的结尾。
//				strWhere = strWhere.substring(0, strWhere.length()-2) + ")";
//			}
//		}
//		return strWhere;
//	}

	/*
	 * 取Web应用根目录的实际文件路径
	 * 返回应用在服务器上的实际路径，c:/.../.../
	 * 调用时用此路径加目录文件名可调用资源文件
	 * 如:
	 * FileInputStream input = new FileInputStream(CommonUtils.getAppPath()+ "resource/dingdan_print.properties");
	 * 现订单打印使用该方法取图片和配置文件。
	*/	
	public static String getAppPath() {
        String configs = Thread.currentThread().getContextClassLoader().getResource("").toString();
        configs = configs.substring(0, configs.indexOf("WEB-INF")  );
        configs = configs.replace("file:/", "");
        return configs;
	}
	
	/*
	 * 对前端传入的JSON数据进行统一反序列化。
	 * 
	 * 反序列化的结果统一转换为ArrayList形式。
	 * 后面需要花时间仔细研究flexJson的文档，相信flexJson用好了以后，这个函数可以取消的。
	*/
	@SuppressWarnings("rawtypes")
	public static HashMap[] deserializingDataStream(String dataStream) {
    	if (!notEmptyObject(dataStream)) return null;
		JSONDeserializer jsonD = new JSONDeserializer();
    	HashMap[] Beans = null;
    	//多条传入的数据，反序列化后是arraylist形式，单条数据，反序列化后是hashmap形式。
    	logger.info("开始反序列：" + dataStream);
    	Object objBeans = jsonD.deserialize(dataStream);

    	//检测前端数据是多条传入，还是一条传入。一条传入时，也转换成数组形式，便于后续程序的统一处理。
    	if ("java.util.ArrayList".equals(objBeans.getClass().getName())) {
    		@SuppressWarnings({ "unchecked" })
			ArrayList<HashMap> newBeans=(ArrayList<HashMap>)objBeans;
        	Beans=(HashMap[]) newBeans.toArray(new HashMap[newBeans.size()]);
    	} else {
    		Beans = new HashMap[1];
    		Beans[0]=(HashMap)objBeans;
    	}
			return Beans;
		}

	private final static String[] CN_Digits = { "零", "壹", "貳", "叁", "肆", "伍",
		"陆", "柒", "捌", "玖", };

	/**
	 * 将数字型货币转换为中文型货币 <br/>
	 * 
	 * @param moneyValue
	 *            　字符串形式的金额，小数部分，将多于3位部分舍去，不做四舍五入
	 * @return
	 */
	public static String CNValueOf(String moneyValue) {
		// 使用正则表达式，去除前面的零及数字中的逗号
		String value = moneyValue.replaceFirst("^0+", "");
		value = value.replaceAll(",", "");
		// 分割小数部分与整数部分
		int dot_pos = value.indexOf('.');
		String int_value;
		String fraction_value;
		if (dot_pos == -1) {
			int_value = value;
			fraction_value = "00";
		} else {
			int_value = value.substring(0, dot_pos);
			fraction_value = value.substring(dot_pos + 1, value.length())
					+ "00".substring(0, 2);// 也加两个0，便于后面统一处理
		}

		int len = int_value.length();
		if (len > 16)
			return "值过大";
		StringBuffer cn_currency = new StringBuffer();
		String[] CN_Carry = new String[] { "", "万", "亿", "万" };
		// 数字分组处理，计数组数
		int cnt = len / 4 + (len % 4 == 0 ? 0 : 1);
		// 左边第一组的长度
		int partLen = len - (cnt - 1) * 4;
		String partValue = null;
		boolean bZero = false;// 有过零
		String curCN = null;
		for (int i = 0; i < cnt; i++) {
			partValue = int_value.substring(0, partLen);
			int_value = int_value.substring(partLen);
			curCN = Part2CN(partValue, i != 0 && !"零".equals(curCN));
			// 若上次为零，这次不为零，则加入零
			if (bZero && !"零".equals(curCN)) {
				cn_currency.append("零");
				bZero = false;
			}
			if ("零".equals(curCN))
				bZero = true;
			// 若数字不是零，加入中文数字及单位
			if (!"零".equals(curCN)) {
				cn_currency.append(curCN);
				cn_currency.append(CN_Carry[cnt - 1 - i]);
			}
			// 除最左边一组长度不定外，其它长度都为4
			partLen = 4;
			partValue = null;
		}
		cn_currency.append("元");
		// 处理小数部分
		int fv1 = Integer.parseInt(fraction_value.substring(0, 1));
		int fv2 = Integer.parseInt(fraction_value.substring(1, 2));
		if (fv1 + fv2 == 0) {
			cn_currency.append("整");
		} else {
			cn_currency.append(CN_Digits[fv1]).append("角");
			cn_currency.append(CN_Digits[fv2]).append("分");
		}
		return cn_currency.toString();
	}

	@SuppressWarnings("rawtypes")
	public static int checkRecordCount(String strCountSQL) {
		logger.info(strCountSQL);
		List listResults = executeSelectSQL(strCountSQL);
		
		if (listResults == null) {
			logger.error("SQL查询异常，检查语句 *** " + strCountSQL);
			return -1;
		}
		
		HashMap hm = (HashMap)listResults.get(0);
		Iterator it = hm.keySet().iterator();
		String key = (String) it.next();
		Long totalRecords = (Long) hm.get(key);
		return totalRecords.intValue();
	}

	public static int getTotalPages(int totalRecords, int rowsPerPage) {
		//ceil方法，如果是两个整数除，比如  1/2，结果是零，应该是中间自己强转过了。
		//因此使用时，需要先将参数强转为double才能获得正确的结果。
		//原因以及是否有更好的方法，待查。 --- Harry 2013-12-24
		int totalPages = (int) Math.ceil((double)totalRecords/rowsPerPage);
		return totalPages;
	}
	
	public static String makeLimitClause(int numberOfPage, int rowsPerPage) {
		return " LIMIT " + (numberOfPage * rowsPerPage - rowsPerPage) + ", " + rowsPerPage;
	}
	
	/**
	 * 将一组数字（不多于四个）转化成中文表示 <br/>
	 * 
	 * @param partValue
	 *            字符串形式的数字
	 * @param bInsertZero
	 *            是否在前面添加零
	 * @return
	 */
	private static String Part2CN(String partValue, boolean bInsertZero) {
		// 使用正则表达式，去除前面的0
		partValue = partValue.replaceFirst("^0+", "");
		int len = partValue.length();
		if (len == 0)
			return "零";
		StringBuffer sbResult = new StringBuffer();
		int digit;
		String[] CN_Carry = new String[] { "", "拾", "佰", "仟" };
		for (int i = 0; i < len; i++) {
			digit = Integer.parseInt(partValue.substring(i, i + 1));
			if (digit != 0) {
				sbResult.append(CN_Digits[digit]);
				sbResult.append(CN_Carry[len - 1 - i]);
			} else {
				// 若不是最后一位，且下不位不为零，追加零
				if (i != len - 1
						&& Integer.parseInt(partValue.substring(i + 1, i + 2)) != 0)
					sbResult.append("零");
			}
		}
		if (bInsertZero && len != 4)
			sbResult.insert(0, "零");
		return sbResult.toString();
	}
		
/********************************************************************************************
 * 功能：	获取客户机的真实ip地址
 * 
 * 输入：	HttppRequest
 * 输出：	字符串。
 * 异常：	无
 * 其他：	从网上引用的程序，未进行修改也未验证是否有效。
 * 
 * @author harry
 * @version 1.0 2013-12-25
 ********************************************************************************************/	
	public static String getIpAddr(HttpServletRequest request) { 
	       String ip = request.getHeader("x-forwarded-for"); 
	       if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { 
	           ip = request.getHeader("Proxy-Client-IP"); 
	       } 
	       if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { 
	           ip = request.getHeader("WL-Proxy-Client-IP"); 
	       } 
	       if(ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) { 
	           ip = request.getRemoteAddr(); 
	       } 
	       return ip; 
	   }
	
	
	public static String getOutsourceRedirectURL(String outsourceRole) {
		if (outsourceRole.substring(2).equals("A")) {
			return "distributors/main.html";
		}
		if (outsourceRole.substring(2).equals("B")) {
			return "providers/material_delivery.html";
		}
		if (outsourceRole.substring(2).equals("C")) {
			return "providers/insite_measurement.html";
		}
		if (outsourceRole.substring(2).equals("D")) {
			return "providers/worker_dispatcher.html";
		}
		if (outsourceRole.substring(2).equals("E")) {
			return "providers/maintenance.html";
		}
		return "login.jsp";
	}

	@SuppressWarnings("rawtypes")
	public boolean MenuItemAuthority(String theFeatureName, Integer theJiBie, String theMoKuai) {
		String strSQL = "SELECT SuoShuMoKuai, YaoQiuJiBie FROM candanquanxian WHERE CanDanXianShi ='" + theFeatureName + "'";

		List listResults = executeSelectSQL(strSQL);
		if (listResults.size()==0) {
			return false;
		} else {
			if (theJiBie == null) { return false;}
			if (theMoKuai == null) {
				//最高权限直接验证为true。
				if (theJiBie == 0) { 
				return true; 
				//有全模块权限但级别不是最高时，验证为false
				} else {
				return false; 
				}
			}
			HashMap result = (HashMap) listResults.get(0);
			String[] arryMoKuai = theMoKuai.split(",");
			for (int i = 0; i < arryMoKuai.length; i++) {
				if (arryMoKuai[i].equalsIgnoreCase((String) result.get("SuoShuMoKuai"))) {
					if (theJiBie <= (Integer) result.get("YaoQiuJiBie")) {
						return true;
					} else {
						return false;
					}
				}
			}
		}
		return false;
	}
	
	public static String convertJiBieCodeToString(int JiBieCode) {
		String rtnStr = "错误";
		switch (JiBieCode) {
		case 0:
			rtnStr = "总经理";
			break;
		case 1:
			rtnStr = "总监/副总";
			break;
		case 2:
			rtnStr = "经理";
			break;
		case 3:
			rtnStr = "店长/主管";
			break;
		case 4:
			rtnStr = "员工";
			break;
		}
			
		return rtnStr;
	}
/*
 * 测试用的main方法
 * 
 */
	public static void main(String[] args) throws SQLException {
		Connection conn = null;
		 try {  
	            Class.forName("com.mysql.jdbc.Driver");// 加载Mysql数据驱动  
	              
	            conn = DriverManager.getConnection(  
	                    "jdbc:mysql://localhost:3306/plusyoou", "plusyoou", "plusyoou");// 创建数据连接  
	              
	        } catch (Exception e) {  
	            System.out.println("数据库连接失败" + e.getMessage());
	            return;
	        }  
		
//		System.out.println(get32BitMD5("50"));
		
		CallableStatement call=conn.prepareCall("{CALL getMeasureSpecs(?)}");
		call.setString(1, "WYDD001404260004");
		ResultSet rs = call.executeQuery();
		rs.first();
 		System.out.println(rs.getString("GuiGeMingCheng"));
 		rs.next();
 		System.out.println(rs.getString("GuiGeMingCheng"));
 		rs.next();
 		System.out.println(rs.getString("GuiGeMingCheng"));

 		String text = "this^good^baby";
 		String[] arr = text.split("/^");
 		System.out.println(arr.length);
 		
	}
	
}
