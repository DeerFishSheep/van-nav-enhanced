package database

import "github.com/mereith/nav/types"

func HasApiToken(token string) bool {
	sql := `SELECT value FROM nav_api_token WHERE value = ? and disabled = 0`
	rows, err := DB.Query(sql, token)
	if err != nil {
		return false
	}
	defer rows.Close()

	for rows.Next() {
		return true
	}
	return false
}

// ==================== 搜索引擎相关操作 ====================

// 获取所有搜索引擎（按排序）
func GetAllSearchEngines() ([]types.SearchEngine, error) {
	sql := `SELECT id, name, baseUrl, queryParam, logo, sort, enabled, isDefault FROM nav_search_engine ORDER BY sort ASC`
	rows, err := DB.Query(sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var engines []types.SearchEngine
	for rows.Next() {
		var engine types.SearchEngine
		err := rows.Scan(&engine.Id, &engine.Name, &engine.BaseUrl, &engine.QueryParam, &engine.Logo, &engine.Sort, &engine.Enabled, &engine.IsDefault)
		if err != nil {
			return nil, err
		}
		engines = append(engines, engine)
	}
	return engines, nil
}

// 获取启用的搜索引擎（按排序）
func GetEnabledSearchEngines() ([]types.SearchEngine, error) {
	sql := `SELECT id, name, baseUrl, queryParam, logo, sort, enabled, isDefault FROM nav_search_engine WHERE enabled = 1 ORDER BY sort ASC`
	rows, err := DB.Query(sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var engines []types.SearchEngine
	for rows.Next() {
		var engine types.SearchEngine
		err := rows.Scan(&engine.Id, &engine.Name, &engine.BaseUrl, &engine.QueryParam, &engine.Logo, &engine.Sort, &engine.Enabled, &engine.IsDefault)
		if err != nil {
			return nil, err
		}
		engines = append(engines, engine)
	}
	return engines, nil
}

// 添加搜索引擎
func AddSearchEngine(engine types.SearchEngine) (int64, error) {
	// 获取最大排序值
	var maxSort int
	err := DB.QueryRow(`SELECT COALESCE(MAX(sort), 0) FROM nav_search_engine`).Scan(&maxSort)
	if err != nil {
		return 0, err
	}
	
	sql := `INSERT INTO nav_search_engine (name, baseUrl, queryParam, logo, sort, enabled) VALUES (?, ?, ?, ?, ?, ?)`
	stmt, err := DB.Prepare(sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()
	
	result, err := stmt.Exec(engine.Name, engine.BaseUrl, engine.QueryParam, engine.Logo, maxSort+1, engine.Enabled)
	if err != nil {
		return 0, err
	}
	
	return result.LastInsertId()
}

// 更新搜索引擎
func UpdateSearchEngine(engine types.SearchEngine) error {
	sql := `UPDATE nav_search_engine SET name = ?, baseUrl = ?, queryParam = ?, logo = ?, enabled = ? WHERE id = ?`
	stmt, err := DB.Prepare(sql)
	if err != nil {
		return err
	}
	defer stmt.Close()
	
	_, err = stmt.Exec(engine.Name, engine.BaseUrl, engine.QueryParam, engine.Logo, engine.Enabled, engine.Id)
	return err
}

// 删除搜索引擎
func DeleteSearchEngine(id int) error {
	sql := `DELETE FROM nav_search_engine WHERE id = ?`
	stmt, err := DB.Prepare(sql)
	if err != nil {
		return err
	}
	defer stmt.Close()
	
	_, err = stmt.Exec(id)
	return err
}

// 更新搜索引擎排序
func UpdateSearchEngineSort(sortData []struct {
	Id   int `json:"id"`
	Sort int `json:"sort"`
}) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	
	stmt, err := tx.Prepare(`UPDATE nav_search_engine SET sort = ? WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	
	for _, item := range sortData {
		_, err = stmt.Exec(item.Sort, item.Id)
		if err != nil {
			return err
		}
	}
	
	return tx.Commit()
}

// 设置默认搜索引擎
func SetDefaultSearchEngine(id int) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	
	// 先将所有搜索引擎的isDefault设为false
	_, err = tx.Exec(`UPDATE nav_search_engine SET isDefault = 0`)
	if err != nil {
		return err
	}
	
	// 再将指定的搜索引擎设为true
	_, err = tx.Exec(`UPDATE nav_search_engine SET isDefault = 1 WHERE id = ?`, id)
	if err != nil {
		return err
	}
	
	return tx.Commit()
}

// ==================== 子分类相关操作 ====================

// 获取所有子分类（按排序）
func GetAllSubCatelogs() ([]types.SubCatelog, error) {
	sql := `SELECT id, name, catelog_id, sort, hide FROM nav_subcatelog ORDER BY catelog_id ASC, sort ASC`
	rows, err := DB.Query(sql)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subcatelogs []types.SubCatelog
	for rows.Next() {
		var sub types.SubCatelog
		var hide interface{}
		var sort interface{}
		err := rows.Scan(&sub.Id, &sub.Name, &sub.CatelogId, &sort, &hide)
		if err != nil {
			return nil, err
		}
		if hide == nil {
			sub.Hide = false
		} else {
			if hide.(int64) == 0 {
				sub.Hide = false
			} else {
				sub.Hide = true
			}
		}
		if sort == nil {
			sub.Sort = 0
		} else {
			sub.Sort = int(sort.(int64))
		}
		subcatelogs = append(subcatelogs, sub)
	}
	return subcatelogs, nil
}

// 根据ID获取子分类
func GetSubCatelogById(id int) (*types.SubCatelog, error) {
	sql := `SELECT id, name, catelog_id, sort, hide FROM nav_subcatelog WHERE id = ? LIMIT 1`
	row := DB.QueryRow(sql, id)
	
	var sub types.SubCatelog
	var hide interface{}
	var sort interface{}
	err := row.Scan(&sub.Id, &sub.Name, &sub.CatelogId, &sort, &hide)
	if err != nil {
		return nil, err
	}
	
	if hide == nil {
		sub.Hide = false
	} else {
		if hide.(int64) == 0 {
			sub.Hide = false
		} else {
			sub.Hide = true
		}
	}
	if sort == nil {
		sub.Sort = 0
	} else {
		sub.Sort = int(sort.(int64))
	}
	
	return &sub, nil
}

// 根据大分类ID获取子分类
func GetSubCatelogsByCatelogId(catelogId int) ([]types.SubCatelog, error) {
	sql := `SELECT id, name, catelog_id, sort, hide FROM nav_subcatelog WHERE catelog_id = ? ORDER BY sort ASC`
	rows, err := DB.Query(sql, catelogId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var subcatelogs []types.SubCatelog
	for rows.Next() {
		var sub types.SubCatelog
		var hide interface{}
		var sort interface{}
		err := rows.Scan(&sub.Id, &sub.Name, &sub.CatelogId, &sort, &hide)
		if err != nil {
			return nil, err
		}
		if hide == nil {
			sub.Hide = false
		} else {
			if hide.(int64) == 0 {
				sub.Hide = false
			} else {
				sub.Hide = true
			}
		}
		if sort == nil {
			sub.Sort = 0
		} else {
			sub.Sort = int(sort.(int64))
		}
		subcatelogs = append(subcatelogs, sub)
	}
	return subcatelogs, nil
}

// 添加子分类
func AddSubCatelog(sub types.SubCatelog) (int64, error) {
	sql := `INSERT INTO nav_subcatelog (name, catelog_id, sort, hide) VALUES (?, ?, ?, ?)`
	stmt, err := DB.Prepare(sql)
	if err != nil {
		return 0, err
	}
	defer stmt.Close()

	result, err := stmt.Exec(sub.Name, sub.CatelogId, sub.Sort, sub.Hide)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

// 更新子分类
func UpdateSubCatelog(sub types.SubCatelog) error {
	sql := `UPDATE nav_subcatelog SET name = ?, catelog_id = ?, sort = ?, hide = ? WHERE id = ?`
	stmt, err := DB.Prepare(sql)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(sub.Name, sub.CatelogId, sub.Sort, sub.Hide, sub.Id)
	return err
}

// 删除子分类
func DeleteSubCatelog(id int) error {
	sql := `DELETE FROM nav_subcatelog WHERE id = ?`
	stmt, err := DB.Prepare(sql)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(id)
	return err
}

// 更新子分类排序
func UpdateSubCatelogSort(sortData []struct {
	Id   int `json:"id"`
	Sort int `json:"sort"`
}) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`UPDATE nav_subcatelog SET sort = ? WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, item := range sortData {
		_, err = stmt.Exec(item.Sort, item.Id)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// ==================== 大分类相关操作 ====================

// 根据名称获取大分类
func GetCatelogByName(name string) (*types.Catelog, error) {
	sql := `SELECT id, name, sort, hide FROM nav_catelog WHERE name = ? LIMIT 1`
	row := DB.QueryRow(sql, name)
	
	var catelog types.Catelog
	var hide interface{}
	var sort interface{}
	err := row.Scan(&catelog.Id, &catelog.Name, &sort, &hide)
	if err != nil {
		return nil, err
	}
	
	if hide == nil {
		catelog.Hide = false
	} else {
		if hide.(int64) == 0 {
			catelog.Hide = false
		} else {
			catelog.Hide = true
		}
	}
	if sort == nil {
		catelog.Sort = 0
	} else {
		catelog.Sort = int(sort.(int64))
	}
	
	return &catelog, nil
}

// 根据名称和大分类ID获取子分类
func GetSubCatelogByNameAndCatelogId(name string, catelogId int) (*types.SubCatelog, error) {
	sql := `SELECT id, name, catelog_id, sort, hide FROM nav_subcatelog WHERE name = ? AND catelog_id = ? LIMIT 1`
	row := DB.QueryRow(sql, name, catelogId)
	
	var sub types.SubCatelog
	var hide interface{}
	var sort interface{}
	err := row.Scan(&sub.Id, &sub.Name, &sub.CatelogId, &sort, &hide)
	if err != nil {
		return nil, err
	}
	
	if hide == nil {
		sub.Hide = false
	} else {
		if hide.(int64) == 0 {
			sub.Hide = false
		} else {
			sub.Hide = true
		}
	}
	if sort == nil {
		sub.Sort = 0
	} else {
		sub.Sort = int(sort.(int64))
	}
	
	return &sub, nil
}

// ==================== 工具ID/Sort全局管理 ====================

// 获取当前最大的工具ID
func GetMaxToolId() (int, error) {
	var maxId int
	err := DB.QueryRow(`SELECT COALESCE(MAX(id), 0) FROM nav_table`).Scan(&maxId)
	return maxId, err
}

// 全局重排所有工具的Sort，使其连续（ID保持不变）
func ReorderAllToolsGlobally() error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 按当前Sort排序获取所有工具ID
	rows, err := tx.Query(`SELECT id FROM nav_table ORDER BY sort ASC, id ASC`)
	if err != nil {
		return err
	}

	var toolIds []int
	for rows.Next() {
		var id int
		err := rows.Scan(&id)
		if err != nil {
			rows.Close()
			return err
		}
		toolIds = append(toolIds, id)
	}
	rows.Close()

	// 重新分配连续的Sort（ID保持不变）
	stmt, err := tx.Prepare(`UPDATE nav_table SET sort = ? WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for newIndex, toolId := range toolIds {
		newSort := newIndex + 1
		_, err = stmt.Exec(newSort, toolId)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// 删除工具后，将后续工具的Sort前移（不修改ID）
func ReorderToolsAfterDelete(deletedSort int) error {
	sql := `UPDATE nav_table SET sort = sort - 1 WHERE sort > ?`
	_, err := DB.Exec(sql, deletedSort)
	return err
}

// 工具排序变化时，调整受影响范围的工具Sort（不修改ID）
func ReorderToolsAfterSortChange(oldSort, newSort int) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if newSort < oldSort {
		// 前移：插入位置到原位置之间的工具Sort+1
		sql := `UPDATE nav_table SET sort = sort + 1 WHERE sort >= ? AND sort < ?`
		_, err = tx.Exec(sql, newSort, oldSort)
	} else if newSort > oldSort {
		// 后移：原位置到插入位置之间的工具Sort-1
		sql := `UPDATE nav_table SET sort = sort - 1 WHERE sort > ? AND sort <= ?`
		_, err = tx.Exec(sql, oldSort, newSort)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

// ==================== 大分类排序相关函数 ====================

// 删除大分类后，将后续大分类的Sort前移
func ReorderCatelogsAfterDelete(deletedSort int) error {
	sql := `UPDATE nav_catelog SET sort = sort - 1 WHERE sort > ?`
	_, err := DB.Exec(sql, deletedSort)
	return err
}

// 大分类排序变化时，调整受影响范围的大分类Sort
func ReorderCatelogsAfterSortChange(oldSort, newSort int) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if newSort < oldSort {
		// 前移：插入位置到原位置之间的大分类Sort+1
		sql := `UPDATE nav_catelog SET sort = sort + 1 WHERE sort >= ? AND sort < ?`
		_, err = tx.Exec(sql, newSort, oldSort)
	} else if newSort > oldSort {
		// 后移：原位置到插入位置之间的大分类Sort-1
		sql := `UPDATE nav_catelog SET sort = sort - 1 WHERE sort > ? AND sort <= ?`
		_, err = tx.Exec(sql, oldSort, newSort)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}

// ==================== 子分类排序相关函数 ====================

// 删除子分类后，将同一大分类下后续子分类的Sort前移
func ReorderSubCatelogsAfterDelete(catelogId int, deletedSort int) error {
	sql := `UPDATE nav_subcatelog SET sort = sort - 1 WHERE catelog_id = ? AND sort > ?`
	_, err := DB.Exec(sql, catelogId, deletedSort)
	return err
}

// 子分类排序变化时，调整同一大分类下受影响范围的子分类Sort
func ReorderSubCatelogsAfterSortChange(catelogId int, oldSort, newSort int) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if newSort < oldSort {
		// 前移：插入位置到原位置之间的子分类Sort+1
		sql := `UPDATE nav_subcatelog SET sort = sort + 1 WHERE catelog_id = ? AND sort >= ? AND sort < ?`
		_, err = tx.Exec(sql, catelogId, newSort, oldSort)
	} else if newSort > oldSort {
		// 后移：原位置到插入位置之间的子分类Sort-1
		sql := `UPDATE nav_subcatelog SET sort = sort - 1 WHERE catelog_id = ? AND sort > ? AND sort <= ?`
		_, err = tx.Exec(sql, catelogId, oldSort, newSort)
	}

	if err != nil {
		return err
	}

	return tx.Commit()
}
