package service

import (
	"fmt"
	
	"github.com/mereith/nav/database"
	"github.com/mereith/nav/logger"
	"github.com/mereith/nav/types"
)

// 获取所有子分类
func GetAllSubCatelog() []types.SubCatelog {
	subcatelogs, err := database.GetAllSubCatelogs()
	if err != nil {
		logger.LogError("获取所有子分类失败: %v", err)
		return []types.SubCatelog{}
	}
	
	// 为每个子分类填充书签数量
	for i := range subcatelogs {
		count, err := database.GetToolCountBySubCatelog(subcatelogs[i].Id)
		if err != nil {
			logger.LogError("获取子分类[%s]的书签数量失败: %v", subcatelogs[i].Name, err)
			subcatelogs[i].ToolCount = 0
		} else {
			subcatelogs[i].ToolCount = count
		}
	}
	
	return subcatelogs
}

// 根据大分类ID获取子分类
func GetSubCatelogsByCatelogId(catelogId int) []types.SubCatelog {
	subcatelogs, err := database.GetSubCatelogsByCatelogId(catelogId)
	if err != nil {
		logger.LogError("获取大分类[%d]的子分类失败: %v", catelogId, err)
		return []types.SubCatelog{}
	}
	return subcatelogs
}

// 添加子分类
func AddSubCatelog(data types.AddSubCatelogDto) (int64, error) {
	// 获取当前大分类下的子分类总数
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_subcatelog WHERE catelog_id = ?`, data.CatelogId).Scan(&count)
	if err != nil {
		logger.LogError("获取大分类[%d]下子分类总数失败: %v", data.CatelogId, err)
		return 0, err
	}
	
	targetSort := data.Sort
	
	// 检查最小值（永远为1）
	if targetSort < 1 {
		logger.LogInfo("新增子分类：指定的Sort(%d)小于最小值，已自动调整为 1 (大分类ID: %d)", targetSort, data.CatelogId)
		targetSort = 1
	}
	
	// 如果未指定Sort（或为0），自动分配到末尾
	if data.Sort == 0 {
		targetSort = count + 1
		logger.LogInfo("自动分配子分类sort: %d (大分类ID: %d, 当前共%d个)", targetSort, data.CatelogId, count)
	} else {
		// 如果指定了 Sort，检查是否超过最大允许值（count + 1）
		maxAllowed := count + 1
		if targetSort > maxAllowed {
			logger.LogInfo("新增子分类：指定的Sort(%d)超过大分类[%d]下的最大值（共%d个），已自动调整为 %d", targetSort, data.CatelogId, count, maxAllowed)
			targetSort = maxAllowed
		}
		
		// 如果指定了Sort且在有效范围内，将该Sort及之后的所有子分类Sort+1
		if targetSort <= count {
			var affectedCount int
			err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_subcatelog WHERE catelog_id = ? AND sort >= ?`, data.CatelogId, targetSort).Scan(&affectedCount)
			if err == nil && affectedCount > 0 {
				_, err = database.DB.Exec(`UPDATE nav_subcatelog SET sort = sort + 1 WHERE catelog_id = ? AND sort >= ?`, data.CatelogId, targetSort)
				if err != nil {
					logger.LogError("调整子分类排序失败: %v", err)
					return 0, err
				}
				logger.LogInfo("已将大分类[%d]下Sort >= %d 的子分类排序后移", data.CatelogId, targetSort)
			}
		}
	}
	
	sub := types.SubCatelog{
		Name:      data.Name,
		CatelogId: data.CatelogId,
		Sort:      targetSort,
		Hide:      data.Hide,
	}
	
	id, err := database.AddSubCatelog(sub)
	if err != nil {
		logger.LogError("添加子分类失败: %v", err)
		return 0, err
	}
	
	logger.LogInfo("添加子分类成功: %s (ID: %d, Sort: %d)", data.Name, id, targetSort)
	return id, nil
}

// 更新子分类
func UpdateSubCatelog(data types.UpdateSubCatelogDto) error {
	// 获取原有的 Sort 值
	var oldSort int
	err := database.DB.QueryRow(`SELECT sort FROM nav_subcatelog WHERE id = ?`, data.Id).Scan(&oldSort)
	if err != nil {
		logger.LogError("获取子分类[%d]原Sort值失败: %v", data.Id, err)
		return err
	}
	
	// 获取该大分类下的子分类总数（作为最大允许值）
	var maxSort int
	err = database.DB.QueryRow(`SELECT COUNT(*) FROM nav_subcatelog WHERE catelog_id = ?`, data.CatelogId).Scan(&maxSort)
	if err != nil {
		logger.LogError("获取大分类[%d]下子分类总数失败: %v", data.CatelogId, err)
		return err
	}
	
	// 如果新的 Sort 值超过最大值，自动调整
	targetSort := data.Sort
	
	// 检查最小值（永远为1）
	if targetSort < 1 {
		logger.LogInfo("更新子分类[%s]：指定的Sort(%d)小于最小值，已自动调整为 1", data.Name, targetSort)
		targetSort = 1
	}
	
	// 检查最大值（基于数量）
	if targetSort > maxSort {
		logger.LogInfo("更新子分类[%s]：指定的Sort(%d)超过大分类[%d]下的最大值（共%d个），已自动调整为 %d", data.Name, targetSort, data.CatelogId, maxSort, maxSort)
		targetSort = maxSort
	}
	
	// 如果 Sort 发生变化，需要调整其他子分类的排序
	if targetSort != oldSort && targetSort > 0 {
		err := database.ReorderSubCatelogsAfterSortChange(data.CatelogId, oldSort, targetSort)
		if err != nil {
			logger.LogError("调整子分类排序失败: %v", err)
			return err
		}
		logger.LogInfo("子分类[%s]的Sort从%d变更为%d，已调整大分类[%d]下其他子分类排序", data.Name, oldSort, targetSort, data.CatelogId)
	}
	
	sub := types.SubCatelog{
		Id:        data.Id,
		Name:      data.Name,
		CatelogId: data.CatelogId,
		Sort:      targetSort,
		Hide:      data.Hide,
	}
	
	err = database.UpdateSubCatelog(sub)
	if err != nil {
		logger.LogError("更新子分类失败: %v", err)
		return err
	}
	
	logger.LogInfo("更新子分类成功: %s (ID: %d, Sort: %d)", data.Name, data.Id, targetSort)
	return nil
}

// 删除子分类
func DeleteSubCatelog(id int) error {
	// 检查该子分类下是否有书签
	var count int
	err := database.DB.QueryRow(`SELECT COUNT(*) FROM nav_table WHERE subcatelog_id = ?`, id).Scan(&count)
	if err != nil {
		logger.LogError("检查子分类[%d]下的书签数量失败: %v", id, err)
		return err
	}
	
	if count > 0 {
		logger.LogError("子分类[%d]下还有 %d 个书签，无法删除", id, count)
		return fmt.Errorf("该子分类下还有 %d 个书签，无法删除", count)
	}
	
	// 获取被删除子分类的 Sort 值和大分类 ID
	var deletedSort int
	var catelogId int
	err = database.DB.QueryRow(`SELECT catelog_id, sort FROM nav_subcatelog WHERE id = ?`, id).Scan(&catelogId, &deletedSort)
	if err != nil {
		logger.LogError("获取子分类[%d]信息失败: %v", id, err)
		return err
	}
	
	err = database.DeleteSubCatelog(id)
	if err != nil {
		logger.LogError("删除子分类失败: %v", err)
		return err
	}
	
	// 删除后，将同一大分类下后续子分类的Sort前移
	err = database.ReorderSubCatelogsAfterDelete(catelogId, deletedSort)
	if err != nil {
		logger.LogError("删除子分类后重排序失败: %v", err)
	}
	
	logger.LogInfo("删除子分类成功 (ID: %d)，已调整大分类[%d]下其他子分类排序", id, catelogId)
	return nil
}

// 更新子分类排序
func UpdateSubCatelogsSort(updates []types.UpdateSubCatelogsSortDto) error {
	sortData := make([]struct {
		Id   int `json:"id"`
		Sort int `json:"sort"`
	}, len(updates))
	
	for i, update := range updates {
		sortData[i].Id = update.Id
		sortData[i].Sort = update.Sort
	}
	
	err := database.UpdateSubCatelogSort(sortData)
	if err != nil {
		logger.LogError("更新子分类排序失败: %v", err)
		return err
	}
	
	logger.LogInfo("更新子分类排序成功")
	return nil
}

