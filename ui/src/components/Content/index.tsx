import "./index.css";
import CardV2 from "../CardV2";
import SearchBar from "../SearchBar";
import { Loading } from "../Loading";
import { Helmet } from "react-helmet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FetchList } from "../../utils/api";
import TagSelector from "../TagSelector";
import pinyin from "pinyin-match";
import GithubLink from "../GithubLink";
import DarkSwitch from "../DarkSwitch";
import AdminButton from "../AdminButton";
import { isLogin } from "../../utils/check";
import { generateSearchEngineCard, getDefaultSearchEngine } from "../../utils/serachEngine";
import { toggleJumpTarget } from "../../utils/setting";
import SubCatelogSelector from "../SubCatelogSelector";

const mutiSearch = (s, t) => {
  const source = (s as string).toLowerCase();
  const target = t.toLowerCase();
  const rawInclude = source.includes(target);
  const pinYinInlcude = Boolean(pinyin.match(source, target));
  return rawInclude || pinYinInlcude;
};

const Content = (props: any) => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [currTag, setCurrTag] = useState("全部工具");
  const [searchString, setSearchString] = useState("");
  const [val, setVal] = useState("");
  const [searchEngineCards, setSearchEngineCards] = useState<any[]>([]);
  const [currentSubCatelogId, setCurrentSubCatelogId] = useState<number | null>(null);

  const filteredDataRef = useRef<any>([]);

  const showGithub = useMemo(() => {
    const hide = data?.setting?.hideGithub === true
    return !hide;
  }, [data])
  
  const showAdmin = useMemo(() => {
    const hide = data?.setting?.hideAdmin === true
    return !hide;
  }, [data])
  
  const hideCategoryTag = useMemo(() => {
    return data?.siteConfig?.hideCategoryTag === true;
  }, [data])
  
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const r = await FetchList();
      setData(r);
      const tagInLocalStorage = window.localStorage.getItem("tag");
      if (tagInLocalStorage && tagInLocalStorage !== "") {
        if (r?.catelogs && r?.catelogs.includes(tagInLocalStorage)) {
          setCurrTag(tagInLocalStorage);
        }
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [setData, setLoading, setCurrTag]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 异步加载搜索引擎卡片
  useEffect(() => {
    const loadSearchEngineCards = async () => {
      try {
        const cards = await generateSearchEngineCard(searchString);
        setSearchEngineCards(cards);
      } catch (error) {
        console.error('加载搜索引擎卡片失败:', error);
        setSearchEngineCards([]);
      }
    };

    loadSearchEngineCards();
  }, [searchString]);

  const handleSetCurrTag = (tag: string) => {
    setCurrTag(tag);
    setCurrentSubCatelogId(null); // 切换大分类时重置子分类选择
    // 管理后台不记录了
    if (tag !== "管理后台") {
      window.localStorage.setItem("tag", tag);
    }
    resetSearch(true);
  };

  const resetSearch = (notSetTag?: boolean) => {
    setVal("");
    setSearchString("");
    setCurrentSubCatelogId(null); // 重置子分类选择
    const tagInLocalStorage = window.localStorage.getItem("tag");
    if (!notSetTag && tagInLocalStorage && tagInLocalStorage !== "" && tagInLocalStorage !== "管理后台") {
      setCurrTag(tagInLocalStorage);
    }
  };

  const handleSetSearch = (val: string) => {
    if (val !== "" && val) {
      setCurrTag("全部工具");
      setSearchString(val.trim());
    } else {
      resetSearch();
    }
  }

  const filteredData = useMemo(() => {
    if (data.tools) {
      const localResult = data.tools
        .filter((item: any) => {
          if (currTag === "全部工具") {
            return true;
          }
          return item.catelog === currTag;
        })
        .filter((item: any) => {
          if (searchString === "") {
            return true;
          }
          return (
            mutiSearch(item.name, searchString) ||
            mutiSearch(item.desc, searchString) ||
            mutiSearch(item.url, searchString)
          );
        })
        .filter((item: any) => {
          // 子分类过滤
          if (currentSubCatelogId === null) {
            return true; // "全部"显示所有
          }
          return item.subCatelogId === currentSubCatelogId;
        });
      return [...localResult, ...searchEngineCards]
    } else {
      return [...searchEngineCards];
    }
  }, [data, currTag, searchString, searchEngineCards, currentSubCatelogId]);

  useEffect(() => {
    filteredDataRef.current = filteredData
  }, [filteredData])

  useEffect(() => {
    if (searchString.trim() === "") {
      document.removeEventListener("keydown", onKeyEnter);
    } else {
      document.addEventListener("keydown", onKeyEnter);
    }
    return () => {
      document.removeEventListener("keydown", onKeyEnter);
    }
    // eslint-disable-next-line
  }, [searchString])

  // 获取当前大分类下的所有子分类
  const currentSubCatelogs = useMemo(() => {
    // 搜索时不显示子分类选择器
    if (searchString.trim() !== "") return [];
    // "全部工具"时不显示
    if (currTag === "全部工具") return [];
    // 没有子分类数据
    if (!data?.subcatelogs || !data?.tools) return [];
    
    // 获取当前大分类下的所有子分类
    const subCatelogs = data.subcatelogs.filter((sub: any) => 
      data.tools.some((t: any) => 
        t.catelog === currTag && t.subCatelogId === sub.id
      )
    );
    
    return subCatelogs;
  }, [currTag, searchString, data]);

  const renderCardsV2 = useCallback(() => {
    // 直接渲染过滤后的数据
    return filteredData.map((item, index) => {
      return (
        <CardV2
          title={item.name}
          url={item.url}
          des={item.desc}
          logo={item.logo}
          key={item.id}
          catelog={item.catelog}
          index={index}
          cardId={item.id}
          isSearching={searchString.trim() !== ""}
          noImageMode={data?.siteConfig?.noImageMode || false}
          compactMode={data?.siteConfig?.compactMode || false}
          hideCategoryTag={hideCategoryTag}
          onClick={() => {
            resetSearch();
            if (item.url === "toggleJumpTarget") {
              toggleJumpTarget();
              loadData();
            }
          }}
        />
      );
    });
    // eslint-disable-next-line
  }, [filteredData, searchString, data?.siteConfig?.noImageMode, data?.siteConfig?.compactMode, hideCategoryTag]);

  const onKeyEnter = async (ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;
    // 使用 keyCode 防止与中文输入冲突
    if (ev.keyCode === 13) {
      // 如果有搜索内容
      if (searchString.trim()) {
        // 过滤掉搜索引擎卡片，只看普通书签
        const normalCards = cards.filter(card => card.id < 8800880000);
        
        if (normalCards && normalCards.length > 0) {
          // 有普通书签结果，打开第一个
          window.open(normalCards[0]?.url, "_blank");
          resetSearch();
        } else {
          // 没有普通书签结果，使用默认搜索引擎
          try {
            const defaultEngine = await getDefaultSearchEngine();
            if (defaultEngine) {
              const separator = defaultEngine.baseUrl.includes('?') ? '&' : '?';
              const searchUrl = `${defaultEngine.baseUrl}${separator}${defaultEngine.queryParam}=${encodeURIComponent(searchString)}`;
              window.open(searchUrl, "_blank");
              resetSearch();
            }
          } catch (error) {
            console.error('获取默认搜索引擎失败:', error);
          }
        }
      } else {
        // 没有搜索内容，打开第一个卡片
        if (cards && cards.length > 0) {
          window.open(cards[0]?.url, "_blank");
          resetSearch();
        }
      }
    }
    // 如果按了数字键 + ctrl/meta，打开对应的卡片
    if (ev.ctrlKey || ev.metaKey) {
      const num = Number(ev.key);
      if (isNaN(num)) return;
      ev.preventDefault()
      const index = Number(ev.key) - 1;
      if (index >= 0 && index < cards.length) {
        window.open(cards[index]?.url, "_blank");
        resetSearch();
      }
    }

  };

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <link
          rel="icon"
          href={
            data?.setting?.favicon ?? "favicon.ico"
          }
        />
        <title>{data?.setting?.title ?? "Van Nav"}</title>
      </Helmet>
      <div className="topbar">
        <div className="content">
          <SearchBar
            searchString={val}
            setSearchText={(t) => {
              setVal(t);
              handleSetSearch(t);
            }}
          />
          <TagSelector
            tags={data?.catelogs ?? ["全部工具"]}
            currTag={currTag}
            onTagChange={handleSetCurrTag}
          />
        </div>
      </div>
      <div className="content-wraper">
        {/* 子分类选择器 */}
        {currentSubCatelogs.length > 0 && (
          <div className="subcatelog-selector-container">
            <SubCatelogSelector
              subCatelogs={currentSubCatelogs}
              currentSubCatelogId={currentSubCatelogId}
              onSubCatelogChange={setCurrentSubCatelogId}
            />
          </div>
        )}
        
        <div className={`content cards ${data?.siteConfig?.compactMode ? 'compact-grid' : ''}`}>
          {loading ? <Loading></Loading> : renderCardsV2()}
        </div>
      </div>
      <div className="record-wraper">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noreferrer">{data?.setting?.govRecord ?? ""}</a>
      </div>
      {showGithub && <GithubLink />}
      <DarkSwitch showGithub={showGithub} />
      {showAdmin && <AdminButton showGithub={showGithub} />}
    </>
  );
};

export default Content;


