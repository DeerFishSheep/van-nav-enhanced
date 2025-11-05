import { useState } from "react";
import "./index.css";
import CardV2 from "../CardV2";

interface SubCatelogSectionProps {
  subCatelog: {
    id: number;
    name: string;
  };
  tools: any[];
  searchString: string;
  noImageMode: boolean;
  compactMode: boolean;
  onCardClick: () => void;
  onToolClick?: (url: string) => void;
}

const SubCatelogSection: React.FC<SubCatelogSectionProps> = ({
  subCatelog,
  tools,
  searchString,
  noImageMode,
  compactMode,
  onCardClick,
  onToolClick,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (tools.length === 0) {
    return null;
  }

  return (
    <div className="subcatelog-section">
      <div className="subcatelog-divider" onClick={toggleCollapse}>
        <div className="subcatelog-line"></div>
        <div className="subcatelog-title">
          <span>{subCatelog.name}</span>
          <span className="subcatelog-toggle">
            {isCollapsed ? "▼" : "▲"}
          </span>
        </div>
        <div className="subcatelog-line"></div>
      </div>
      {!isCollapsed && (
        <div className={`subcatelog-cards ${compactMode ? 'compact-grid' : ''}`}>
          {tools.map((item, index) => (
            <CardV2
              title={item.name}
              url={item.url}
              des={item.desc}
              logo={item.logo}
              key={item.id}
              catelog={item.catelog}
              index={index}
              isSearching={searchString.trim() !== ""}
              noImageMode={noImageMode}
              compactMode={compactMode}
              onClick={() => {
                onCardClick();
                if (onToolClick && item.url) {
                  onToolClick(item.url);
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubCatelogSection;

