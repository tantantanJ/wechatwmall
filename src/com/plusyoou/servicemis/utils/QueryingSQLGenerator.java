package com.plusyoou.servicemis.utils;

import static com.plusyoou.servicemis.utils.CommonUtils.*;

import java.text.SimpleDateFormat;
import java.util.HashMap;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import com.plusyoou.servicemis.listeners.LoginUser;

import flexjson.JSONDeserializer;

@SuppressWarnings("rawtypes")
public class QueryingSQLGenerator {
	private HttpServletRequest rqtFromServlet;
	private String infoType;
	private int page;
	private int rows;
	@SuppressWarnings("unused")
	private HashMap queryCriteria;

	public QueryingSQLGenerator(HttpServletRequest request) throws PyException {
		super();
		this.rqtFromServlet = request;

		this.infoType = request.getParameter("infoType");
		if (!notEmptyObject(this.infoType)) {
			throw new PyException("没有传递InfoType参数！");
		} 
		String dataStream = request.getParameter("dataStream");
		HashMap queryCriteria = new HashMap();
		if (!(dataStream == null || dataStream.equals(""))) {
			JSONDeserializer jsonD = new JSONDeserializer();
			queryCriteria = (HashMap) jsonD.deserialize(dataStream);
		}
		this.queryCriteria = queryCriteria;

		try {
			this.page = Integer.parseInt(request.getParameter("page"));
		} catch (NumberFormatException e) {
			this.page = 0;
		}
		try {
			this.rows = Integer.parseInt(request.getParameter("rows"));
		} catch (NumberFormatException e) {
			this.rows = 0;
		}
	}

	public String QueryingStaticInfoSQL() throws PyException {
		HttpServletRequest request = this.rqtFromServlet;

		StaticInfoTypes enumInfoType = StaticInfoTypes.valueOf(this.infoType);
		String strSQL = "";

		switch (enumInfoType) {
		case 门店显示:  //生效门店logo和名称，按权重排序，用于显示
			strSQL = "SELECT ID, MingCheng, LogoURL "
						+ "FROM mendian " 
						+ "WHERE TingYong= FALSE AND ShiFouShengXiao= TRUE "
						+ "ORDER BY QuanZhong DESC "
						+ "LIMIT "+ getSystemParameter("显示店面数");
			break;
		case 商品显示:  //生效商品主图和名称和价格，按权重排序，用于显示
			strSQL = "SELECT ID, MingCheng, JiaGe, DanWei, ImgURL "
					+ "FROM shangpin " 
					+ "WHERE TingYong= FALSE "
					+ "ORDER BY QuanZhong DESC "
					+ "LIMIT "+ getSystemParameter("显示推荐商品数");
			break;
		case 所有活动:    //所有有效活动，按权重排序
			strSQL = "SELECT ID, MingCheng, ShuoMing, ImgURL "
					+ "FROM huodong " 
					+ "WHERE TingYong= FALSE AND DATE(NOW())>=StartDate AND DATE(NOW())<=EndDate "
					+ "ORDER BY QuanZhong DESC";
			break;
		case 门店信息:  //由门店ID号取门店详细信息，用于门店页面显示
			if (notEmptyObject(request.getParameter("id"))) {
				strSQL = "SELECT ID, MingCheng, DiZhi, DianHua,ZhuYingLeiBie,LogoURL, BnanerURL, JianJie, wxURL "
						+ "FROM mendian " 
						+ "WHERE TingYong=FALSE AND id="+request.getParameter("id");
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 门店商品:    //该门店下所有有效商品排序
			if (notEmptyObject(request.getParameter("id"))) {
				strSQL = "SELECT a.ID, a.MingCheng, a.YuanJia, a.JiaGe, a.DanWei, b.MingCheng AS LeiBieMingCheng, a.ImgURL, a.PaiXu "
					+ "FROM shangpin a LEFT JOIN shangpinleibie b ON a.LeiBieID = b.ID AND b.TingYong = FALSE "
					+ "WHERE a.TingYong=FALSE AND a.MenDianID=" + request.getParameter("id")
					+ " ORDER BY a.PaiXu ASC";
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 门店活动:    //该门店的有效活动
			if (notEmptyObject(request.getParameter("id"))) {
				strSQL = "SELECT ID, MingCheng, ImgURL, ShuoMing "
						+ "FROM huodong " 
						+ "WHERE TingYong= FALSE AND DATE(NOW())>=StartDate AND DATE(NOW())<=EndDate AND StoreID=" + request.getParameter("id")
						+ " ORDER BY QuanZhong DESC";
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 商品信息:  //由商品ID号取商品信息
			if (notEmptyObject(request.getParameter("id"))) {
				if (notEmptyObject(request.getParameter("for")) && request.getParameter("for").equals("管理")) {
					strSQL = "SELECT ID, MingCheng, LeiBieID, YuanJia, JiaGe, DanWei, PaiXu, JianJie, ShuoMing, ImgURL, TuPianURL "
						+ "FROM shangpin WHERE id=" + request.getParameter("id") + " ORDER BY PaiXu";					
				} else {
					strSQL = "SELECT a.ID, a.MingCheng, a.HuoDongJia, a.JiaGe, a.YuanJia, a.DanWei, a.TeJia, a.YuanJia, a.JianJie, a.ShuoMing, a.ImgURL, a.TuPianURL, b.DianHua, b.wxURL  "
						+ "FROM shangpin a LEFT JOIN mendian b ON a.MenDianID=b.ID WHERE a.id=" + request.getParameter("id") + " ORDER BY a.PaiXu";					
				}
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 商品收藏数:  //
			if (notEmptyObject(request.getParameter("id"))) {
				strSQL = "SELECT COUNT(id) "
						+ "FROM yonghu " 
						+ "WHERE Product = '"+request.getParameter("id")+"' "
						+ "OR Product LIKE '%,"+request.getParameter("id")+",%' "
						+ "OR Product LIKE '"+request.getParameter("id")+",%'"
						+ "OR Product LIKE '%,"+request.getParameter("id")+"'";
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
		case 活动信息:  //活动详细信息，包含活动商品ID集合
			if (notEmptyObject(request.getParameter("id"))) {
				strSQL = "SELECT a.MingCheng, b.Mingcheng AS StoreMingCheng, a.StartDate, a.EndDate, a.ImgURL, a.ShuoMing, Preducts "
						+ "FROM huodong a " 
						+ "LEFT JOIN mendian b on a.StoreID=b.ID "
						+ "WHERE a.TingYong=FALSE AND a.ID ="+request.getParameter("id");
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 活动管理:  //活动详细信息，包含活动商品ID集合
			strSQL = "SELECT ID, MingCheng, StartDate, EndDate, ImgURL, ShuoMing, Preducts, "
				+ "IF(EndDate < DATE(NOW()), '过期', '有效') AS GuoQi "
				+ "FROM huodong";
			if (notEmptyObject(request.getParameter("storeID"))) {
				strSQL += " WHERE storeID =" + request.getParameter("storeID");
			} else {
				strSQL += " WHERE storeID IS NULL";
			}
			strSQL += " ORDER BY EndDate DESC";
			break;
		case 活动商品:  //由活动商品ID集合提取商品信息
			if (notEmptyObject(request.getParameter("Preducts"))) {
				strSQL = "SELECT ID, MingCheng, HuoDongJia, YuanJia, DanWei, ImgURL "
						+ "FROM shangpin " 
						+ "WHERE TingYong=FALSE "
						+ "AND ID IN ("+request.getParameter("Preducts")+")";
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 商品类别:  //生效的产品类别
			strSQL = "SELECT ID, MingCheng "
					+ "FROM shangpinleibie " 
					+ "WHERE TingYong= FALSE ";
			break;
		case 商品类别多选名称:  //生效的产品类别
			if (notEmptyObject(request.getParameter("LeiBieId"))) {
				strSQL = "SELECT CONCAT_WS(',', MingCheng) AS MingCheng "
					+ "FROM shangpinleibie WHERE TingYong= FALSE AND ID IN (" + request.getParameter("LeiBieId") + ")";
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 类别门店:  //按类别查询门店
			strSQL = "SELECT ID, Mingcheng, LogoURL, DiZhi "
				+ "FROM mendian " 
				+ "WHERE ShiFouShengXiao= TRUE AND TingYong=FALSE ";

			if (notEmptyObject(request.getParameter("LeiBie"))) {
				strSQL += "AND (ZhuYingLeiBie = '" + request.getParameter("LeiBie")+"' "
					+ "OR ZhuYingLeiBie LIKE '%," +request.getParameter("LeiBie") + ",%' "
					+ "OR ZhuYingLeiBie LIKE '" +request.getParameter("LeiBie") + ",%'"
					+ "OR ZhuYingLeiBie LIKE '%," + request.getParameter("LeiBie") + "') ";
			};
			if (notEmptyObject(request.getParameter("MingCheng"))) {
				strSQL += "AND MingCheng LIKE '%" + request.getParameter("MingCheng") + "%' "; 
			}
			strSQL += "ORDER BY QuanZhong DESC ";
			break;
		case 类别商品:  //按类别查询商品
			strSQL = "SELECT a.ID, a.MingCheng, a.JiaGe, a.DanWei, a.ImgURL, b.ID AS StoreID, "
				+ "b.Mingcheng AS StoreMingCheng FROM shangpin a " 
				+ "left join mendian b on a.MenDianID=b.ID "
				+ "WHERE a.TingYong= FALSE";
			if (notEmptyObject(request.getParameter("LeiBie"))) {
				strSQL += " AND a.LeiBieID=" + request.getParameter("LeiBie"); 
			}
			if (notEmptyObject(request.getParameter("MenDianID"))) {
				strSQL += " AND a.MenDianID=" + request.getParameter("MenDianID"); 
			}
			if (notEmptyObject(request.getParameter("MingCheng"))) {
				strSQL += "AND a.MingCheng LIKE '%" + request.getParameter("MingCheng") + "%' "; 
			}
			strSQL += " ORDER BY a.QuanZhong DESC";
			break;
		case 微信名片:  //
			if (notEmptyObject(request.getParameter("StoreID"))) {
				strSQL = "SELECT MingCheng, wxURL "
						+ "FROM mendian " 
						+ "WHERE ID="+request.getParameter("StoreID");
			} else {
				throw new PyException("前端数据没有传递有效参数，无法提供服务！");
			}
			break;
		case 门店当天访问日志:  //查询门店当天的访问日志
			strSQL = "SELECT a.ID, IF(ISNULL(a.openID),'电脑用户','微信用户') AS YongHuLeiBie, " 
					+"IF(ISNULL(b.NickName),'',b.NickName) AS NickName, "
					+"IF(ISNULL(b.HeadimgURL),'',b.HeadimgURL) AS HeadimgURL,a.ShiJian,a.DongZhuo, "
					+"IF(ISNULL(c.Mingcheng),'',c.Mingcheng) AS StoreName, "
					+"IF(ISNULL(d.MingCheng),'',d.MingCheng) AS ProduceName, "
					+"IF(ISNULL(e.MingCheng),'',e.MingCheng) AS HuoDongName, "
					+"IF(ISNULL(f.MingCheng),'',f.MingCheng) AS LeiBieName, "
 					+"IF(ISNULL(a.FuJiaCanShu),'',a.FuJiaCanShu) AS FuJiaCanShu, "
 					+"IF(ISNULL(a.TingLiuShiChang),'',CONCAT(' 停留',CAST(a.TingLiuShiChang AS CHAR),'秒')) AS TingLiuShiChang "
					+"FROM fangwenrizhi a "
					+"LEFT JOIN yonghu b ON a.openID=b.OpenID "
					+"LEFT JOIN mendian c ON a.storeID=c.ID "
					+"LEFT JOIN shangpin d ON a.productID=d.ID "
					+"LEFT JOIN huodong e ON a.HuoDongID=e.ID "
					+"LEFT JOIN shangpinleibie f ON a.LeiBieID=f.ID ";
			String whereStr="";
			whereStr = "WHERE DATE(a.ShiJian)='"+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())+"' ";
			int storeID= ((LoginUser) request.getSession().getAttribute("LoginUser")).getStoreID();
			whereStr = whereStr+"AND (a.StoreID="+storeID
						+" OR a.productID IN (select ID from shangpin where shangpin.MenDianID="+storeID+") "
						+"OR a.HuoDongID IN (select ID from huodong where huodong.StoreID="+storeID+"))";
			strSQL = strSQL+whereStr+"ORDER BY ShiJian DESC ";
			if(notEmptyObject(request.getParameter("limit"))){
				strSQL = strSQL+"LIMIT "+request.getParameter("limit")+";";
			}else{
				strSQL = strSQL+"LIMIT 10; ";
			}
			break;
		case 门店当天统计:  //查询门店当天统计信息
			int storeIDnum= ((LoginUser) request.getSession().getAttribute("LoginUser")).getStoreID();
			strSQL = "SELECT " 
					+"(SELECT COUNT(ID) FROM fangwenrizhi WHERE DATE(shijian)='"
					+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())
					+"' AND storeID="+storeIDnum+") AS DianMian, "
					+"(SELECT SUM(TingLiuShiChang) FROM fangwenrizhi WHERE DATE(shijian)='"
					+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())
					+"' AND storeID="+storeIDnum+") AS DianMianShiChang, "
					+"(SELECT COUNT(ID) FROM fangwenrizhi WHERE DATE(shijian)='"
					+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())
					+"' AND productID IN (SELECT ID FROM shangpin WHERE shangpin.MenDianID="+storeIDnum+")) AS ShangPin, "
					+"(SELECT SUM(TingLiuShiChang) FROM fangwenrizhi WHERE DATE(shijian)='"
					+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())
					+"' AND productID IN (SELECT ID FROM shangpin WHERE shangpin.MenDianID="+storeIDnum+")) AS ShangPinShiChang, "
					+"(SELECT COUNT(ID) FROM fangwenrizhi WHERE DATE(shijian)='"
					+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())
					+"' AND HuoDongID IN (SELECT ID FROM huodong WHERE huodong.StoreID="+storeIDnum+")) AS HuoDong, "
					+"(SELECT SUM(TingLiuShiChang) FROM fangwenrizhi WHERE DATE(shijian)='"
					+new SimpleDateFormat("yyyy-MM-dd").format(new java.util.Date())
					+"' AND HuoDongID IN (SELECT ID FROM huodong WHERE huodong.StoreID="+storeIDnum+")) AS HuoDongShiChang "
					+";";
			break;
		default:
			throw new PyException("没有设置查询条件");
		}
logger.info(strSQL);		
		return strSQL;
	}

	public String[] QueryingRoutineInfoSQL() throws PyException {
		HttpServletRequest request = this.rqtFromServlet;

		RoutineInfoTypes enumInfoType = RoutineInfoTypes.valueOf(this.infoType);
		String[] returnArray = new String[0];

		switch (enumInfoType) {
		case 空:
			if (notEmptyObject(request.getParameter("YeWuId"))) {
				String YeWuDaiMa = request.getParameter("YeWuId");

				String SOId = request.getParameter("DingDanDaiMa");

				returnArray = new String[3];

				returnArray[0] = "{CALL getShouZhiFangShi(?,?)}";
				returnArray[1] = YeWuDaiMa + "%string%in";
				returnArray[2] = SOId + "%string%in";
			} else {
				throw new PyException("请求收支方式没有传递业务场景代码（A段代码）");
			}
			break;
		default:
			throw new PyException("没有设置查询条件");
		}
		return returnArray;
	}
	@SuppressWarnings("unused")
	public String[] QueryingTableInfoSQL() throws PyException {
		HttpServletRequest request = this.rqtFromServlet;

		TableInfoTypes enumInfoType = TableInfoTypes.valueOf(this.infoType);
		String strZeRenXiaoShouDanWei = "";

		String strSQL = "";
		String strCountSQL = "";
		String strGroupClause = "";
		String strOrderClause = "";
		int intTotalPages = 0;
		int intTotalRecords = 0;

		boolean needWhereClause = true;

		switch (enumInfoType) {
		case 空Table:
			strSQL = "";
			break;
		default:
			throw new PyException("前端数据中没有符合接口要求的参数，请通知系统管理员！");
		}

		String[] returnArray = new String[3];

		if (notEmptyObject(strSQL)) {
			// 处理sql语句的结尾。
			// 用boolean变量hasWhereClause来区分统计记录数量时是否截取语句的where部分。
			boolean hasWhereClause = true;
			if (strSQL.substring(strSQL.length() - 6).equals("WHERE ")) {
				strSQL = strSQL.substring(0, strSQL.length() - 6);
				hasWhereClause = false;
			} else if (strSQL.substring(strSQL.length() - 4).equals("AND ")) {
				strSQL = strSQL.substring(0, strSQL.length() - 4);
			}

			if (notEmptyObject(strCountSQL)) {
				if (needWhereClause) {
					// 如果SQL语句有where部分，则截取之，并作为数量统计语句的条件部分。
					if (hasWhereClause) {
						int positionOfWhere = strSQL.lastIndexOf(" WHERE");
						strCountSQL += strSQL.substring(positionOfWhere, strSQL.length());
					}
				}
				intTotalRecords = checkRecordCount(strCountSQL);
				if (intTotalRecords == -1) {
					throw new PyException("统计查询结果集数量时发生错误，SQL语句异常，请通知系统管理员！");
				} else {
					intTotalPages = getTotalPages(intTotalRecords, this.rows);
				}
			}

			if (notEmptyObject(strGroupClause)) {
				strSQL += strGroupClause;
			}
			if (notEmptyObject(strOrderClause)) {
				strSQL += strOrderClause;
			}

			if (intTotalPages != 0) {
				if (this.page > intTotalPages)
					this.page = intTotalPages;
				strSQL += makeLimitClause(this.page, this.rows);
			}
		}

		returnArray[0] = String.valueOf(intTotalPages);
		returnArray[1] = String.valueOf(intTotalRecords);
		returnArray[2] = strSQL;
		return returnArray;
	}

	@SuppressWarnings("unused")
	public String QueryingWidgetsInfoSQL() throws PyException {
		HttpServletRequest request = this.rqtFromServlet;

		WidgetsInfoTypes enumInfoType = WidgetsInfoTypes.valueOf(this.infoType);
		String strSQL = "";
		String[] strDate;

		switch (enumInfoType) {
		case 空Widgets:
			strSQL = "";
			break;
		default:
			throw new PyException("infoType参数" + this.infoType + "没有正确地定义！");
		}
		return strSQL;
	}

}
