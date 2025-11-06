import "./index.css";

interface SubCatelogSelectorProps {
  subCatelogs: Array<{id: number; name: string; sort: number}>;
  currentSubCatelogId: number | null;
  onSubCatelogChange: (id: number | null) => void;
}

const SubCatelogSelector: React.FC<SubCatelogSelectorProps> = ({
  subCatelogs,
  currentSubCatelogId,
  onSubCatelogChange,
}) => {
  if (!subCatelogs || subCatelogs.length === 0) {
    return null;
  }

  // 按 sort 排序
  const sortedSubCatelogs = [...subCatelogs].sort((a, b) => a.sort - b.sort);

  return (
    <div className="subcatelog-selector-wrapper">
      <div className="subcatelog-selector">
        {/* "全部"标签 */}
        <span
          className={`subcatelog-selector-tag ${currentSubCatelogId === null ? 'active' : ''}`}
          onClick={() => onSubCatelogChange(null)}
        >
          全部
        </span>
        
        {/* 子分类标签 */}
        {sortedSubCatelogs.map((subCatelog) => (
          <span
            key={subCatelog.id}
            className={`subcatelog-selector-tag ${currentSubCatelogId === subCatelog.id ? 'active' : ''}`}
            onClick={() => onSubCatelogChange(subCatelog.id)}
          >
            {subCatelog.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SubCatelogSelector;

