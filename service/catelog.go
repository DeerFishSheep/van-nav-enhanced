package service

import (
	"strings"
	
	"github.com/mereith/nav/database"
	"github.com/mereith/nav/logger"
	"github.com/mereith/nav/types"
	"github.com/mereith/nav/utils"
)

func UpdateCatelog(data types.UpdateCatelogDto) {

	// 查询分类原名称
	sql_select_old_catelog_name := `select name from nav_catelog where id = ?;`
	var oldName string
	err := database.DB.QueryRow(sql_select_old_catelog_name, data.Id).Scan(&oldName)
	utils.CheckErr(err)

	// 获取原有的 Sort 值
	var oldSort int
	err = database.DB.QueryRow(`SELECT sort FROM nav_catelog WHERE id = ?`, data.Id).Scan(&oldSort)
	utils.CheckErr(err)
	
	// 获取当前大分类总数（作为最大允许值）
	var maxSort int
	err = database.DB.QueryRow(`SELECT COUNT(*) FROM nav_catelog`).Scan(&maxSort)
	if err != nil {
		logger.LogError("获取大分类总数失败: %v", err)
		utils.CheckErr(err)
	}
	
	// 如果新的 Sort 值超过最大值，自动调整
	targetSort := data.Sort
	
	// 检查最小值（永远为1）
	if targetSort < 1 {
		logger.LogInfo("更新大分类[%s]：指定的Sort(%d)小于最小值，已自动调整为 1", data.Name, targetSort)
		targetSort = 1
	}
	
	// 检查最大值（基于数量）
	if targetSort > maxSort {
		logger.LogInfo("更新大分类[%s]：指定的Sort(%d)超过最大值（共%d个），已自动调整为 %d", data.Name, targetSort, maxSort, maxSort)
		targetSort = maxSort
	}
	
	// 如果 Sort 发生变化，需要调整其他大分类的排序
	if targetSort != oldSort && targetSort > 0 {
		err := database.ReorderCatelogsAfterSortChange(oldSort, targetSort)
		if err != nil {
			logger.LogError("调整大分类排序失败: %v", err)
			utils.CheckErr(err)
		}
		logger.LogInfo("大分类[%s]的Sort从%d变更为%d，已调整其他大分类排序", data.Name, oldSort, targetSort)
	}

	// 开启事务
	tx, err := database.DB.Begin()
	utils.CheckErr(err)

	// 更新分类新名称
	sql_update_catelog := `
		UPDATE nav_catelog
		SET name = ?, sort = ?, hide = ?
		WHERE id = ?;
		`
	stmt, err := tx.Prepare(sql_update_catelog)
	utils.CheckTxErr(err, tx)
	res, err := stmt.Exec(data.Name, targetSort, data.Hide, data.Id)
	utils.CheckTxErr(err, tx)
	_, err = res.RowsAffected()
	utils.CheckTxErr(err, tx)

	if oldName != data.Name {
		// 更新工具分类新名称
		sql_update_tools := `
		UPDATE nav_table
		SET catelog = ?
		WHERE catelog = ?;
		`
		stmt2, err := tx.Prepare(sql_update_tools)
		utils.CheckTxErr(err, tx)
		res2, err := stmt2.Exec(data.Name, oldName)
		utils.CheckTxErr(err, tx)
		_, err = res2.RowsAffected()
		utils.CheckTxErr(err, tx)
	}
	// 提交事务
	err = tx.Commit()
	utils.CheckErr(err)
	
	logger.LogInfo("更新大分类成功: %s (ID: %d, Sort: %d)", data.Name, data.Id, targetSort)
}

func AddCatelog(data types.AddCatelogDto) {
	// 检查分类名称是否为空，如果为空则不创建
	if data.Name == "" || strings.TrimSpace(data.Name) == "" {
		return
	}
	
	// 先检查重复不重复
	existCatelogs := GetAllCatelog()
	var existCatelogsArr []string
	for _, catelogDto := range existCatelogs {
		existCatelogsArr = append(existCatelogsArr, catelogDto.Name)
	}
	if utils.In(data.Name, existCatelogsArr) {
		return
	}
	
	// 获取当前大分类总数
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_catelog`).Scan(&count)
	if err != nil {
		logger.LogError("获取大分类总数失败: %v", err)
		utils.CheckErr(err)
	}
	
	targetSort := data.Sort
	
	// 检查最小值（永远为1）
	if targetSort < 1 {
		logger.LogInfo("新增大分类：指定的Sort(%d)小于最小值，已自动调整为 1", targetSort)
		targetSort = 1
	}
	
	// 如果未指定Sort（或为0），自动分配到末尾
	if data.Sort == 0 {
		targetSort = count + 1
		logger.LogInfo("自动分配大分类sort: %d（当前共%d个）", targetSort, count)
	} else {
		// 如果指定了 Sort，检查是否超过最大允许值（count + 1）
		maxAllowed := count + 1
		if targetSort > maxAllowed {
			logger.LogInfo("新增大分类：指定的Sort(%d)超过最大值（共%d个），已自动调整为 %d", targetSort, count, maxAllowed)
			targetSort = maxAllowed
		}
		
		// 如果指定了Sort且在有效范围内，将该Sort及之后的所有大分类Sort+1
		if targetSort <= count {
			var affectedCount int
			err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_catelog WHERE sort >= ?`, targetSort).Scan(&affectedCount)
			if err == nil && affectedCount > 0 {
				_, err = database.DB.Exec(`UPDATE nav_catelog SET sort = sort + 1 WHERE sort >= ?`, targetSort)
				if err != nil {
					logger.LogError("调整大分类排序失败: %v", err)
					utils.CheckErr(err)
				}
				logger.LogInfo("已将Sort >= %d 的大分类排序后移", targetSort)
			}
		}
	}
	
	sql_add_catelog := `
		INSERT INTO nav_catelog (name,sort,hide)
		VALUES (?,?,?);
		`
	stmt, err := database.DB.Prepare(sql_add_catelog)
	utils.CheckErr(err)
	res, err := stmt.Exec(data.Name, targetSort, data.Hide)
	utils.CheckErr(err)
	id, err := res.LastInsertId()
	utils.CheckErr(err)
	
	logger.LogInfo("添加大分类成功: %s (ID: %d, Sort: %d)", data.Name, id, targetSort)
}

func GetAllCatelog() []types.Catelog {
	sql_get_all := `
		SELECT id,name,sort,hide FROM nav_catelog order by sort;
	`
	results := make([]types.Catelog, 0)
	rows, err := database.DB.Query(sql_get_all)
	utils.CheckErr(err)
	for rows.Next() {
		var catelog types.Catelog
		err = rows.Scan(&catelog.Id, &catelog.Name, &catelog.Sort, &catelog.Hide)
		utils.CheckErr(err)
		results = append(results, catelog)
	}
	defer rows.Close()
	return results
}
