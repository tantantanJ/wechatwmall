-- --------------------------------------------------------
-- 主机:                           localhost
-- 服务器版本:                        5.1.73-community - MySQL Community Server (GPL)
-- 服务器操作系统:                      Win32
-- HeidiSQL 版本:                  8.3.0.4694
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;

-- 导出 wxmall 的数据库结构
CREATE DATABASE IF NOT EXISTS `wxmall` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_bin */;
USE `wxmall`;


-- 导出  表 wxmall.fangwenrizhi 结构
CREATE TABLE IF NOT EXISTS `fangwenrizhi` (
  `ID` int(10) NOT NULL AUTO_INCREMENT,
  `openID` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '鉴权取得的微信openID号',
  `sessionID` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '用户SessionID',
  `ShiJian` datetime DEFAULT NULL COMMENT '动作时间',
  `DongZhuo` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '实际动作',
  `storeID` int(10) DEFAULT NULL COMMENT '门店ID',
  `productID` int(10) DEFAULT NULL COMMENT '商品ID',
  `HuoDongID` int(10) DEFAULT NULL COMMENT '活动ID',
  `LeiBieID` int(10) DEFAULT NULL COMMENT '类别ID',
  `FuJiaCanShu` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '附加参数',
  `TingLiuShiChang` double DEFAULT NULL COMMENT '停留时长，以秒为单位',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- 数据导出被取消选择。


-- 导出  表 wxmall.huodong 结构
CREATE TABLE IF NOT EXISTS `huodong` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `MingCheng` varchar(50) COLLATE utf8_bin NOT NULL COMMENT '活动名称',
  `StoreID` int(10) unsigned DEFAULT NULL COMMENT '活动所属门店ID，NULL=商场活动',
  `StartDate` date NOT NULL COMMENT '活动开始日期',
  `EndDate` date NOT NULL COMMENT '活动结束日期',
  `TingYong` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否停用，1=停用',
  `ImgURL` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '活动图片',
  `ShuoMing` varchar(200) COLLATE utf8_bin DEFAULT NULL COMMENT '活动说明，文字限100字符',
  `Preducts` varchar(250) COLLATE utf8_bin DEFAULT NULL COMMENT '活动涉及商品ID，由逗号分隔',
  `QuanZhong` int(11) DEFAULT NULL COMMENT '活动权重',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- 数据导出被取消选择。


-- 导出  表 wxmall.manager 结构
CREATE TABLE IF NOT EXISTS `manager` (
  `UserCode` varchar(12) COLLATE utf8_bin NOT NULL COMMENT '工号',
  `CaoZuoMiMa` varchar(32) COLLATE utf8_bin NOT NULL DEFAULT '14e1b600b1fd579f47433b88e8d85291' COMMENT '密码',
  `ShenXiao` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否生效',
  `StoreID` int(11) DEFAULT NULL COMMENT '所属门店ID',
  `MiMaCuoWuCiShu` int(11) DEFAULT '0' COMMENT '密码错误次数',
  `ZuiJinDengLuShiJian` varchar(400) COLLATE utf8_bin DEFAULT NULL COMMENT '最近登录时间：用逗号分隔的最近登录时间',
  `ZuiJinDengLuIP` varchar(400) COLLATE utf8_bin DEFAULT NULL COMMENT '最近登录IP：用逗号分隔的最近登录ip。',
  PRIMARY KEY (`UserCode`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='管理者';

-- 数据导出被取消选择。


-- 导出  表 wxmall.mendian 结构
CREATE TABLE IF NOT EXISTS `mendian` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '门店ID',
  `Mingcheng` varchar(32) COLLATE utf8_bin NOT NULL COMMENT '名称，限制16中文名',
  `ShiFouShengXiao` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否生效，1=生效',
  `DiZhi` varchar(50) COLLATE utf8_bin NOT NULL COMMENT '门店地址',
  `DianHua` varchar(50) COLLATE utf8_bin NOT NULL COMMENT '联系电话',
  `ZhuYingLeiBie` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '店面主营货物类别，多项目间用逗号分隔',
  `LogoURL` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '店标图片地址',
  `wxURL` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '店面联系微信名片地址upload/wximg/',
  `BnanerURL` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '店面Bnaner图片地址',
  `JianJie` varchar(100) COLLATE utf8_bin DEFAULT NULL COMMENT '店面简介或者欢迎语，未考虑好',
  `LianXiXinXi` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '店面联系人信息',
  `BeiZhu` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  `TingYong` tinyint(1) NOT NULL DEFAULT '0' COMMENT '停用，1=停止使用',
  `ProductNum` int(10) unsigned DEFAULT NULL COMMENT '允许录入商品项目数，应由系统管理者设置，考虑由系统参数取缺省值',
  `QuanZhong` int(10) unsigned DEFAULT NULL COMMENT '权重号，应由系统管理者设置，数值越大排列靠前',
  `UploadURL` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '上传文件夹路径，缺省用upload/店铺ID，此字段暂未启用',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='门店信息表';

-- 数据导出被取消选择。


-- 导出  表 wxmall.shangpin 结构
CREATE TABLE IF NOT EXISTS `shangpin` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `MingCheng` varchar(36) COLLATE utf8_bin NOT NULL COMMENT '商品名称，限制18汉字',
  `MenDianID` int(10) unsigned NOT NULL COMMENT '所属门店ID',
  `LeiBieID` int(10) unsigned NOT NULL COMMENT '所属类别ID',
  `TingYong` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否停用，1=停用',
  `JiaGe` decimal(10,2) DEFAULT NULL COMMENT '价格',
  `HuoDongJia` decimal(10,2) DEFAULT NULL COMMENT '商品参与活动时显示价格',
  `PaiXu` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '店铺内商品排序号，数值越大排列靠前',
  `TeJia` tinyint(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否特价，1=特价',
  `YuanJia` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `DanWei` varchar(10) COLLATE utf8_bin DEFAULT NULL COMMENT '商品单位',
  `JianJie` varchar(100) COLLATE utf8_bin DEFAULT NULL COMMENT '简介，商品名称下的简短介绍，如配套说明',
  `ShuoMing` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT '详细说明',
  `ImgURL` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '商品主图地址',
  `TuPianURL` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT '其他图片地址',
  `QuanZhong` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '权重号，应由系统管理者设置，数值越大排列靠前',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='商品表';

-- 数据导出被取消选择。


-- 导出  表 wxmall.shangpinleibie 结构
CREATE TABLE IF NOT EXISTS `shangpinleibie` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `MingCheng` varchar(20) COLLATE utf8_bin NOT NULL COMMENT '类别名称，限制10汉字',
  `TingYong` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否停用',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='商品类别表';

-- 数据导出被取消选择。


-- 导出  表 wxmall.xitongcanshu 结构
CREATE TABLE IF NOT EXISTS `xitongcanshu` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `MingCheng` varchar(50) COLLATE utf8_bin NOT NULL,
  `ShuZhi` varchar(50) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- 数据导出被取消选择。


-- 导出  表 wxmall.yonghu 结构
CREATE TABLE IF NOT EXISTS `yonghu` (
  `ID` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '唯一标识：自增',
  `OpenID` char(50) COLLATE utf8_bin NOT NULL COMMENT '微信OpenID号',
  `ShiFouQuXiao` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否取消关注，1=已取消',
  `GuanZhuRiQi` date DEFAULT NULL COMMENT '关注日期',
  `QuXiaoRiQi` date DEFAULT NULL COMMENT '取消关注日期',
  `NickName` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '用户昵称，关注公众号时的昵称',
  `Store` varchar(200) COLLATE utf8_bin DEFAULT NULL COMMENT '关注门店集合，以“,”号分隔',
  `Product` varchar(200) COLLATE utf8_bin DEFAULT NULL COMMENT '关注商品集合，以“,”号分隔',
  `Sex` tinyint(1) DEFAULT NULL COMMENT '用户的性别，值为1时是男性，值为2时是女性，值为0时是未知',
  `Province` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '用户个人资料填写的省份',
  `City` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '用户个人资料填写的城市',
  `Country` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '国家，如中国为CN',
  `HeadimgURL` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT '用户头像',
  `Unionid` varchar(500) COLLATE utf8_bin DEFAULT NULL COMMENT '只有在用户将公众号绑定到微信开放平台帐号后，才会出现该字段。',
  PRIMARY KEY (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='存储已关注该公众号的用户信息';

-- 数据导出被取消选择。
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IF(@OLD_FOREIGN_KEY_CHECKS IS NULL, 1, @OLD_FOREIGN_KEY_CHECKS) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
