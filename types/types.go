package types

// 默认是 0
type Setting struct {
	Id                   int    `json:"id"`
	Favicon              string `json:"favicon"`
	Title                string `json:"title"`
	GovRecord            string `json:"govRecord"`
	Logo192              string `json:"logo192"`
	Logo512              string `json:"logo512"`
	HideAdmin            bool   `json:"hideAdmin"`
	HideGithub           bool   `json:"hideGithub"`
	HideToggleJumpTarget bool   `json:"hideToggleJumpTarget"`
	JumpTargetBlank      bool   `json:"jumpTargetBlank"`
}

type Token struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Value    string `json:"value"`
	Disabled int    `json:"disabled"`
}

type User struct {
	Id       int    `json:"id"`
	Name     string `json:"name"`
	Password string `json:"password"`
}
type Img struct {
	Id    int    `json:"id"`
	Url   string `json:"url"`
	Value string `json:"value"`
}

// ToolCategory 表示一个书签的分类组合（大分类+子分类）
type ToolCategory struct {
	CatelogId    int    `json:"catelogId"`
	CatelogName  string `json:"catelogName"`
	SubCatelogId int    `json:"subCatelogId"`
	SubCatelogName string `json:"subCatelogName"`
}

type Tool struct {
	Id           int            `json:"id"`
	Name         string         `json:"name"`
	Url          string         `json:"url"`
	Logo         string         `json:"logo"`
	Catelog      string         `json:"catelog"`      // 保留用于兼容性
	SubCatelog   string         `json:"subCatelog"`   // 保留用于兼容性
	SubCatelogId int            `json:"subCatelogId"` // 保留用于兼容性
	Categories   []ToolCategory `json:"categories"`   // 新增：多分类支持
	Desc         string         `json:"desc"`
	Sort         int            `json:"sort"`
	Hide         bool           `json:"hide"`
}

type Catelog struct {
	Id        int    `json:"id"`
	Name      string `json:"name"`
	Sort      int    `json:"sort"`
	Hide      bool   `json:"hide"`
	ToolCount int    `json:"toolCount"` // 书签数量统计
}

// 子分类模型
type SubCatelog struct {
	Id        int    `json:"id"`
	Name      string `json:"name"`
	CatelogId int    `json:"catelogId"`
	Sort      int    `json:"sort"`
	Hide      bool   `json:"hide"`
	ToolCount int    `json:"toolCount"` // 书签数量统计
}

// 搜索引擎模型
type SearchEngine struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	BaseUrl     string `json:"baseUrl"`
	QueryParam  string `json:"queryParam"`
	Logo        string `json:"logo"`
	Sort        int    `json:"sort"`
	Enabled     bool   `json:"enabled"`
	IsDefault   bool   `json:"isDefault"`
}

// 网站配置模型
type SiteConfig struct {
	Id              int  `json:"id"`
	NoImageMode     bool `json:"noImageMode"`
	CompactMode     bool `json:"compactMode"`
	HideCategoryTag bool `json:"hideCategoryTag"`
}
