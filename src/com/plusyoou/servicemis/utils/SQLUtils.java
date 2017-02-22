package com.plusyoou.servicemis.utils;

import static com.plusyoou.servicemis.utils.CommonUtils.deserializingDataStream;
import static com.plusyoou.servicemis.utils.CommonUtils.notEmptyObject;

import java.lang.reflect.Field;
import java.sql.BatchUpdateException;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;
import java.sql.Statement;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;

import javax.naming.Context;
import javax.naming.InitialContext;
import javax.naming.NamingException;
import javax.sql.DataSource;

import org.apache.log4j.Logger;

import flexjson.JSONDeserializer;

public class SQLUtils {
	static Logger logger = Logger.getLogger(SQLUtils.class.getName());
	
	@SuppressWarnings("rawtypes")
	public static LinkedList<String> insertStmtGen(HashMap insertBody, StringBuffer operMessage, String insertMode) {
		logger.info("生成数据表新增语句");
		String userCode = (String) insertBody.get("userCode");
		String domainName = (String) insertBody.get("domainName");
		String dataStream = (String) insertBody.get("dataStream");
		
		String currentTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
		
		if (dataStream == null || dataStream.equals("undefined")){
			logger.info("前端数据为空或传输格式错误！****" + dataStream);
			operMessage.append("数据传输错误！");
			return null;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		if (!notEmptyObject(tableName)) {
			logger.info("系统配置错误，没有找到对应的数据库表名配置项！");
			operMessage.append( "数据配置错误！");
			return null;			
		}
		String[] domainPK = ph.getProperty(domainName +"PK").split(",");
		boolean autoIncrease = true;
		if ((ph.getProperty(domainName + "AI") != null) && (ph.getProperty(domainName +"AI").equalsIgnoreCase("false"))) {
			autoIncrease = false;
		}
		String makerColumnName = ph.getProperty(domainName + "Maker");
		
		HashMap[] Beans = deserializingDataStream(dataStream);
    	
    	String strSQL, lastTimeSQL = "";
    	String columnNames, lastTimeColNames = "";
    	String values;
    	LinkedList<String> SQLStmt = new LinkedList<String>();
    	
    	for (int i = 0; i < Beans.length; i++) {
    		strSQL = insertMode + " INTO " + tableName + " (";
        	columnNames = "";
        	values = "";       	
        	
        	try {
        		int c = 0;
    			Class clazz = Class.forName(className);
    			Field[] fieldNames = clazz.getDeclaredFields();
    			boolean[] PKFound = new boolean[domainPK.length];
    			Arrays.fill(PKFound, false);

    			for (Field field: fieldNames) {
    				if (!autoIncrease) {
    					for (int j =0; j < domainPK.length; j++) {
    						if (field.getName().equals(domainPK[j]) && notEmptyObject(Beans[i].get(field.getName()))) {
    							if (PKFound[j]) {
    								logger.info("前端请求数据中含有对同一pk字段'" + domainPK[j]+ "'的多个约束条件，造成了服务的理解混乱，拒绝提供服务！");
    								operMessage.append("服务调用错误，请通知系统管理员！");
    								return null;		    							
    							} else {
    								PKFound[j] = true;
    							}
    						}
    					}
    				}
    						    						
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
    			if (!autoIncrease) {
    				int FoundedPKs = 0;
    				for (boolean pks: PKFound) {
    					if (pks) FoundedPKs ++;
    				}
    				if (FoundedPKs != domainPK.length) {
    					logger.fatal("在前端传来的数据中，没有对表格的所有PK字段进行约束，表格共计" + domainPK.length + "项PK字段，仅约束了" + FoundedPKs +"项，中止更新！"
    							+ "***表名：" + tableName + ", 前端数据：" + dataStream);
    					operMessage.append("NOPK");
    					return null;    				
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
    		}
//        	SQLStmt.add(strSQL);       	
        	if (lastTimeSQL.equals("")) {
        		lastTimeSQL = strSQL;
        		lastTimeColNames = columnNames;
        	} else {
        		if (lastTimeColNames.equals(columnNames)) {
        			lastTimeSQL += ", (" + values + ")"; 
        		} else {
        			SQLStmt.add(lastTimeSQL);       	
        			lastTimeSQL = strSQL;
        			lastTimeColNames = columnNames;
        		}
        	}
    	}
    	SQLStmt.add(lastTimeSQL); 
		return SQLStmt;
	};
	
	@SuppressWarnings("rawtypes")
	public static LinkedList<String> replaceStmtGen(HashMap insertBody, StringBuffer operMessage) {
		logger.info("生成数据表替换语句");
		String userCode = (String) insertBody.get("userCode");
		String domainName = (String) insertBody.get("domainName");
		String dataStream = (String) insertBody.get("dataStream");
		
		String currentTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
		
		if (dataStream == null || dataStream.equals("undefined")){
			logger.info("前端数据为空或传输格式错误！****" + dataStream);
			operMessage.append("数据传输错误！");
			return null;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		if (!notEmptyObject(tableName)) {
			logger.info("系统配置错误，没有找到对应的数据库表名配置项！");
			operMessage.append( "数据配置错误！");
			return null;			
		}
		String[] domainPK = ph.getProperty(domainName +"PK").split(",");
		boolean autoIncrease = true;
		if ((ph.getProperty(domainName + "AI") != null) && (ph.getProperty(domainName +"AI").equalsIgnoreCase("false"))) {
			autoIncrease = false;
		}
		String makerColumnName = ph.getProperty(domainName + "Maker");
		
		HashMap[] Beans = deserializingDataStream(dataStream);
    	
    	String strSQL;
    	String columnNames;
    	String values;
    	LinkedList<String> SQLStmt = new LinkedList<String>();
    	
    	for (int i = 0; i < Beans.length; i++) {
    		strSQL = "REPLACE INTO " + tableName + " (";
        	columnNames = "";
        	values = "";       	
        	
        	try {
        		int c = 0;
    			Class clazz = Class.forName(className);
    			Field[] fieldNames = clazz.getDeclaredFields();
    			boolean[] PKFound = new boolean[domainPK.length];
    			Arrays.fill(PKFound, false);

    			for (Field field: fieldNames) {
    				if (!autoIncrease) {
    					for (int j =0; j < domainPK.length; j++) {
    						if (field.getName().equals(domainPK[j]) && notEmptyObject(Beans[i].get(field.getName()))) {
    							if (PKFound[j]) {
    								logger.info("前端请求数据中含有对同一pk字段'" + domainPK[j]+ "'的多个约束条件，造成了服务的理解混乱，拒绝提供服务！");
    								operMessage.append("服务调用错误，请通知系统管理员！");
    								return null;		    							
    							} else {
    								PKFound[j] = true;
    							}
    						}
    					}
    				}
    						    						
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
    			if (!autoIncrease) {
    				int FoundedPKs = 0;
    				for (boolean pks: PKFound) {
    					if (pks) FoundedPKs ++;
    				}
    				if (FoundedPKs != domainPK.length) {
    					logger.fatal("在前端传来的数据中，没有对表格的所有PK字段进行约束，表格共计" + domainPK.length + "项PK字段，仅约束了" + FoundedPKs +"项，中止更新！"
    							+ "***表名：" + tableName + ", 前端数据：" + dataStream);
    					operMessage.append("NOPK");
    					return null;    				
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
    		}
        	SQLStmt.add(strSQL);       	
    	}	
		return SQLStmt;
	};
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public static LinkedList updateStmtGen(HashMap updateBody, StringBuffer operMessage) {
		
		logger.info("生成数据表更新语句！");
		String userCode = (String) updateBody.get("userCode");
		String domainName = (String) updateBody.get("domainName");
		String dataStream = (String) updateBody.get("dataStream");
		String revise = (String) updateBody.get("revise");
		
		String currentTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
		
		//判断前端数据的有效性，如果数据为空，结束程序，报错。
		if (dataStream!=null && dataStream.equals("undefined")){
			logger.info("前端数据为空或传输格式错误！***" + dataStream);
			operMessage.append("数据传输错误！");
			return null;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		if (!notEmptyObject(tableName)) {
			logger.info("系统配置错误，没有找到对应的数据库表名配置项！");
			operMessage.append( "数据配置错误！");
			return null;			
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
    	String whereClause;
    	
    	LinkedList SQLStmt = new LinkedList<String>();

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
    							logger.info("前端请求数据中含有状态字段" + statusField[v] + "的更新要求，拒绝提供服务！");
    							operMessage.append("服务调用错误，请通知系统管理员！");
    							return null;		
    						}    					    						
    					}
    				}
    				//检查dataStream中是否包含足够的pk字段信息，本服务仅支持以所有PK字段进行约束的数据更新。
    				for (int j =0; j < domainPK.length; j++) {
    					if (field.getName().equals(domainPK[j]) && notEmptyObject(Beans[i].get(field.getName()))) {
    						if (PKFound[j]) {
    							logger.info("前端请求数据中含有对同一pk字段'" + domainPK[j]+ "'的多个约束条件，造成了服务的理解混乱，拒绝提供服务！");
    							operMessage.append("服务调用错误，请通知系统管理员！");
    							return null;		    							
    						} else {
    							PKFound[j] = true;
    						}
    						
    						if (Beans[i].get(domainPK[j]).getClass() == String.class && ((String) Beans[i].get(domainPK[j])).indexOf(",") != -1 ) {
    							whereClause += domainPK[j] + " IN (" + Beans[i].get(domainPK[j]) + ") AND ";
    						} else {
	    						whereClause += field.getName() + " = ";
	    						
	    						if (field.getType().equals(String.class)) {
	    							whereClause += "'" + Beans[i].get(field.getName()) + "' AND ";
	    						} else if (field.getType().equals(Date.class)) {
	    							whereClause += "'" + Beans[i].get(field.getName()) + "' AND ";
	    						} else {
	    							whereClause += Beans[i].get(field.getName()) + " AND ";
	    						}
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
    				//允许使用“字段名+forUpdate”方式传入要修改的数据，用于对数据表的主键字段进行修改 -- harry @2016-06-25
    				if (Beans[i].containsKey(field.getName()) || Beans[i].containsKey(field.getName() + "forUpdate")) {
    					strSQL += field.getName() + "=";
    					if (logChange) {
    						strLogChange += strLogChangeFixedParts + strLogPK + "'" + field.getName() + "', ";
    					}
    					countOfFittedColumn++;
    					String columnName = field.getName();
    					if (Beans[i].containsKey(columnName + "forUpdate")) {
    						columnName = columnName + "forUpdate";
    					}
    					if (!notEmptyObject(Beans[i].get(columnName))) {
    						strSQL += null + ",";
    						if (logChange) {
    							strLogChange += "null), ";    							
    						}
    					} else {
    						if (field.getType().equals(String.class) || field.getType().equals(Date.class)) {
    							strSQL += "'" + Beans[i].get(columnName) + "',";
    						} else {
    							strSQL += Beans[i].get(columnName) + ",";	
    						}
    						if (logChange) {
								strLogChange += "'" + Beans[i].get(columnName) + "'), ";    							    								
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
    				operMessage.append("NOPK");
    				return null;    				
    			}

    			if (countOfFittedColumn==0) {
					logger.fatal("在前端传来的数据中，除PK字段外没有发现需要更新的内容。服务结束！");
					operMessage.append("没有需要更新的内容");
					return null;
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
			if (notEmptyObject(strLogChange)) {
				SQLStmt.add(strLogChange);
			}
        	SQLStmt.add(strSQL);
    	}
		return SQLStmt;
	}
	
	@SuppressWarnings("rawtypes")
	public static LinkedList<String> changeStatusStmtGen(HashMap statusBody, StringBuffer operMessage) {
		String userCode = (String) statusBody.get("userCode");
		String auditorCode = (String) statusBody.get("auditorCode");
		if (auditorCode==null || auditorCode.equals("")) auditorCode=null;
		String domainName = (String) statusBody.get("domainName");
		String dataStream = (String) statusBody.get("dataStream");
		String toStatus = (String) statusBody.get("status");
		
		String currentTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
		
		if (!notEmptyObject(dataStream) || dataStream.equals("undefined")){
			operMessage.append("数据传输错误！");
			return null;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		if (!notEmptyObject(tableName)) {
			operMessage.append("数据配置错误，没有找到" + domainName + "对应的数据库表名配置项！");
			return null;			
		}
		String[] statusField;
		String statusChanger = ph.getProperty(domainName+"Status" + toStatus);
		//2014-12-09修改：允许不配置数据表的状态字段，但是不允许状态字段和状态记录字段同时不配置！  -- Harry
		//状态字段：domainNameStatusField; 可由前端指定写入的字段；
		//状态记录字段：状态变化时记录操作人工号和操作时间的字段配置项，不由前端操作
		if (!notEmptyObject(ph.getProperty(domainName + "StatusField"))) {
			logger.info("数据库表" + tableName + "没有配置状态字段，继续检查是否配置了状态记录字段！");
			statusField = new String[0];
			if (!notEmptyObject(statusChanger)) {
				operMessage.append("数据配置错误！数据库表" + tableName + "既没有配置状态字段，也没有配置状态变化记录字段！");
				return null;										 					
			}
		} else {
			statusField = ph.getProperty(domainName + "StatusField").split(",");
		}
		
		String[] domainPK = ph.getProperty(domainName +"PK").split(",");

		HashMap[] Beans = deserializingDataStream(dataStream);
    	
    	String strSQL;
    	String whereClause;
    	LinkedList<String> SQLStmt = new LinkedList<String>();

    	for (int i = 0; i < Beans.length; i++) {
    		strSQL = "UPDATE " + tableName + " SET ";
    		whereClause = " WHERE ";

        	try {
    			Class clazz = Class.forName(className);
    			Field[] fieldNames = clazz.getDeclaredFields();
    			boolean[] PKFound = new boolean[domainPK.length];
    			Arrays.fill(PKFound, false);
    			for (Field field: fieldNames) {
    				for (int j =0; j < domainPK.length; j++) {
    					if (field.getName().equals(domainPK[j]) && notEmptyObject(Beans[i].get(field.getName()))) {
    						if (PKFound[j]) {
    							logger.info("前端请求数据中含有对同一pk字段'" + domainPK[j]+ "'的多个约束条件，造成了服务的理解混乱，拒绝提供服务！");
    							operMessage.append("服务调用错误，请通知系统管理员！");
    							return null;		    							
    						} else {
    							PKFound[j] = true;
    						}
    						//2014-12-09修改：允许以","连接pk字段作为参数传入，达到一条语句更改多条记录状态的目的！  -- Harry
    						//2014-12-28修改：增加对取出数据的class的判断，因PK字段单独传过来时，可能不是String，这时如果直接用(String)强转报错；
    						//但是如果使用","连接的多条记录pk，一定是String，因此首先排除不是String的情况，再判断是否在where中使用IN限制。 -- Harry
    						if (Beans[i].get(domainPK[j]).getClass() == String.class && ((String) Beans[i].get(domainPK[j])).indexOf(",") != -1 ) {
    							if (field.getType().equals(String.class) || field.getType().equals(Date.class)) {
    								String PKs = (String) Beans[i].get(domainPK[j]);
    								PKs = PKs.replace(",", "','");
    								PKs = "'" + PKs + "'";
    								whereClause += domainPK[j] + " IN (" + PKs + ") AND ";    								
    							} else {
    								whereClause += domainPK[j] + " IN (" + Beans[i].get(domainPK[j]) + ") AND ";    								
    							}
    						} else {
    							whereClause += field.getName() + " = ";
    							if (field.getType().equals(String.class) || field.getType().equals(Date.class)) {
    								whereClause += "'" + Beans[i].get(field.getName()) + "' AND ";
    							} else {
    								whereClause += Beans[i].get(field.getName()) + " AND ";	
    							}    							
    						}
    						Beans[i].remove(field.getName());
    					}
    				}
    				//梳理dataStream中的其他字段，拼接成SQL语句。
    				for (int v = 0; v < statusField.length; v++) {    					
    					if (Beans[i].containsKey(field.getName()) && field.getName().equals(statusField[v])) {
    						strSQL += field.getName() + "=";
    						if (Beans[i].get(field.getName()).equals("")) {
    							strSQL += null + ",";
    						} else {
    							if (field.getType().equals(String.class) || field.getType().equals(Date.class)) {
    								strSQL += "'" + Beans[i].get(field.getName()) + "',";
    							} else {
    								strSQL += Beans[i].get(field.getName()) + ",";	
    							}
    						}
    					}
    				};
    			}
    			//缺省福利：允许前段dataStream参数中不指定要更新的状态字段，系统会缺省使用配置文件定义的状态字段名（如果该字段已配置）对数据进行更改。
    			if (strSQL.equals("UPDATE " + tableName + " SET ") && statusField.length != 0) {
    				strSQL += statusField[0] + "='" + toStatus  + "',";    					
    			}
    			
    			int FoundedPKs = 0;
    			for (boolean pks: PKFound) {
    				if (pks) FoundedPKs ++;
    			}
    			if (FoundedPKs != domainPK.length) {
    				logger.fatal("在前端传来的数据中，没有对表格的所有PK字段进行约束，表格共计" + domainPK.length + "项PK字段，仅约束了" + FoundedPKs +"项，中止更新！"
    						+ "***表名：" + tableName + ", 前端数据：" + dataStream);
    				operMessage.append("NOPK");
    				return null;    				
    			}
    			
				
    			if (ph.getProperty(domainName + "PushToPermissionFlow") != null 
    					&& ph.getProperty(domainName + "PushToPermissionFlow").indexOf(toStatus) != -1) {
    				if (auditorCode != null) {
    					if (ph.getProperty(domainName + "PermissionFlowCode") !=null) {
    						strSQL += ph.getProperty(domainName + "PermissionFlowCode") + "Ren='" + auditorCode + "',";    					
    					} else {
    						logger.fatal(userCode + "请求改变" + domainName + "单据的状态进入审批流，但系统参数中没有配置相应的审批流字段！");
    						operMessage.append("请求的服务失败！   系统参数配置错误，请联系系统管理员！");
    						return null;    						
    					}
    				} else {
    					logger.fatal(userCode + "请求改变" + domainName + "单据的状态，但没有相应的审批上级！");
    					operMessage.append("请求的服务失败！    找不到上级审批人，无法进入单据审批流！");
    					return null;
    				}
    			}
    			
    			if (notEmptyObject(statusChanger)) {
					strSQL += statusChanger + "Ren='" + userCode + "'," + statusChanger + "ShiJian='" + currentTime +"',"; 					
    			}
    			if (userCode.equals("")) {
    				logger.error("没有读取到登录用户姓名");    				
    			}
    			
    			strSQL = strSQL.substring(0, strSQL.length()-1);	
    			
				whereClause = whereClause.substring(0, whereClause.length()-5);
				if (ph.getProperty(domainName + "NeedSnapShot") != null 
    					&& ph.getProperty(domainName + "NeedSnapShot").indexOf(toStatus) != -1) {					
		    		SQLStmt.add("DELETE FROM " + tableName + "kuaizhao" + whereClause + " AND ZhuangTai = '" + toStatus + "'");
		    		SQLStmt.add("INSERT INTO " + tableName + "kuaizhao (SELECT '生效', "+ tableName + ".* FROM " + tableName + whereClause + ")");
		    		if (notEmptyObject(ph.getProperty(domainName + "SnapShotDetail"))) {
		    			String snapShotDetailTable = ph.getProperty(domainName + "SnapShotDetail");
	    				SQLStmt.add("DELETE FROM " + snapShotDetailTable + "kuaizhao" + whereClause + " AND ZhuangTai = '" + toStatus + "'");
		    			SQLStmt.add("INSERT INTO " + snapShotDetailTable +	"kuaizhao (SELECT '生效', " + snapShotDetailTable + ".* FROM " + snapShotDetailTable + whereClause + ")");
		    		}
				}
				strSQL += whereClause;
    		} catch (ClassNotFoundException e) {
    			// TODO Auto-generated catch block
    			e.printStackTrace();
    		}
        	SQLStmt.add(strSQL);       	
    	}
		return SQLStmt;
	}
	@SuppressWarnings("rawtypes")
	public static LinkedList<String> deleteStemGen(HashMap deleteBody, StringBuffer operMessage) {
		logger.info("生成数据行删除语句！");
		String userCode = (String) deleteBody.get("userCode");
		String referer = (String) deleteBody.get("referer");
		String domainName = (String) deleteBody.get("domainName");
		String dataStream = (String) deleteBody.get("dataStream");

		String currentTime = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date());
		
		if (dataStream.equals("undefined") || dataStream == null){
			logger.info("前端数据为空或传输格式错误！***" + dataStream);
			operMessage.append("数据传输错误！");
			return null;
		}

		PropertiesHandler ph = new PropertiesHandler("servicemis.properties");
		String className = ph.getProperty(domainName);
		String tableName = ph.getProperty(domainName+"TableName");
		if (!notEmptyObject(tableName)) {
			logger.info("系统配置错误，没有找到对应的数据库表名配置项！");
			operMessage.append( "数据配置错误！");
			return null;			
		}
		String[] domainPK = ph.getProperty(domainName +"PK").split(",");
		LinkedList<String> SQLStmt = new LinkedList<String>();
		JSONDeserializer jsonD = new JSONDeserializer();
		HashMap Beans = (HashMap) jsonD.deserialize(dataStream) ;

		String strSQL = "DELETE FROM " + tableName + " WHERE ";
		String strLogChange = "INSERT INTO shujushanchurizhi VALUES ";
		String strLogChangeFixedParts = "(0, '" + tableName + "', '" + userCode + "', '" + currentTime +"', '" + referer + "', ";
		strLogChange += strLogChangeFixedParts;
		
		Class clazz;
		try {
			clazz = Class.forName(className);
		} catch (ClassNotFoundException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			return null;
		}
		
		Field[] fieldNames = clazz.getDeclaredFields();

    	for (int i =0; i < domainPK.length; i++) {

			if (Beans.get(domainPK[i]) == null ) {
				logger.fatal("异常！！在前端传来的数据中，没有找到表格PK字段的信息，属于需禁止的不通过PK的删除操作，中止更新！" 
						+ "***表名：" + tableName + ", 前端数据：" + dataStream);
				operMessage.append("NOPK");
				return null;
			}
			//Integer不能直接cast到string
			//目前PK可能的数据类型为Integer, String, Date。故这里只需要排除integer的情况
			if (!(Beans.get(domainPK[i]).getClass().getSimpleName()).equals("Integer") && ((String) Beans.get(domainPK[i])).indexOf(",") != -1 ) {
				strSQL += domainPK[i] + " IN (" + Beans.get(domainPK[i]) + ") AND "; 											
			} else {
				for (Field field: fieldNames) {
					if (field.getName().equals(domainPK[i])) {
						if (field.getType().equals(int.class) || field.getType().equals(Integer.class)) {
							strSQL += domainPK[i] + " = " + Beans.get(domainPK[i]) + " AND "; 							 							
						} else {
							strSQL += domainPK[i] + " = '" + Beans.get(domainPK[i]) + "' AND "; 							 							
						}
						break;
					} 
				}
			}			
			if (i <= 1) {
	    		String deletedPkValue = "";
	    		if ((Beans.get(domainPK[i]).getClass().getSimpleName()).equals("Integer")){
	    			deletedPkValue = String.valueOf(Beans.get(domainPK[i]));
	    		} else {
	    			deletedPkValue = (String) Beans.get(domainPK[i]);
	    		}
	    		//删除日志PK字段宽度需控制在60位以内。
	    		if (deletedPkValue.length() > 60) deletedPkValue = deletedPkValue.substring(0,59);
				strLogChange += "'" +  deletedPkValue + "', ";				
			}
			//删除日志仅支持两个pk字段，因此对于多余的字段舍弃掉。
			//当填满两个字段后，处理句尾，去掉“, ”，增加“), ”
			if (i == 1 || i == domainPK.length - 1) {
				if (domainPK.length == 1) {
					strLogChange += "NULL, ";
				}
				strLogChange = strLogChange.substring(0, strLogChange.length() - 2) + "), ";					
			}
		}
    	//去掉语句句尾的“, ”
    	strLogChange = strLogChange.substring(0, strLogChange.length() - 2); 
    	SQLStmt.add(strLogChange);
    	
    	strSQL = strSQL.substring(0, strSQL.length()-5);
    	SQLStmt.add(strSQL);
		return SQLStmt;
	}
	
/*
 * 生成新单据标识，返回生成的新单据号，返回"错误："开头的其他文字表示出现错误。
 * 根据传来的单据类型和附加号参数返回新生成的单据号码。
 * 其中单据类型和单据开头字符串在sheetconversion.properties文件中定义，程序未检查properties字符长度。
 * 例子：
 *   createPlusyoouId("订单");      //返回 WYDD001312140001
 *   createPlusyoouId("库存单",2);  //返回  WYKC021312140001
 */
	
	public static String createPlusyoouId(String...sheetInfo){
		if (sheetInfo.length==0) {
			logger.error("没有接收到单据信息参数，无法完成服务！");
			return "错误: 参数传递错误！"; 
		}
		String danJuBiaoShi = null;
		String danJuBiaoShiTou = null;
		String danJuBiaoShiWei = null;
		String strSQL;
		int jiShuZhi = 0;

		PropertiesHandler ph = new PropertiesHandler("sheetconvension.properties");
		
		if (!notEmptyObject(sheetInfo[0])) {
			logger.error("单据的类型参数未传递，无法完成服务！检查系统配置文件！");
			return "错误: 没有传递要生成单号的单据类型！"; 			
		}
		
		danJuBiaoShiTou = ph.getProperty(sheetInfo[0]);
		if (danJuBiaoShiTou == null) {
			logger.error("单据的类型定义不正确，无法完成服务！");
			return "错误：没有找到单据类型【" + sheetInfo[0] + "】的单号生成规则！"; 
		}
		
		DataSource ds = getDataSource();
		Connection conn = null;
		Statement stmt = null;
		ResultSet rs = null;
		boolean relatedToDate = true;
		if (sheetInfo.length > 1 && sheetInfo[1].equals("NODATE")) relatedToDate = false;
		if (ds == null) return null;
		try {
			// 建立数据库连接
			try {
				conn = ds.getConnection();
				stmt = conn.createStatement();
				conn.setAutoCommit(false);
			} catch (SQLException e1) {
				logger.error("建立数据库连接时，出现错误：" + e1.getMessage());
			}
			
			strSQL ="";
			
			try {
				strSQL = "SELECT JiShuZhi FROM danjujishu WHERE DanJuLeiBie='" + sheetInfo[0] + "'";
				if (relatedToDate) {
					strSQL += " AND DanJuRiQi=CURRENT_DATE FOR UPDATE";
				} else {
					strSQL += " FOR UPDATE";
				}
				
				rs = stmt.executeQuery(strSQL);
				if (rs.next()) {
					jiShuZhi = rs.getInt(1) + 1;
					strSQL = "UPDATE danjujishu SET JiShuZhi=" + jiShuZhi + " WHERE DanJuLeiBie='" 
							+ sheetInfo[0] + "'";
					if (relatedToDate) strSQL += " AND DanJuRiQi=CURRENT_DATE";
					if (stmt.executeUpdate(strSQL) != 1) {
						logger.error("SQL语句 <" + strSQL + ">的执行结果不正常！");
					};
				} else {
					if (relatedToDate) {
						strSQL = "INSERT INTO danjujishu (DanJuRiQi, DanJuLeiBie, JiShuZhi) VALUES (CURRENT_DATE,'" + sheetInfo[0] + "', 1)";						
					} else {
						strSQL = "INSERT INTO danjujishu (DanJuLeiBie, JiShuZhi) VALUES ('" + sheetInfo[0] + "', 1)";						
					}
					if (stmt.executeUpdate(strSQL) != 1) {
						logger.error("SQL语句 <" + strSQL + ">的执行结果不正常！");
						return "错误：SQL语句错误--" + strSQL;
					};
					jiShuZhi = 1;
				}
			} catch (SQLException e1) {
				// TODO Auto-generated catch block
				logger.error("SQL语句<" + strSQL + ">执行时发生错误：" + e1.getMessage());
				jiShuZhi = 0;
			}
			
			// 提交事务
			try { 
				conn.commit();
				// 构建单价标识后面部分字符串
				Date currentTime = new Date();
				SimpleDateFormat formatter = new SimpleDateFormat("yyMMdd");
				String dateString = formatter.format(currentTime);
				if (relatedToDate) {
					danJuBiaoShiWei = dateString + String.format("%1$04d", jiShuZhi);					
				} else {
					danJuBiaoShiWei = String.format("%1$06d", jiShuZhi);					
				}
				//logger.debug(danJuBiaoShiWei);
			} catch (SQLException e) {
				e.printStackTrace();
				logger.error("事务提交失败，没有生成新单据号！");
				try { conn.rollback();} catch (Exception ignore) {}
				jiShuZhi = 0;
			}
		} finally {
			try {conn.setAutoCommit(true);} catch (Exception ignore){}
			if (rs != null)	try {rs.close();} catch (Exception ignore) {}
			if (stmt != null) try {stmt.close();} catch (Exception ignore) {}
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}

		if (jiShuZhi == 0) {
			logger.error("生成新 '"+ sheetInfo[0]+ "' 单号失败！");
			return "生成新 【"+ sheetInfo[0]+ "】 单号失败！";
		}	
		if (sheetInfo.length > 1 && !sheetInfo[1].equals("NODATE")) {
			danJuBiaoShi = danJuBiaoShiTou + sheetInfo[1] + danJuBiaoShiWei;			
		} else {
			danJuBiaoShi = danJuBiaoShiTou + danJuBiaoShiWei;	
		}
		logger.info("生成新"+sheetInfo[0]+"标识："+danJuBiaoShi);
		return danJuBiaoShi;
	}
		
	public static DataSource getDataSource(){
		try {
			Context iniCTX = new InitialContext();
			PropertiesHandler ph = new PropertiesHandler(CommonUtils.getAppPath() + "WEB-INF/", "plusyoouresource.properties");
			String DSName = ph.getProperty("source.name");
			System.out.println("properties File:" + ph.toString());
			System.out.println("properties File HashCode:" + ph.hashCode());
			if (DSName == null) {
				logger.info("取得的数据源字符串为空");
				PropertiesHandler tryAgainPH = new PropertiesHandler(CommonUtils.getAppPath() + "WEB-INF/", "plusyoouresource.properties");
				System.out.println("properties File:" + tryAgainPH.toString());
				System.out.println("properties File HashCode:" + tryAgainPH.hashCode());
				DSName = tryAgainPH.getProperty("source.name");
				if (DSName == null) {
					logger.info("再次取得的数据源字符串仍然为空");
					return null;
				}
			}
			Context context = (Context) iniCTX.lookup("java:comp/env");
			return (DataSource) context.lookup(DSName);			
		} catch (NamingException e) {
			// TODO Auto-generated catch block
			logger.fatal("Data Source is not available! error message as:" + e.getExplanation());
			e.printStackTrace();
			return null;
		}
	}
	
	/********************************************************************************************
	 * 功能：	批量执行SQL语句，SELECT类型的语句不采用这个方法执行
	 * 
	 * 输入：	String[]
	 * 			每条SQL语句为数组的一个元素。
	 * 			如果需要忽略执行错误的语句，继续提交其他语句，则在正常的SQL语句之外，将数组的最后一个元素赋值"notRollBack"
	 * 输出：	字符串或空
	 * 			返回字符串可能由五部分构成（根据批量语句的内容有所删减）：
	 * 			1）	INSERT 语句生成的自增PK值，PK指之间用","分隔；特征字符"AIPK="
	 * 			2）	INSERT 语句插入的记录总数量，特征字符"InsertedRows="
	 * 			3) 	UPDATE 语句更新的记录总数量（对MySQL数据库，是UPDATE语句的条件部分match的记录数量)，特征字符"UpdatedRows="
	 * 			4) 	DELETE 语句删除的记录总数量，特征字符"DeletedRows="
	 * 			5) 	每条语句对应的执行结果，实际是executeBatch方法的返回值的字符串化，
	 * 				如果有错误，则在该语句的返回值后，使用"()"包含错误信息，特征字符"results="
	 * 			返回结果如果为空，则说明语句错误，全部未执行，数据未更改（可能是全部语句错误，也可能是单条语句错误造成了全部回滚）
	 * 异常：	无
	 * 其他：	无
	 * 
	 * @author harry
	 * @version 1.0 2015-05-14
	 ********************************************************************************************/
	public static String executeSQLStmt(String[] strSQLBatch) {
		DataSource ds = getDataSource();
		Connection conn = null;
		Statement stmt = null;
		boolean rollbackAllOnError = true;
		boolean hasError = false;
		String errorMsg = "";
		try {
			// 建立数据库连接
			conn = ds.getConnection();
			stmt = conn.createStatement();	
			//sql批量处理语句数组的最后一个元素，表示在某条语句出错时，是否继续执行其余的语句。
			//如果一条语句出错，就全部回滚，则这个元素不需特别赋值！
			// *** 这个功能要生效，必须打开content.xml配置中的continueBatchOnError=true
			// *** 否则，只能commit出错语句之前的正常语句，之后的语句不能执行！
			//			harry @ 2015-05-14
			for (int i = 0; i < strSQLBatch.length; i++) {
				if (strSQLBatch[i].equals("notRollBack")) {
					rollbackAllOnError = false;
				} else {
					stmt.addBatch(strSQLBatch[i]);
					logger.debug(strSQLBatch[i]);					
				}
			}
			
			int[] batchResult =null;
			// 执行sql语句
			try {
				conn.setAutoCommit(false);
				batchResult = stmt.executeBatch();
				for (int i =0; i < batchResult.length; i++) {
					if (batchResult[i] == Statement.EXECUTE_FAILED ) {
						hasError = true;
						logger.error("第" + (i+1) + "条语句执行结果错误：" + batchResult[i]);
						if (rollbackAllOnError) {
							try {
								logger.info("开始回退");
								conn.rollback();
								conn.setAutoCommit(true);
								stmt.close();
								conn.close();
								return null;
							} catch (Exception SQLException) {
								conn.rollback();
								logger.error("事务回退出现错误：" + SQLException.getMessage());
								conn.setAutoCommit(true);
								if (!stmt.isClosed()) {stmt.close();};
								if (!conn.isClosed()) {conn.close();};
								return null;
							}							
						}
					};
				};
				if (!hasError || !rollbackAllOnError) {
					logger.info("提交事务");
					conn.commit();
					conn.setAutoCommit(true);					
				}
			} catch (BatchUpdateException e){
				e.printStackTrace();
				if (rollbackAllOnError) {
					//单条语句出错则全部回滚
					conn.rollback();
					conn.setAutoCommit(true);
					if (!stmt.isClosed()) {stmt.close();};
					if (!conn.isClosed()) {conn.close();};
					return null;
				} else {
					//单条语句出错继续执行
					// getUpdatedCounts获得语句执行的结果！
					batchResult = e.getUpdateCounts();
					errorMsg += e.getMessage() + "^";
					conn.commit();
					conn.setAutoCommit(true);
				}				
			} catch (Exception SQLException) {
				conn.rollback();
				conn.setAutoCommit(true);
				if (!stmt.isClosed()) {stmt.close();};
				if (!conn.isClosed()) {conn.close();};
				return null;				
			};
			//形成返回字符串
			int intUpdatedRows = 0;
			int intInsertedRows = 0;
			int intDeletedRows = 0;
			String returnStr = "";
			for (int i = 0; i < batchResult.length; i++) {
				if (batchResult[i] != Statement.SUCCESS_NO_INFO && batchResult[i] != Statement.EXECUTE_FAILED) {
					String sqlType = strSQLBatch[i].substring(0, 6);
					if (sqlType.equalsIgnoreCase("UPDATE")) {
						intUpdatedRows += batchResult[i];
					} else if (sqlType.equalsIgnoreCase("INSERT")) {
						intInsertedRows += batchResult[i];
					} else if (sqlType.equalsIgnoreCase("DELETE")) {
						intDeletedRows += batchResult[i];
					}
				}
			}
//				ResultSet rs = stmt.executeQuery("SELECT LAST_INSERT_ID()");
			//jdbc3.0支持getGeneratedKeys方法。
			ResultSet rs = stmt.getGeneratedKeys();
			rs.beforeFirst();
			while (rs.next()) {
				if(notEmptyObject(rs.getInt(1))) {
					returnStr += String.valueOf(rs.getInt(1)) + ",";					
				}
			}
			//处理返回字符串的尾部。
			if (!returnStr.equals("")) returnStr = "AIPK=" + returnStr.substring(0,returnStr.length()-1);
			if (intInsertedRows != 0) {
				returnStr += "%InsertedRows=" + String.valueOf(intInsertedRows);				
			}
			if (intUpdatedRows != 0) {
				returnStr += "%UpdatedRows=" + String.valueOf(intUpdatedRows);				
			}
			if (intDeletedRows != 0) {
				returnStr += "%DeletedRows=" + String.valueOf(intDeletedRows);				
			}
			returnStr += "%results=";
			for (int i = 0; i < batchResult.length; i++) {
				if (batchResult[i] < 0) {
					String thisTimeError = "";
					if (!errorMsg.equals("")) {
						thisTimeError = errorMsg.substring(0,  errorMsg.indexOf("^"));
						errorMsg = errorMsg.substring(errorMsg.indexOf("^") + 1);
						returnStr += batchResult[i] + "(" + thisTimeError + "),";					
					} else {
						returnStr += batchResult[i] + "(系统没有返回错误信息),";											
					}
				} else {
					returnStr += batchResult[i] + ",";
				}
			}
			returnStr = returnStr.substring(0, returnStr.length()-1);
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
 * 
 * 1.2版简述：
 * 
 * 本版将SQL结果集的处理过程剥离为独立的静态方法，目的是适应数据库结果集不仅能从SQL语句获取，也可以从SP的运行获取
 * 
 * @author: harry
 * @version: 1.2 2016/2/22
 ******************************************************************************************/
		
	@SuppressWarnings({ "rawtypes"})
	public static List executeSelectSQL(String strSQL) {

		DataSource ds = getDataSource();
		Connection conn = null;
		Statement stmt = null;
		ResultSet rs = null;
		
		try {
			// 建立数据库连接
			conn = ds.getConnection();
			stmt = conn.createStatement();

			// 执行sql语句
			rs = stmt.executeQuery(strSQL);

			// 正常返回结果
			return processRecordSet(rs);
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		} finally {
			if (rs != null)	try {rs.close();} catch (Exception ignore) {}
			if (stmt != null) try {stmt.close();} catch (Exception ignore) {}
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}
	}
	
	
	public static String executeRoutine(String thePreparedCall, String[] params) {
		String result = "";
		int positionOfReturn = 0;
		DataSource ds = getDataSource();
		if (ds == null) {
			return "NODS";
		}
		Connection conn = null;
		
		String[] paramSection;
		paramSection = new String[3];
		try {
			conn = ds.getConnection();
			CallableStatement call=conn.prepareCall(thePreparedCall);
			for (int i = 0; i < params.length; i++) {
				paramSection = params[i].split("%");
				if (paramSection[2].equalsIgnoreCase("out")) {
					call.registerOutParameter(i + 1,java.sql.Types.VARCHAR);
					positionOfReturn= i + 1;
				} else {
					if (paramSection[0].equals("null")) {
						call.setString(i+1, null);
					} else if (paramSection[1].equalsIgnoreCase("int")) {
						call.setInt(i + 1, Integer.parseInt(paramSection[0]));														
					} else if (paramSection[1].equalsIgnoreCase("float")) {
						call.setFloat(i + 1, Float.parseFloat(paramSection[0]));							
					} else if (paramSection[1].equalsIgnoreCase("boolean")) {
						if (paramSection[0].equalsIgnoreCase("true")) {
							call.setBoolean(i + 1, true);							
						} else {
							call.setBoolean(i + 1, false);														
						}
					} else if (paramSection[1].equalsIgnoreCase("string")){
						call.setString(i + 1, paramSection[0]);
					}					
				}
			}
			
			call.execute();
			if (positionOfReturn != 0) {
				result = call.getString(positionOfReturn);				
			} else {
				result = "TRUE";
			}
		}
		catch (Exception e) {
			e.printStackTrace();
			logger.fatal("异常！！语句'" + thePreparedCall +"'执行后抛出错误信息！", e);
			result = "ERROR";
		} finally {
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}
		return result;
	}
	
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public static List executeRoutineBackRecordsets(String thePreparedCall, String[] params) {
		ArrayList results = new ArrayList();
		DataSource ds = getDataSource();
		if (ds == null) {
			results.add("NODS");
			return results;
		}
		Connection conn = null;
		
		String[] paramSection;
		paramSection = new String[3];
		try {
			conn = ds.getConnection();
			CallableStatement call=conn.prepareCall(thePreparedCall);
			for (int i = 0; i < params.length; i++) {
				paramSection = params[i].split("%");
				if (paramSection[0].equals("null")) {
					call.setString(i+1, null);
				} else if (paramSection[1].equalsIgnoreCase("int")) {
					call.setInt(i + 1, Integer.parseInt(paramSection[0]));														
				} else if (paramSection[1].equalsIgnoreCase("float")) {
					call.setFloat(i + 1, Float.parseFloat(paramSection[0]));							
				} else if (paramSection[1].equalsIgnoreCase("boolean")) {
					if (paramSection[0].equalsIgnoreCase("true")) {
						call.setBoolean(i + 1, true);							
					} else {
						call.setBoolean(i + 1, false);														
					}
				} else if (paramSection[1].equalsIgnoreCase("string")){
					call.setString(i + 1, paramSection[0]);
				}					
			}
			
			ResultSet rs = call.executeQuery();
			return processRecordSet(rs);
		}
		catch (Exception e) {
			e.printStackTrace();
			logger.fatal("异常！！语句'" + thePreparedCall +"'执行后抛出错误信息！", e);
			results.add("ERROR");
		} finally {
			if (conn != null) try {conn.close();} catch (Exception ignore) {}
		}
		return results;
	}
	
/*******************************************************************************************
 * 处理SQL语句执行的结果，转换为LIST数据返回
 * 
 * 输入参数：	rs = SQL执行的结果集recordSet；
 * 输出：	List<LinkedHashMap> 格式的查询结果
 * 			异常：返回 null；	
 * 简要描述：	本函数仅完成结果集的数据转换工作
 * 
 * @author: Harry
 * @version: 1.1  2016/2/22
 ******************************************************************************************/
		
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public static List processRecordSet(ResultSet rs) {
		try {
			// 获取resultset的元数据信息
			ResultSetMetaData md = rs.getMetaData();
			// 获取返回结果的列数
			int columns = md.getColumnCount();

			// 最早版本使用这个方式获取，rs总行数，再声明相应size的ArrayList。
			// 现改为动态决定ArrayList的长度。
			// rs.last();
			// int rows = rs.getRow();

			ArrayList listResults = new ArrayList();

			rs.beforeFirst();
			while (rs.next()) {
				// 程序的最早版本是使用
				// HashMap存储，但是HashMap天生的put和get的顺序不一致，造成取值时控制不了需要的列顺序。
				// 控制列顺序在项目自定义的plain数据格式中，是必须的。因此改用LinkedHashMap解决这个问题，但是一定牺牲了性能
				// 如果输出是json格式，就不需要严格的列顺序了，由此也看出了json的好处。
				// 如果今后服务端的效率需要优化，这个是一个可以考虑的点，可弃用项目自定义的plain数据格式，改为json。
				// 2013-12-1 ----Harry
				LinkedHashMap row = new LinkedHashMap(columns);
				for (int i = 1; i <= columns; ++i) {
					// getColumnName取出的是表格中的字段名，本项目中是驼峰方式的字段名
					// row.put(md.getColumnName(i),rs.getObject(i));
					// getColumnLable取出的是 sql语句中字段名后面 as 部分的名字；
					row.put(md.getColumnLabel(i), rs.getObject(i));
				};
				listResults.add(row);
			};
			// 正常返回结果
			return listResults;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		} finally {
			if (rs != null)	try {rs.close();} catch (Exception ignore) {}
		}
	}
}