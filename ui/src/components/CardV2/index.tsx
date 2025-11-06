import { useMemo, useState, useEffect } from "react";
import "./index.css";
import { getLogoUrl } from "../../utils/check";
import { getJumpTarget } from "../../utils/setting";

interface CardProps {
  title: any;
  url: any;
  des: any;
  logo: any;
  catelog: any;
  onClick: any;
  index: any;
  cardId?: number;
  isSearching: any;
  noImageMode: any;
  compactMode: any;
  hideCategoryTag?: boolean;
}

const Card: React.FC<CardProps> = ({ title, url, des, logo, catelog, onClick, index, cardId, isSearching, noImageMode, compactMode, hideCategoryTag }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  
  const imageSrc = useMemo(() => {
    return url === "admin" ? logo : getLogoUrl(logo);
  }, [logo, url]);
  
  // 当图片源变化时重置状态，并添加超时保护
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setShowLoading(true);
    
    // 10秒超时保护
    const timeout = setTimeout(() => {
      setShowLoading(false);
      console.warn('Image loading timeout:', imageSrc);
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [imageSrc]);
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    setShowLoading(false);
  };
  
  const handleImageError = () => {
    setImageError(true);
    setShowLoading(false);
  };
  
  const el = useMemo(() => {
    if (imageError) {
      return <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '20px',
        opacity: 0.6
      }}>🖼️</div>;
    }
    
    return (
      <>
        {showLoading && !imageLoaded && (
          <div className="card-loading-spinner"></div>
        )}
        <img 
          src={imageSrc}
          alt={title}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            opacity: imageLoaded ? 1 : 0.1,
            transition: 'opacity 0.3s ease'
          }}
        />
      </>
    );
  }, [imageSrc, title, imageLoaded, imageError, showLoading]);
  
  // 处理空分类，显示为"未分类"
  const displayCatelog = useMemo(() => {
    return catelog === null || catelog === undefined || catelog === "" || (typeof catelog === 'string' && catelog.trim() === "") 
      ? "未分类" 
      : catelog;
  }, [catelog]);
  
  // 判断是否是内置卡片
  const isBuiltInCard = useMemo(() => {
    return url === "admin" || 
           url === "toggleJumpTarget" || 
           (cardId !== undefined && cardId >= 8800880000);
  }, [url, cardId]);
  
  // 内置卡片不显示分类标签
  const shouldShowTag = !compactMode && !hideCategoryTag && !isBuiltInCard && catelog;
  
  const showNumIndex = index < 10 && isSearching;
  return (
    <a
      href={url === "toggleJumpTarget" ? undefined : url}
      onClick={() => {
        onClick();
      }}
      target={getJumpTarget() === "blank" ? "_blank" : "_self"}
      rel="noreferrer"
      className="card-box"
    >
      {showNumIndex && <span className="card-index">{index + 1}</span>}
      <div className={`card-content ${compactMode ? 'compact-mode' : ''}`}>
        {!noImageMode && (
          <div className="card-left">
            {el}
          </div>
        )}
        <div className="card-right">
          <div className="card-right-top">
            <span className="card-right-title" title={title}>{title}</span>
            {shouldShowTag && <span className="card-tag" title={displayCatelog}>{displayCatelog}</span>}
          </div>
          {!compactMode && <div className="card-right-bottom" title={des}>{des}</div>}
        </div>
      </div>
    </a>
  );
};

export default Card;
