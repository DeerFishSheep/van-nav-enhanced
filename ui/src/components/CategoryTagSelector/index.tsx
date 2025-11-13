import React, { useState, useEffect } from 'react';
import { Tag, Select, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './index.css';

export interface ToolCategory {
  catelogId: number;
  catelogName: string;
  subCatelogId: number;
  subCatelogName: string;
}

interface CategoryTagSelectorProps {
  value?: ToolCategory[];
  onChange?: (value: ToolCategory[]) => void;
  catelogs: any[];
  subcatelogs: any[];
  onAddCatelog?: () => void;
  onAddSubCatelog?: () => void;
}

const CategoryTagSelector: React.FC<CategoryTagSelectorProps> = ({
  value = [],
  onChange,
  catelogs = [],
  subcatelogs = [],
  onAddCatelog,
  onAddSubCatelog,
}) => {
  const [selectedCategories, setSelectedCategories] = useState<ToolCategory[]>(value);
  const [tempCatelogId, setTempCatelogId] = useState<number | undefined>(undefined);
  const [tempSubCatelogId, setTempSubCatelogId] = useState<number | undefined>(undefined);

  // 当外部 value 变化时更新内部状态
  useEffect(() => {
    setSelectedCategories(value);
  }, [value]);

  // 获取当前选中大分类下的子分类列表
  const getAvailableSubCatelogs = () => {
    if (!tempCatelogId) return [];
    return subcatelogs.filter((sub: any) => sub.catelogId === tempCatelogId);
  };

  // 检查分类组合是否已存在
  const checkDuplicate = (catelogId: number, subCatelogId: number) => {
    return selectedCategories.some(
      (cat) => cat.catelogId === catelogId && cat.subCatelogId === subCatelogId
    );
  };

  // 添加分类
  const handleAdd = () => {
    if (!tempCatelogId) {
      message.warning('请先选择大分类');
      return;
    }

    const subId = tempSubCatelogId || 0;

    // 检查是否重复
    if (checkDuplicate(tempCatelogId, subId)) {
      message.warning('该分类组合已存在');
      return;
    }

    // 获取分类名称
    const catelog = catelogs.find((c: any) => c.id === tempCatelogId);
    const subcatelog = subId ? subcatelogs.find((s: any) => s.id === subId) : null;

    if (!catelog) {
      message.error('找不到大分类信息');
      return;
    }

    const newCategory: ToolCategory = {
      catelogId: tempCatelogId,
      catelogName: catelog.name,
      subCatelogId: subId,
      subCatelogName: subcatelog ? subcatelog.name : '',
    };

    const newCategories = [...selectedCategories, newCategory];
    setSelectedCategories(newCategories);
    onChange?.(newCategories);

    // 清空临时选择
    setTempCatelogId(undefined);
    setTempSubCatelogId(undefined);
  };

  // 删除分类
  const handleRemove = (index: number) => {
    if (selectedCategories.length === 1) {
      message.warning('至少需要保留一个分类');
      return;
    }

    const newCategories = selectedCategories.filter((_, i) => i !== index);
    setSelectedCategories(newCategories);
    onChange?.(newCategories);
  };

  // 渲染标签文本
  const renderTagText = (cat: ToolCategory) => {
    if (cat.subCatelogName) {
      return `${cat.catelogName} / ${cat.subCatelogName}`;
    }
    return cat.catelogName;
  };

  return (
    <div className="category-tag-selector">
      {/* 已选分类标签 */}
      <div className="selected-categories">
        {selectedCategories.length > 0 ? (
          <>
            {selectedCategories.map((cat, index) => (
              <Tag
                key={`${cat.catelogId}-${cat.subCatelogId}`}
                closable
                onClose={() => handleRemove(index)}
                className="category-tag"
              >
                {renderTagText(cat)}
              </Tag>
            ))}
          </>
        ) : (
          <div className="empty-hint">请在下方选择分类并添加</div>
        )}
      </div>

      {/* 添加分类区域 */}
      <div className="add-category-section">
        {/* 大分类选择 */}
        <div className="select-row">
          <Select
            placeholder="请选择大分类"
            value={tempCatelogId}
            onChange={(value) => {
              setTempCatelogId(value);
              setTempSubCatelogId(undefined); // 清空子分类选择
            }}
            options={catelogs.map((c: any) => ({
              label: c.name,
              value: c.id,
            }))}
            allowClear
          />
          {onAddCatelog && (
            <Button size="small" onClick={onAddCatelog}>
              + 新增
            </Button>
          )}
        </div>

        {/* 子分类选择 */}
        <div className="select-row">
          <Select
            placeholder={tempCatelogId ? "选择子分类（可选）" : "请先选择大分类"}
            value={tempSubCatelogId}
            onChange={setTempSubCatelogId}
            options={getAvailableSubCatelogs().map((s: any) => ({
              label: s.name,
              value: s.id,
            }))}
            disabled={!tempCatelogId}
            allowClear
          />
          {onAddSubCatelog && (
            <Button 
              size="small" 
              onClick={onAddSubCatelog}
              disabled={!tempCatelogId}
            >
              + 新增
            </Button>
          )}
        </div>

        {/* 添加到分类列表按钮 */}
        <Button
          block
          icon={<PlusOutlined />}
          onClick={handleAdd}
          disabled={!tempCatelogId}
          className="add-to-list-btn"
        >
          添加到分类列表
        </Button>
      </div>
    </div>
  );
};

export default CategoryTagSelector;

