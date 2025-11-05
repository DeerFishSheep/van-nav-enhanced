package service

import (
	"database/sql"
	"fmt"
	"strings"
	"sync"

	"github.com/mereith/nav/database"
	"github.com/mereith/nav/logger"
	"github.com/mereith/nav/types"
	"github.com/mereith/nav/utils"
)

func ImportTools(data []types.Tool) {
	// 用于缓存已处理的大分类和子分类，避免重复查询
	catelogCache := make(map[string]int)       // 大分类名称 -> 大分类ID
	subCatelogCache := make(map[string]int)    // "大分类ID:子分类名称" -> 子分类ID
	
	for _, v := range data {
		// 跳过空分类的工具
		if v.Catelog == "" || strings.TrimSpace(v.Catelog) == "" {
			logger.LogError("跳过没有大分类的工具: %s", v.Name)
			continue
		}
		
		// 1. 处理大分类：查找或创建
		var catelogId int
		if cachedId, exists := catelogCache[v.Catelog]; exists {
			catelogId = cachedId
		} else {
			// 尝试从数据库获取大分类
			existingCatelog, err := database.GetCatelogByName(v.Catelog)
			if err != nil {
				// 判断是否是"记录不存在"的错误
				if err == sql.ErrNoRows {
					// 大分类不存在，创建新的
					logger.LogInfo("创建新的大分类: %s", v.Catelog)
					AddCatelog(types.AddCatelogDto{
						Name: v.Catelog,
						Sort: 0,
						Hide: false,
					})
					// 重新获取刚创建的大分类
					existingCatelog, err = database.GetCatelogByName(v.Catelog)
					if err != nil {
						logger.LogError("创建大分类后无法获取: %s, 错误: %v", v.Catelog, err)
						continue
					}
				} else {
					// 其他数据库错误
					logger.LogError("查询大分类失败: %s, 错误: %v", v.Catelog, err)
					continue
				}
			}
			catelogId = existingCatelog.Id
			catelogCache[v.Catelog] = catelogId
		}
		
	// 2. 处理子分类
	var finalSubCatelogId int
	subCatelogName := v.SubCatelog
	
	// 如果没有指定子分类或为空，使用"默认"
	if subCatelogName == "" || strings.TrimSpace(subCatelogName) == "" {
		subCatelogName = "默认"
	}
	
	// 查找或创建子分类
	cacheKey := fmt.Sprintf("%d:%s", catelogId, subCatelogName)
	logger.LogInfo("处理书签[%s]的子分类[%s]，查找缓存key: %s", v.Name, subCatelogName, cacheKey)
	
	if cachedSubId, exists := subCatelogCache[cacheKey]; exists {
		finalSubCatelogId = cachedSubId
		logger.LogInfo("从缓存获取子分类ID: %d", cachedSubId)
	} else {
		// 尝试从数据库获取子分类
		logger.LogInfo("从数据库查找大分类[%s(ID:%d)]下的子分类[%s]", v.Catelog, catelogId, subCatelogName)
		existingSubCatelog, err := database.GetSubCatelogByNameAndCatelogId(subCatelogName, catelogId)
		if err != nil {
			// 判断是否是"记录不存在"的错误
			if err == sql.ErrNoRows {
				// 子分类不存在，创建新的
				logger.LogInfo("⭐ 子分类不存在，为大分类[%s(ID:%d)]创建子分类[%s]", v.Catelog, catelogId, subCatelogName)
				subId, err := AddSubCatelog(types.AddSubCatelogDto{
					Name:      subCatelogName,
					CatelogId: catelogId,
					Sort:      0,
					Hide:      false,
				})
				if err != nil {
					logger.LogError("❌ 创建子分类失败: %v", err)
					continue
				}
				finalSubCatelogId = int(subId)
				logger.LogInfo("✅ 成功创建子分类，ID: %d", finalSubCatelogId)
			} else {
				// 其他数据库错误
				logger.LogError("查询子分类失败: %v", err)
				continue
			}
		} else {
			finalSubCatelogId = existingSubCatelog.Id
			logger.LogInfo("找到已存在的子分类，ID: %d", finalSubCatelogId)
		}
		subCatelogCache[cacheKey] = finalSubCatelogId
		logger.LogInfo("缓存子分类ID: %d 到key: %s", finalSubCatelogId, cacheKey)
	}
		
		// 3. 验证并插入工具
		if finalSubCatelogId == 0 {
			logger.LogError("❌ 书签[%s]的子分类ID为0，跳过插入", v.Name)
			continue
		}
		
		sql_add_tool := `
			INSERT OR REPLACE INTO nav_table (id, name, catelog, subcatelog_id, url, logo, desc, sort, hide)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
			`
		stmt, err := database.DB.Prepare(sql_add_tool)
		if err != nil {
			logger.LogError("准备插入语句失败: %v", err)
			continue
		}
		
		// 如果Sort为0或-1，使用ID作为Sort
		sort := v.Sort
		if sort <= 0 {
			sort = v.Id
		}
		
		logger.LogInfo("📥 导入工具: %s -> [大分类:%s(ID:%d) / 子分类:ID=%d] Sort=%d", 
			v.Name, v.Catelog, catelogId, finalSubCatelogId, sort)
		
		res, err := stmt.Exec(v.Id, v.Name, v.Catelog, finalSubCatelogId, v.Url, v.Logo, v.Desc, sort, v.Hide)
		if err != nil {
			logger.LogError("插入工具失败: %s, 错误: %v", v.Name, err)
			continue
		}
		_, err = res.LastInsertId()
		if err != nil {
			logger.LogError("获取插入ID失败: %v", err)
		} else {
			logger.LogInfo("✅ 成功导入: %s", v.Name)
		}
	}
	
	// 导入后全局重排
	err := database.ReorderAllToolsGlobally()
	if err != nil {
		logger.LogError("导入后重排序失败: %v", err)
	}
	
	// 转存所有图片,异步
	go func(data []types.Tool) {
		for _, v := range data {
			UpdateImg(v.Logo)
		}
	}(data)
}

func UpdateTool(data types.UpdateToolDto) {
	// 1. 处理大分类：查找或创建
	var catelogId int
	existingCatelog, err := database.GetCatelogByName(data.Catelog)
	if err != nil {
		if err == sql.ErrNoRows {
			// 大分类不存在，创建新的
			logger.LogInfo("创建新的大分类: %s", data.Catelog)
			AddCatelog(types.AddCatelogDto{
				Name: data.Catelog,
				Sort: 0,
				Hide: false,
			})
			// 重新获取刚创建的大分类
			existingCatelog, err = database.GetCatelogByName(data.Catelog)
			utils.CheckErr(err)
		} else {
			utils.CheckErr(err)
		}
	}
	catelogId = existingCatelog.Id

	// 2. 处理子分类：查找或创建
	subCatelogName := data.SubCatelog
	if subCatelogName == "" || strings.TrimSpace(subCatelogName) == "" {
		subCatelogName = "默认"
	}
	
	var subCatelogId int
	existingSubCatelog, err := database.GetSubCatelogByNameAndCatelogId(subCatelogName, catelogId)
	if err != nil {
		if err == sql.ErrNoRows {
			// 子分类不存在，创建新的
			logger.LogInfo("为大分类[%s]创建子分类: %s", data.Catelog, subCatelogName)
			newSubId, err := AddSubCatelog(types.AddSubCatelogDto{
				Name:      subCatelogName,
				CatelogId: catelogId,
				Sort:      0,
				Hide:      false,
			})
			utils.CheckErr(err)
			subCatelogId = int(newSubId)
		} else {
			utils.CheckErr(err)
		}
	} else {
		subCatelogId = existingSubCatelog.Id
	}

	// 3. 获取原有的Sort值和书签总数
	var oldSort int
	err = database.DB.QueryRow(`SELECT sort FROM nav_table WHERE id = ?`, data.Id).Scan(&oldSort)
	utils.CheckErr(err)

	var maxSort int
	err = database.DB.QueryRow(`SELECT COUNT(*) FROM nav_table`).Scan(&maxSort)
	utils.CheckErr(err)

	// 如果新的Sort值超过最大值，则设为最大值
	newSort := data.Sort
	
	// 检查最小值（永远为1）
	if newSort < 1 {
		logger.LogInfo("更新工具[%s]：指定的Sort(%d)小于最小值，已自动调整为 1", data.Name, newSort)
		newSort = 1
	}
	
	// 检查最大值（基于数量）
	if newSort > maxSort {
		logger.LogInfo("更新工具[%s]：指定的Sort(%d)超过最大值（共%d个），已自动调整为 %d", data.Name, newSort, maxSort, maxSort)
		newSort = maxSort
	}
	
	// 如果Sort发生变化，需要调整其他工具的排序（不修改ID）
	if newSort != oldSort && newSort > 0 {
		// 先调整受影响范围的工具
		err := database.ReorderToolsAfterSortChange(oldSort, newSort)
		utils.CheckErr(err)
		
		logger.LogInfo("工具[%s]的Sort从%d变更为%d，已调整其他工具排序", data.Name, oldSort, newSort)
	}
	
	// 更新当前工具（ID保持不变）
	sql_update_tool := `
		UPDATE nav_table
		SET name = ?, url = ?, logo = ?, catelog = ?, subcatelog_id = ?, desc = ?, sort = ?, hide = ?
		WHERE id = ?;
		`
	stmt, err := database.DB.Prepare(sql_update_tool)
	utils.CheckErr(err)
	res, err := stmt.Exec(data.Name, data.Url, data.Logo, data.Catelog, subCatelogId, data.Desc, newSort, data.Hide, data.Id)
	utils.CheckErr(err)
	_, err = res.RowsAffected()
	utils.CheckErr(err)
	
	// 更新 img
	UpdateImg(data.Logo)
}

func AddTool(data types.AddToolDto) (int64, error) {
	// 创建一个互斥锁来保护数据库操作
	var mu sync.Mutex
	mu.Lock()
	defer mu.Unlock()

	// 1. 处理大分类：查找或创建
	var catelogId int
	existingCatelog, err := database.GetCatelogByName(data.Catelog)
	if err != nil {
		if err == sql.ErrNoRows {
			// 大分类不存在，创建新的
			logger.LogInfo("创建新的大分类: %s", data.Catelog)
			AddCatelog(types.AddCatelogDto{
				Name: data.Catelog,
				Sort: 0,
				Hide: false,
			})
			// 重新获取刚创建的大分类
			existingCatelog, err = database.GetCatelogByName(data.Catelog)
			if err != nil {
				return 0, fmt.Errorf("创建大分类后无法获取: %s, 错误: %v", data.Catelog, err)
			}
		} else {
			return 0, fmt.Errorf("查询大分类失败: %s, 错误: %v", data.Catelog, err)
		}
	}
	catelogId = existingCatelog.Id

	// 2. 处理子分类：查找或创建
	subCatelogName := data.SubCatelog
	if subCatelogName == "" || strings.TrimSpace(subCatelogName) == "" {
		subCatelogName = "默认"
	}
	
	var subCatelogId int
	existingSubCatelog, err := database.GetSubCatelogByNameAndCatelogId(subCatelogName, catelogId)
	if err != nil {
		if err == sql.ErrNoRows {
			// 子分类不存在，创建新的
			logger.LogInfo("为大分类[%s]创建子分类: %s", data.Catelog, subCatelogName)
			newSubId, err := AddSubCatelog(types.AddSubCatelogDto{
				Name:      subCatelogName,
				CatelogId: catelogId,
				Sort:      0,
				Hide:      false,
			})
			if err != nil {
				return 0, fmt.Errorf("创建子分类失败: %v", err)
			}
			subCatelogId = int(newSubId)
		} else {
			return 0, fmt.Errorf("查询子分类失败: %v", err)
		}
	} else {
		subCatelogId = existingSubCatelog.Id
	}

	// 3. 开始事务插入工具
	tx, err := database.DB.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()

	// 获取当前书签总数
	var count int
	err = tx.QueryRow(`SELECT COUNT(*) FROM nav_table`).Scan(&count)
	if err != nil {
		return 0, err
	}
	
	targetSort := data.Sort
	
	// 检查最小值（永远为1）
	if targetSort < 1 {
		logger.LogInfo("新增工具：指定的Sort(%d)小于最小值，已自动调整为 1", targetSort)
		targetSort = 1
	}
	
	// 如果未指定Sort（或为0），自动分配到末尾
	if data.Sort == 0 {
		targetSort = count + 1
		logger.LogInfo("自动分配工具sort: %d（当前共%d个）", targetSort, count)
	} else {
		// 如果指定了 Sort，检查是否超过最大允许值（count + 1）
		maxAllowed := count + 1
		if targetSort > maxAllowed {
			logger.LogInfo("新增工具：指定的Sort(%d)超过最大值（共%d个），已自动调整为 %d", targetSort, count, maxAllowed)
			targetSort = maxAllowed
		}
		
		// 如果指定了Sort且在有效范围内，将该Sort及之后的所有书签Sort+1（不修改ID）
		if targetSort <= count {
			_, err = tx.Exec(`UPDATE nav_table SET sort = sort + 1 WHERE sort >= ?`, targetSort)
			if err != nil {
				return 0, err
			}
			logger.LogInfo("已将Sort >= %d 的书签排序后移", targetSort)
		}
	}

	sql_add_tool := `
		INSERT INTO nav_table (name, url, logo, catelog, subcatelog_id, desc, sort, hide)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?);
		`
	stmt, err := tx.Prepare(sql_add_tool)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	res, err := stmt.Exec(data.Name, data.Url, data.Logo, data.Catelog, subCatelogId, data.Desc, targetSort, data.Hide)
	if err != nil {
		return 0, err
	}

	id, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}

	err = tx.Commit()
	if err != nil {
		return 0, err
	}
	
	logger.LogInfo("新增工具: %s (ID: %d, Sort: %d, 子分类: %s)", data.Name, id, targetSort, subCatelogName)

	// 在事务完成后再异步更新图片
	if data.Logo != "" {
		UpdateImg(data.Logo)
	}

	return id, nil
}

func GetAllTool() []types.Tool {
	sql_get_all := `
		SELECT id,name,url,logo,catelog,subcatelog_id,desc,sort,hide FROM nav_table order by sort;
		`
	results := make([]types.Tool, 0)
	rows, err := database.DB.Query(sql_get_all)
	utils.CheckErr(err)
	for rows.Next() {
		var tool types.Tool
		var hide interface{}
		var sort interface{}
		var subCatelogId interface{}
		err = rows.Scan(&tool.Id, &tool.Name, &tool.Url, &tool.Logo, &tool.Catelog, &subCatelogId, &tool.Desc, &sort, &hide)
		if hide == nil {
			tool.Hide = false
		} else {
			if hide.(int64) == 0 {
				tool.Hide = false
			} else {
				tool.Hide = true
			}
		}
		if sort == nil {
			tool.Sort = 0
		} else {
			i64 := sort.(int64)
			tool.Sort = int(i64)
		}
		// 处理子分类：同时填充 ID 和名称
		if subCatelogId == nil || subCatelogId.(int64) == 0 {
			tool.SubCatelog = ""
			tool.SubCatelogId = 0
		} else {
			subCatelogIdInt := int(subCatelogId.(int64))
			tool.SubCatelogId = subCatelogIdInt
			subCatelog, err := database.GetSubCatelogById(subCatelogIdInt)
			if err == nil && subCatelog != nil {
				tool.SubCatelog = subCatelog.Name
			} else {
				tool.SubCatelog = ""
			}
		}
		utils.CheckErr(err)
		results = append(results, tool)
	}
	defer rows.Close()
	return results
}

func GetToolLogoUrlById(id int) string {
	sql_get_tool := `
		SELECT logo FROM nav_table WHERE id=?;
		`
	rows, err := database.DB.Query(sql_get_tool, id)
	utils.CheckErr(err)
	var tool types.Tool
	for rows.Next() {
		err = rows.Scan(&tool.Logo)
		utils.CheckErr(err)

	}
	defer rows.Close()
	return tool.Logo
}

func UpdateToolIcon(id int64, logo string) {
	sql_update_tool := `
		UPDATE nav_table SET logo=? WHERE id=?;
		`
	_, err := database.DB.Exec(sql_update_tool, logo, id)
	utils.CheckErr(err)
	UpdateImg(logo)
}
func UpdateToolsSort(updates []types.UpdateToolsSortDto) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}

	sql := `UPDATE nav_table SET sort = ? WHERE id = ?`
	stmt, err := tx.Prepare(sql)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer stmt.Close()

	for _, update := range updates {
		_, err = stmt.Exec(update.Sort, update.Id)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}
