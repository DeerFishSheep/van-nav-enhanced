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
import { generateSearchEngineCard } from "../../utils/serachEngine";
import { toggleJumpTarget } from "../../utils/setting";
import SubCatelogSection from "../SubCatelogSection";

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

  const filteredDataRef = useRef<any>([]);

  const showGithub = useMemo(() => {
    const hide = data?.setting?.hideGithub === true
    return !hide;
  }, [data])
  
  const showAdmin = useMemo(() => {
    const hide = data?.setting?.hideAdmin === true
    return !hide;
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
    // 管理后台不记录了
    if (tag !== "管理后台") {
      window.localStorage.setItem("tag", tag);
    }
    resetSearch(true);
  };

  const resetSearch = (notSetTag?: boolean) => {
    setVal("");
    setSearchString("");
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
        });
      return [...localResult, ...searchEngineCards]
    } else {
      return [...searchEngineCards];
    }
  }, [data, currTag, searchString, searchEngineCards]);

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

  // 判断是否需要按子分类分组显示
  const shouldGroupBySubCatelog = useMemo(() => {
    // 搜索时不分组
    if (searchString.trim() !== "") return false;
    // "全部工具"时不分组
    if (currTag === "全部工具") return false;
    // 选择具体大分类时，检查是否有子分类
    const currentCatelog = data?.catelogs?.find((c: any) => c === currTag);
    if (!currentCatelog) return false;
    
    // 查找该大分类对应的ID
    const catelogObj = data?.catelogs ? 
      (typeof currentCatelog === 'string' ? 
        data.tools?.find((t: any) => t.catelog === currentCatelog) : null) 
      : null;
    
    if (!catelogObj) return false;
    
    // 检查是否有子分类
    const hasSubCatelogs = data?.subcatelogs?.some((sub: any) => 
      data.tools?.some((t: any) => 
        t.catelog === currTag && t.subCatelogId === sub.id
      )
    );
    
    return hasSubCatelogs;
  }, [currTag, searchString, data]);

  const renderCardsV2 = useCallback(() => {
    // 如果需要按子分类分组显示
    if (shouldGroupBySubCatelog && data?.subcatelogs) {
      // 获取当前大分类下的所有子分类
      const subCatelogs = data.subcatelogs.filter((sub: any) => 
        filteredData.some((tool: any) => tool.subCatelogId === sub.id)
      ).sort((a: any, b: any) => a.sort - b.sort);

      // 没有分配子分类的书签
      const toolsWithoutSub = filteredData.filter((tool: any) => 
        !tool.subCatelogId || tool.subCatelogId === 0
      );

      return (
        <>
          {/* 未分配子分类的书签 */}
          {toolsWithoutSub.length > 0 && toolsWithoutSub.map((item, index) => (
            <CardV2
              title={item.name}
              url={item.url}
              des={item.desc}
              logo={item.logo}
              key={item.id}
              catelog={item.catelog}
              index={index}
              isSearching={false}
              noImageMode={data?.siteConfig?.noImageMode || false}
              compactMode={data?.siteConfig?.compactMode || false}
              onClick={() => {
                resetSearch();
                if (item.url === "toggleJumpTarget") {
                  toggleJumpTarget();
                  loadData();
                }
              }}
            />
          ))}
          
          {/* 按子分类分组显示 */}
          {subCatelogs.map((subCatelog: any) => {
            const toolsInSub = filteredData.filter((tool: any) => 
              tool.subCatelogId === subCatelog.id
            );
            
            return (
              <SubCatelogSection
                key={subCatelog.id}
                subCatelog={subCatelog}
                tools={toolsInSub}
                searchString={searchString}
                noImageMode={data?.siteConfig?.noImageMode || false}
                compactMode={data?.siteConfig?.compactMode || false}
                onCardClick={resetSearch}
                onToolClick={(url) => {
                  if (url === "toggleJumpTarget") {
                    toggleJumpTarget();
                    loadData();
                  }
                }}
              />
            );
          })}
        </>
      );
    }

    // 默认平铺显示（搜索时或全部工具时）
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
          isSearching={searchString.trim() !== ""}
          noImageMode={data?.siteConfig?.noImageMode || false}
          compactMode={data?.siteConfig?.compactMode || false}
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
  }, [filteredData, searchString, data?.siteConfig?.noImageMode, data?.siteConfig?.compactMode, shouldGroupBySubCatelog, data?.subcatelogs]);

  const onKeyEnter = (ev: KeyboardEvent) => {
    const cards = filteredDataRef.current;
    // 使用 keyCode 防止与中文输入冲突
    if (ev.keyCode === 13) {
      if (cards && cards.length) {
        window.open(cards[0]?.url, "_blank");
        resetSearch();
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


