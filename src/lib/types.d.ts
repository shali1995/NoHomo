/**
 * Types for the captured data in src/lib. There is no TypeScript in this
 * project and no type-checking step: this file exists so a reader — and the
 * editor's hover, go-to-definition and autocomplete — can see the real shape of
 * each data module. jsconfig.json points at it with checkJs:false, so nothing
 * here can fail a build, and no file had to be renamed or rewritten.
 *
 * Each declaration describes the shape of the captured data it annotates.
 *
 * Module map — the type to annotate each imported data module with:
 *   about.json          AboutCardData
 *   aboutLinks.json     AboutLinkRow[]
 *   alerts.json         AlertRow[]
 *   badges.json         BadgesData
 *   chartOverlay.json   ChartMarker[]
 *   chartToolbar.json   ChartToolbarData
 *   discovery.json      DiscoveryRow[]
 *   feed.json           FeedPanelData
 *   leaderboard.json    LeaderboardData
 *   panelButtons.json   PanelButton[]
 *   panelList.json      PanelListData
 *   panelTabs.json      PanelTab[]
 *   profileBody.json    ProfileBodyData
 *   profileHeader.json  ProfileHeaderData
 *   tableTabs.json      TableTab[]
 *   tableToggles.json   TableToggle[]
 *   ticker.json         TickerItem[]
 *   token.js            TokenData
 *   tokenIdentity.json  TokenIdentityData
 *   tokenStats.json     TokenMarketStats[]
 *   tokenSwaps.json     TokenSwapsData
 *   tokenThesis.json    ThesisRow[]
 *   tradePopup.json     TradePopupData
 *   trades.json         TradeRow[]
 *   walletWidget.json   WalletWidgetData
 */

/* ------------------------------------------------------------------ *
 * Whole-module shapes
 * ------------------------------------------------------------------ */

/** src/lib/feed.json — feed panel. The 12 rendered activity rows. */
export interface FeedPanelData {
  container: {
    outerClasses: string;
    outerStyle: string;
    legendClasses: string;
    legendStyle: string;
    spacerStyle: string;
    spacerClasses: string;
  };
  rows: FeedRow[];
  sort: {
    navClasses: string;
    innerClasses: string;
    ulClasses: string;
    liClasses: string;
    buttonClasses: string;
    spanText: string;
  };
  sortRowClasses: string;
  bodyWrapper: { classes: string; relativeClasses: string; fadeClasses: string };
}

/** src/lib/leaderboard.json — leaderboard. Clans card, window switch and the 150 ranked rows. */
export interface LeaderboardData {
  clans: {
    title: string;
    badgeLabel: string;
    badgeClasses: string;
    buttonClasses: string;
    chevronClasses: string;
    chevronOpenClasses: string;
    viewAllLabel: string;
    viewAllClasses: string;
    cards: LeaderboardClanCard[];
  };
  windows: { label: string; classes: string }[];
  activeWindowClasses: string;
  inactiveWindowClasses: string;
  shareClasses: string;
  yourRank: {
    label: string;
    avatarStyle: string;
    eyesSrc: string;
    hash: string;
    rank: string;
    pnlLabel: string;
    pnlColor: string;
    pnlSign: string;
    pnlValue: string;
  };
  rows: LeaderboardRow[];
}

/** The positions card's own chrome is written into its components now; the capture's
 *  positions.json is gone with the static card. */
export interface PositionsCardData {
  header: string;
  titleButton: string;
  titleDiv: string;
  segmented: string;
  segments: { classes: string; text: string; dot: string | null }[];
  scroller: string;
  scrollerStyle: string;
  empty: { classes: string; text: string };
}

/** src/lib/profileBody.json — profile and profile (other). Keyed by profile handle. */
export interface ProfileBodyData {
  The__Solstice: ProfileBodyUser;
  RareTotalFowl: ProfileBodyUser;
}

/** src/lib/profileHeader.json — profile and profile (other). Keyed by profile handle. */
export interface ProfileHeaderData {
  The__Solstice: ProfileHeader;
  RareTotalFowl: ProfileHeader;
}

/** src/lib/tokenSwaps.json — token page. The swaps table chrome plus its 43 rows. */
export interface TokenSwapsData {
  panelClasses: string;
  innerClasses: string;
  relativeClasses: string;
  scrollClasses: string;
  scrollStyle: string;
  legendClasses: string;
  legendStyle: string;
  stickyStyle: string;
  headClasses: string;
  headCells: { classes: string; text: string }[];
  bodyClasses: string;
  rowClasses: string;
  traderCellClasses: string;
  avatar: { classes: string; style: string };
  avatarImgClasses: string;
  nameClasses: string;
  badgeClasses: string;
  amountClasses: string;
  mcapClasses: string;
  timeCellClasses: string;
  timeClasses: string;
  rows: SwapRow[];
}

/** src/lib/tradePopup.json — trade popup and trade popup (other). Keyed by trade id. */
export interface TradePopupData {
  defaultTradeId: string;
  trades: Record<string, TradePopupTrade>;
}

/** src/lib/walletWidget.json — token page. The TopBar wallet widget. */
export interface WalletWidgetData {
  nav: string;
  ul: string;
  items: WalletWidgetItem[];
}

/** src/lib/about.json — token page. The About card in the left panel. */
export interface AboutCardData {
  title: string;
  description: string;
  stats: AboutStat[];
  bars: AboutBar[];
  links: AboutLink[];
  details: AboutDetail[];
  viewMore: { classes: string };
}

/** src/lib/badges.json — profile and profile (other). Verified badge wrappers. */
export interface BadgesData {
  wrapperClasses: string;
  wrapperClasses2: string;
  headerButton: string;
}

/** src/lib/chartToolbar.json — token page. The chart panel's toolbar. */
export interface ChartToolbarData {
  classes: string;
  title: { classes: string; text: string };
  divider: string;
  toggles: { label: string; labelClasses: string; buttonClasses: string; buttonStyle: string }[];
  minSize: { classes: string };
}

/** src/lib/panelList.json — token page. The left panel's virtualised list geometry. */
export interface PanelListData {
  containerStyle: string;
  spacerStyle: string;
  rows: { absStyle: string; href: string }[];
}

/** src/lib/tokenIdentity.json — token page. The header's identity icon, chain badge and socials. */
export interface TokenIdentityData {
  chainImg: string;
  chainImgClass: string;
  chainWidth: string;
  chainHeight: string;
  socials: { href: string; classes: string; svgClass: string; width: string; height: string; icon: string }[];
}

/* ------------------------------------------------------------------ *
 * Row types
 * ------------------------------------------------------------------ */

/**
 * One swap row of the token page's swaps table — src/lib/tokenSwaps.json (token page).
 * `avatar` is an image src, `action` is "Buy" or "Sell" (styled by actionStyle).
 */
export interface SwapRow {
  /** The trader's wallet: what the trader hover card reads. */
  walletAddress: string;
  chain: string;
  /** The label's own handle, when the labels carry one. */
  handle: string | null;
  avatar: string;
  name: string;
  action: string;
  actionStyle: string;
  amount: string;
  mcap: string;
  time: string;
  timeTitle: string;
}

/**
 * One thesis card — src/lib/tokenThesis.json (token page), 49 rows, all type "thesis".
 * feed.json's thesis rows are the same card plus `top` (see FeedThesisRow).
 */
export interface ThesisRow {
  type: "thesis";
  classes: string;
  avatar: FeedAvatar;
  name: FeedDisplayName;
  badge: FeedBadge;
  time: FeedTimestamp;
  tokenLogo: FeedTokenLogo;
  ticker: FeedTicker;
  tickerCell: FeedTickerCell;
  amount: FeedAmountCell[];
  quoteText: string;
  quote: FeedQuote;
  likes: FeedLikes;
  wrapperClasses: string;
}

/** One ranked trader — src/lib/leaderboard.json (leaderboard). 150 rows. */
export interface LeaderboardRow {
  href: string;
  /** 1-3 for the podium, null for everybody else (147 of 150 rows). */
  medal: number | null;
  /** Set only where a rank is shown instead of a medal (3 of 150). */
  rankText: string | null;
  /** Null on 14 rows, which fall back to the eyes placeholder. */
  avatarImg: string | null;
  /** Placeholder background colour, null on 136 rows. */
  avatarBg: string | null;
  name: string;
  /** The clan chip, null on 99 of 150 rows. */
  clan: { alt: string; title: string; src: string } | null;
  handle: string;
  pnlSign: string;
  pnlValue: string;
  pnlColor: string;
  /** The small token logos stacked on the row; empty on some rows. */
  tokens: { src: string; marginLeft: string }[];
  /** "+N" overflow bubble text, null on 7 rows. */
  overflow: string | null;
}

/** One clan card in the leaderboard's clans strip — src/lib/leaderboard.json (leaderboard). */
export interface LeaderboardClanCard {
  href: string;
  name: string;
  img: string;
  /** 1-3 for a medal, null on 3 of the 6 cards. */
  medal: number | null;
  members: string;
  pnlColor: string;
  pnlSign: string;
  pnlValue: string;
}

/** One token row of the left panel's discovery list — src/lib/discovery.json (token page). 24 rows. */
export interface DiscoveryRow {
  href: string;
  initial: string;
  symbol: string;
  pricePrefix: string;
  priceSuffix: string;
  /** A second price line; null on 23 of the 24 rows. */
  sub: string | null;
  mcap: string;
  mcapHiddenColor: string;
  dir: string;
  change: string;
  color: string;
  absStyle: string;
  /** True only on the token the page is showing. */
  active?: boolean;
  /** Token logo; present on 22 of the 24 rows. */
  logo?: string;
  logoStyle?: string;
  /** The mcap string as revealed on hover; present on 1 row. */
  hiddenText?: string;
  /** Badge SVG geometry; present on the 4 rows that carry a badge. */
  badgeStyle?: string;
  badgeSvgStyle?: string;
  badgePath?: string;
  badgeFill?: string;
}

/**
 * One row of the Bonding and Graduated pills — src/lib/api/trenches.svelte.js. It is the
 * discovery row with the two fields those views swap in: volume on the second line, and
 * the bonding progress where the change sits.
 */
export interface TrenchRow extends DiscoveryRow {
  /** 24h volume: `$54.6K`, printed with `Vol` after it. */
  volume: string;
  /** Token age chip, `1h`. */
  age: string;
  ageTitle: string;
  /** The launchpad badge on the logo, from the capture's own asset path. */
  launchpadLogo: string;
  launchpadName: string;
  /** Bonding progress 0-100, or null on Graduated, which shows the change instead. */
  bondedPct: number | null;
}

/**
 * One row of the token page's traders table — src/lib/trades.json (token page). 43 rows.
 * Always exactly five cells, each with its own key set: see TradeCell.
 */
export interface TradeRow {
  cells: [TradeTraderCell, TradeValueCell, TradePnlCell, TradeMarketCell, TradeThesisCell];
}

/** A position row from profileBody.json. Narrow with `"entry" in row` (or positions.variant). */
export type PositionRow = PositionOpenRow | PositionClosedRow;

/** An open position — src/lib/profileBody.json (profile). 50 rows, positions.variant === "open". */
export interface PositionOpenRow {
  img: string;
  verified: boolean;
  ticker: string;
  /** Holding amount under the ticker, e.g. "20.8MSTONK". */
  sub: string;
  /** Market cap tag next to the ticker, e.g. "$317.3M". */
  mcapTag: string;
  mcap: string;
  price: PositionPrice;
  value: string;
  amount: string;
  up: boolean;
  /** Percentage shown in the mobile column. */
  mobPct: string;
  sign: string;
  pnl: string;
  pct: string;
  /** Dimmed row (dust); present on 1 of the 50 rows. */
  dim?: boolean;
}

/** A closed position — src/lib/profileBody.json (profile (other)). 1 row, positions.variant === "closed". */
export interface PositionClosedRow {
  img: string;
  verified: boolean;
  ticker: string;
  invested: string;
  time: string;
  timeTitle: string;
  entry: string;
  exit: string;
  up: boolean;
  sign: string;
  pnl: string;
  pct: string;
}

/** Entry price of an open position; sub/suffix split the price across spans on 17 of 50 rows. */
export interface PositionPrice {
  prefix: string;
  sub?: string;
  suffix?: string;
}

/** One swap row of a profile's swaps list — src/lib/profileBody.json (profile / profile (other)). */
export interface ProfileSwapRow {
  /** Virtualised offset fields; present on the profile view, absent on profile (other). */
  pos?: number;
  setsize?: number;
  index?: number;
  y?: string;
  img: string;
  verified: boolean;
  ticker: string;
  action: string;
  up: boolean;
  amount: string;
  mcap: string;
  time: string;
  timeTitle: string;
}

/* ------------------------------------------------------------------ *
 * The three feed rows (feed.json), discriminated on `type`
 * ------------------------------------------------------------------ */

/**
 * One row of the activity feed — src/lib/feed.json (feed panel).
 * Discriminated on `type`, which is what FeedRow.svelte branches on.
 */
export type FeedRow = FeedSwapRow | FeedThesisRow | FeedAnnouncementRow;

/** A Buy/Sell feed row — src/lib/feed.json (feed panel). 8 of the 12 rows. */
export interface FeedSwapRow {
  type: "swap";
  href: string;
  avatar: FeedAvatar;
  name: FeedDisplayName;
  badge: FeedBadge;
  time: FeedTimestamp;
  tokenLogo: FeedTokenLogo;
  /** The inline price cells that follow the token logo. */
  line: FeedLineCell[];
  top: number;
  wrapperClasses: string;
}

/** A thesis feed row — src/lib/feed.json (feed panel). 3 of the 12 rows: a ThesisRow plus its offset. */
export interface FeedThesisRow extends ThesisRow {
  top: number;
}

/** The pinned fomo announcement — src/lib/feed.json (feed panel). 1 of the 12 rows. */
export interface FeedAnnouncementRow {
  type: "announce";
  classes: string;
  avatar: FeedAnnounceAvatar;
  buttonClasses: string;
  nameClasses: string;
  /** The announcement's author is a plain string, not the {classes, text} object of the other rows. */
  name: string;
  time: FeedTimestamp;
  pinned: { classes: string; text: string };
  chevron: { classes: string };
  cardClasses: string;
  titleClasses: string;
  titleInner: string;
  title: string;
  bodyClasses: string;
  body: FeedBodySegment[];
  showMore: { classes: string; text: string };
  reaction: { wrapperClasses: string; classes: string; svgClasses: string; spanClasses: string; count: string };
  top: number;
  wrapperClasses: string;
}

/* ------------------------------------------------------------------ *
 * Shared feed pieces
 * ------------------------------------------------------------------ */

/** An avatar; swap/thesis rows use `eyes`+imgSrc, the announcement uses wrapper+img. */
export interface FeedAvatar {
  /** True when the avatar is the generated fomo-eyes placeholder. */
  eyes?: boolean;
  classes?: string;
  style?: string;
  imgClasses?: string;
  imgSrc?: string;
  wrapperClasses?: string;
  wrapperStyle?: string;
  img?: FeedAvatarImage;
}

/** The announcement avatar's <img>, captured with its attributes. */
export interface FeedAvatarImage {
  src: string;
  classes: string;
  style: string;
}

/** A trader handle with its element classes. */
export interface FeedDisplayName {
  classes: string;
  innerClasses: string;
  text: string;
}

/** The Buy/Sell/Thesis pill on a feed row. */
export interface FeedBadge {
  classes: string;
  style: string;
  text: string;
}

/** The relative timestamp at the right of a feed row. */
export interface FeedTimestamp {
  classes: string;
  text: string;
  title: string;
}

/** The token logo of a swap/thesis row, with an optional chain badge. */
export interface FeedTokenLogo {
  wrapperClasses: string;
  wrapperStyle: string;
  img: FeedAvatarImage;
  badge: FeedLogoBadge | null;
}

/**
 * The tokenLogo's chain badge — only its box and the svg's inline size are data;
 * the drawing itself is src/icons/chain-badge.svelte.
 */
export interface FeedLogoBadge {
  classes: string;
  style: string;
  svgStyle: string;
}

/** The ticker cell of a thesis row: the ticker text plus an optional chain badge. */
export interface FeedTickerCell {
  classes: string;
  badge: FeedTickerBadge | null;
}

/**
 * The tickerCell's chain badge — only its box and the svg's width/height are data;
 * the drawing itself is src/icons/chain-badge.svelte.
 */
export interface FeedTickerBadge {
  classes: string;
  style: string;
  width: string;
  height: string;
}

/** The token ticker of a thesis row, with the attributes it was captured with. */
export interface FeedTicker {
  classes: string;
  text: string;
  attrs: { role: string; tabindex: string };
}

/**
 * One inline price cell of a feed row — discriminated on `kind`, which is what
 * FeedRow.svelte branches on: "pct" carries the arrow/value spans, "dot" is the
 * pulsing dot, "text" is a plain value.
 */
export type FeedAmountCell = FeedAmountTextCell | FeedAmountDotCell | FeedAmountPctCell;

/** A plain value cell of a feed row's amount strip (`kind: "text"`). */
export interface FeedAmountTextCell {
  kind: "text";
  tag: string;
  classes: string;
  style: string;
  text: string;
}

/** The pulsing dot between amount cells (`kind: "dot"`). */
export interface FeedAmountDotCell {
  kind: "dot";
  tag: string;
  classes: string;
  style: string;
  text: string;
}

/** The "(▼ 48.31%)" cell of a feed row's amount strip (`kind: "pct"`). */
export interface FeedAmountPctCell {
  kind: "pct";
  tag: string;
  classes: string;
  style: string;
  openSpanClasses: string;
  openText: string;
  innerClasses: string;
  innerStyle: string;
  arrow: string;
  arrowClasses: string;
  arrowStyle: string;
  value: string;
  valueClasses: string;
  valueStyle: string;
  closeSpanClasses: string;
  closeText: string;
}

/** The quoted thesis excerpt of a thesis feed row. */
export interface FeedQuote {
  classes: string;
  bar: { classes: string; style: string };
  bodyClasses: string;
}

/** The like counter of a thesis feed row. */
export interface FeedLikes {
  wrapperClasses: string;
  innerClasses: string;
  spanClasses: string;
  count: string;
}

/** One inline cell on a swap row's price line. */
export interface FeedLineCell {
  classes: string;
  style: string;
  text: string;
}

/** One segment of the announcement body (a link or a text span). */
export interface FeedBodySegment {
  tag: string;
  classes: string;
  href: string;
  text: string;
}

/* ------------------------------------------------------------------ *
 * Profile body (profileBody.json)
 * ------------------------------------------------------------------ */

/** The rail column of a profile — src/lib/profileBody.json (profile / profile (other)). */
export type ProfileRail = ProfileRailSend | ProfileRailFollow;

/** The trade rail on your own profile (kind "send") — src/lib/profileBody.json (profile). */
export interface ProfileRailSend {
  kind: "send";
  classes: string;
  user: { handle: string; img: string };
  amountHint: string;
  cashValue: string;
}

/** The "follow top traders" rail on somebody else's profile (kind "follow"). */
export interface ProfileRailFollow {
  kind: "follow";
  classes: string;
  title: string;
  traders: { href: string; img: string; color: string | null; name: string; handle: string }[];
}

/**
 * Everything under one profile route — src/lib/profileBody.json
 * (profile and profile (other)).
 */
export interface ProfileBodyUser {
  rail: ProfileRail;
  portfolio: {
    valueInt: string;
    valueFrac: string;
    change: string;
    changeColor: string;
    /** Inline style placing the segmented control's pill. */
    pillStyle: string;
    tabs: { label: string; on: boolean }[];
    chartStyle: string;
  };
  cash: { label: string; value: string; actions: { label: string; classes: string }[] };
  positions: {
    title: string;
    count: string;
    sortLabel: string;
    sortIcon: string;
    openPill: { classes: string; dot: string | null };
    closedPill: { classes: string; dot: string | null };
    headCols: string[];
    /** Either two responsive spans (profile) or one plain label (profile (other)). */
    headRight: { spans?: { classes: string; text: string }[]; text?: string };
    /** "open" or "closed" — decides which branch of PositionRow the rows are. */
    variant: string;
    rows: PositionRow[];
  };
  /** The pinned thesis card; null on profile (other). */
  thesis: ProfileBodyThesis | null;
  swaps: {
    tabs: { label: string; on: boolean }[];
    listHeight: string;
    sentinel: boolean;
    rows: ProfileSwapRow[];
  };
}

/** The pinned thesis card at the top of a profile — src/lib/profileBody.json (profile). */
export interface ProfileBodyThesis {
  img: string;
  verified: boolean;
  ticker: string;
  badges: { classes: string; text: string }[];
  text: string;
  likes: string;
  newer: string;
}

/* ------------------------------------------------------------------ *
 * Profile header (profileHeader.json)
 * ------------------------------------------------------------------ */

/** The profile banner, avatar, name, stats, actions, bio, chips and token strip. */
export interface ProfileHeader {
  banner: { classes: string; style: string; action: ProfileBannerAction | null };
  avatar: { kind: string; classes: string; style: string; imgClasses: string; imgSrc: string };
  name: { classes: string; innerClasses: string; text: string };
  /** The clan chip; null on profile (other). */
  clan: ProfileHeaderClan | null;
  handle: { classes: string; text: string; wrapper: string };
  statsWrapper: { classes: string };
  /** Either a stat or a divider between two of them. */
  stats: ProfileHeaderStat[];
  actionsWrapper: string;
  actions: ProfileHeaderAction[];
  /** The bio block; null on profile (other). */
  bio: { classes: string; text: string } | null;
  chipsWrapper: string;
  chips: { classes: string; icon: string; spanClasses: string; text: string }[];
  /** The token strip under the header; null on profile (other). */
  strip: ProfileStrip | null;
}

/** The clan chip in a profile header. */
export interface ProfileHeaderClan {
  href: string;
  classes: string;
  label: string;
  src: string;
  imgClasses: string;
  imgStyle: string;
}

/** A header stat, or a vertical divider: branch on `"divider" in stat`. */
export type ProfileHeaderStat =
  | { classes: string; valueClasses: string; value: string; labelClasses: string; label: string; divider?: undefined }
  | { divider: string };

/** One header action button; `icon` is null when the action is text-only. */
export interface ProfileHeaderAction {
  classes: string;
  text: string;
  icon: string | null;
  spanClasses: string | null;
  label: string;
}

/** The "add a banner" button, null on your own profile. */
export interface ProfileBannerAction {
  classes: string;
  ariaLabel: string;
}

/** The horizontally scrolled token strip under a profile header. */
export interface ProfileStrip {
  outer: string;
  classes: string;
  cards: ProfileStripCard[];
}

/** One token card in the profile's strip. */
export interface ProfileStripCard {
  classes: string;
  badgeClasses: string;
  badgeText: string;
  rowClasses: string;
  tokenWrapperClasses: string;
  tokenWrapperStyle: string;
  img: string;
  imgClasses: string;
  imgStyle: string;
  badgePosClasses: string;
  badgePosStyle: string;
  badgeSvgStyle: string;
  valueClasses: string;
  valueStyle: string;
  value: { text: string; classes: string; style: string }[];
  pctClasses: string;
  pct: ProfileStripPctPart[];
}

/** One part of a strip card's percentage, with its own nested spans. */
export interface ProfileStripPctPart {
  tag: string;
  text: string;
  classes: string;
  style: string;
  kids: { text: string; classes: string; style: string }[];
}

/* ------------------------------------------------------------------ *
 * Trades table (trades.json) — one interface per column, in order
 * ------------------------------------------------------------------ */

/** The trader column of the token page's trades table — src/lib/trades.json (token page). */
export interface TradeTraderCell {
  /** [name, "5d 17h avg. hold"]. */
  texts: string[];
  avatar: string | null;
  classes: string;
  /** Placeholder avatar (eyes) on 10 of the 43 rows. */
  avatarEyes?: boolean;
  avatarBg?: string;
  /** The token chip on the trader; present on 6 rows. */
  tokenAvatar?: string;
  tokenAvatarAlt?: string;
  tokenAvatarClass?: string;
  tokenAvatarStyle?: string;
  tokenAvatarTitle?: string;
}

/** The value column — src/lib/trades.json (token page). `texts` is [value, "18.5MStamp"]. */
export interface TradeValueCell {
  texts: string[];
  avatar: string | null;
  classes: string;
}

/** The PnL column — src/lib/trades.json (token page). `texts` is [sign, pnl, arrow, pct]. */
export interface TradePnlCell {
  texts: string[];
  avatar: string | null;
  classes: string;
}

/** The market-cap column — src/lib/trades.json (token page). */
export interface TradeMarketCell {
  texts: string[];
  avatar: string | null;
  classes: string;
  /** Split price spans on the one row whose price overflows ("$0.0" + "4" + "6486"). */
  pricePrefix?: string;
  priceSub?: string;
  priceSuffix?: string;
}

/** The thesis column — src/lib/trades.json (token page). */
export interface TradeThesisCell {
  texts: string[];
  avatar: string | null;
  classes: string;
  /** Link segments inside the thesis; present on 1 row. */
  thesisSegments?: TradeThesisSegment[];
}

/** A text or link segment of a trade's thesis cell. */
export interface TradeThesisSegment {
  type: string;
  text: string;
  /** Only on `type: "link"` segments. */
  href?: string;
  classes?: string;
}

/* ------------------------------------------------------------------ *
 * Trade popup (tradePopup.json)
 * ------------------------------------------------------------------ */

/** One trade's popup — src/lib/tradePopup.json (trade popup / trade popup (other)). */
export interface TradePopupTrade {
  profile: TradePopupProfile;
  token: TradePopupToken;
  chart: TradePopupChart;
  /** The comment list; null when the trade has none (trade popup (other)). */
  comments: TradePopupComment[] | null;
  summary: TradePopupSummary;
  transactions: TradePopupTransactions;
}

/** The trader line at the top of the popup. */
export interface TradePopupProfile {
  href: string;
  name: string;
  /** "image" or "placeholder" — which of avatarSrc / placeholderImgSrc is used. */
  avatarKind: string;
  avatarSrc: string;
  avatarClasses: string;
  avatarStyle: string;
  placeholderStyle: string;
  placeholderImgClasses: string;
  placeholderImgSrc: string;
  showFollow: boolean;
}

/** The token header of the popup. */
export interface TradePopupToken {
  href: string;
  symbol: string;
  /** Truncated on purpose, e.g. "4UHmZG...yvRbYB". */
  address: string;
  imageSrc: string;
  imageStyle: string;
  /** Position of the network badge; null when the token has no badge. */
  imageBadge: { style: string } | null;
  statusLabel: string;
  statusClasses: string;
  statusDotStyle: string | null;
  network: string;
  links: string[];
  marketCap: string;
  changeArrow: string;
  changeArrowStyle: string;
  changeValue: string;
  changeValueStyle: string;
}

/** The popup's chart: its timeframe tabs and the buy/sell markers. */
export interface TradePopupChart {
  indicatorStyle: string;
  tabs: { label: string; selected: boolean }[];
  /**
   * A pin is either a buy/sell letter (27 of the 48) or a trader avatar (21),
   * so narrow on `"avatar" in marker`.
   */
  markers: (
    | { l: number; t: number; letter: string; tone: string }
    | { l: number; t: number; avatar: string }
  )[];
}

/** One comment on a trade. */
export interface TradePopupComment {
  ago: string;
  title: string;
  text: string;
  /** The attached link, or null. */
  link: string | null;
  likes: string;
  thesis: boolean;
  first: boolean;
  last: boolean;
}

/** The PnL summary block; value/amount are null for a closed trade. */
export interface TradePopupSummary {
  /** "open" or "closed". */
  layout: string;
  value: string | null;
  pnlSign: string;
  pnlValue: string;
  pnlStyle: string;
  amount: string | null;
  changeArrow: string;
  changeArrowStyle: string;
  changeValue: string;
  changeValueStyle: string;
  stats: { label: string; value: string }[];
}

/** The transactions list of the popup. */
export interface TradePopupTransactions {
  count: number;
  /** The Radix popover id, random per page load. */
  popoverControls: string;
  /** The "invested" note; null when there is none. */
  investedNote: string | null;
  rows: { action: string; amount: string; mcap: string; date: string }[];
  /** Pagination slots; present on some trades only. */
  pages?: unknown[];
}

/* ------------------------------------------------------------------ *
 * Wallet widget (walletWidget.json)
 * ------------------------------------------------------------------ */

/** One wallet item in the TopBar: the cash balance, or the profile chip. */
export interface WalletWidgetItem {
  li: string;
  button: string;
  /** The wrapping anchor's classes; null on the cash item. */
  anchor: string | null;
  href: string | null;
  img: string | null;
  imgHolder: string | null;
  imgHolderStyle: string | null;
  /** Cash item only: the "Deposit more" button. */
  depositButton?: string;
  depositText?: string;
  /** Cash item only: the divider class before the deposit button. */
  cashDiv?: string;
  /** Profile item only: the balance-change line. */
  changeLine?: string;
  changeLineStyle?: string;
  changeParts?: WalletChangePart[];
}

/** One part of a wallet balance change ("+$0" or "24h"), with its own inner spans. */
export interface WalletChangePart {
  tag: string;
  classes: string;
  style: string;
  text: string;
  /** Empty for parts that are a single text node. */
  inner: { tag: string; classes: string; style: string; text: string }[];
}

/* ------------------------------------------------------------------ *
 * About card (about.json / aboutLinks.json)
 * ------------------------------------------------------------------ */

/** One headline stat of the about card. */
export interface AboutStat {
  label: string;
  value: string;
  classes: string;
  /** Always null in the capture. */
  arrow: null;
  /** Always null in the capture. */
  color: null;
  valueChildren: { tag: string; classes: string; style: string; text: string }[];
  valueLine: string;
  valueLineStyle: string;
}

/** One bar of the about card's distribution ("top 10 holding" etc.). */
export interface AboutBar {
  label: string;
  bar: { classes: string; style: string }[];
  parts: { text: string; classes: string; style: string }[];
  labels: { value: string; unit: string }[];
}

/** One link in the about card's link row. */
export interface AboutLink {
  href: string;
  text: string;
  classes: string;
  /** The icon name (see src/icons). */
  svg: string;
}

/** One collapsible detail block of the about card. */
export interface AboutDetail {
  classes: string;
  parts: AboutDetailPart[];
}

/** One part of a detail block: text, plus an optional badge or icon. */
export interface AboutDetailPart {
  tag: string;
  classes: string;
  text: string;
  /** Badge label; null on 14 of the 15 parts. */
  badge: string | null;
  /** Badge image src; null on 14 of the 15 parts. */
  badgeImg: string | null;
  /** Always null in the capture. */
  svg: null;
  svgClass: string | null;
  spanClasses: string | null;
  spanText: string;
  /** Icon name on 2 of the 15 parts. */
  icon?: string;
  badgeImgClass?: string;
  badgeImgWidth?: string;
  badgeImgHeight?: string;
  badgeStyle?: string;
}

/** One row of src/lib/aboutLinks.json — token page. The footer link row. */
export interface AboutLinkRow {
  href: string;
  classes: string;
  text: string;
  /** The icon name (see src/icons). */
  icon: string;
}

/* ------------------------------------------------------------------ *
 * Chrome and small lists
 * ------------------------------------------------------------------ */

/** One row of src/lib/alerts.json — token page. The alerts dropdown. */
export interface AlertRow {
  href: string;
  avatar: string;
  /** Placeholder background colour; null on 4 of the 9 rows. */
  avatarBg: string | null;
  name: string;
  handle: string;
  buttonClass: string;
  buttonText: string;
  avatarEyes: boolean;
}

/** One entry of src/lib/chartOverlay.json — token page. Avatar stacks drawn over the chart. */
export interface ChartMarker {
  transform: string;
  /** "hidden" or "visible". */
  visibility: string;
  stacked: boolean;
  layers: {
    src: string | null;
    /** Layer background colour; null on most layers. */
    bg: string | null;
    eyes: boolean;
    /** The "+N" overflow count; null on most layers. */
    count: string | null;
    marginTop: string | null;
    zIndex: string | null;
  }[];
}

/** One entry of src/lib/panelButtons.json — token page. The split view buttons. */
export interface PanelButton {
  label: string;
  classes: string;
  spanClasses: string;
  /** The icon name (see src/icons). */
  icon: string;
}

/** One entry of src/lib/panelTabs.json — token page (and the panel states of the feed view). */
export type PanelTab = PanelTabButton | PanelTabDivider;

/** A panel tab; branch on `"divider" in tab`. */
export interface PanelTabButton {
  text: string;
  classes: string;
  /** The icon name; present on the alerts tab. */
  icon?: string;
  iconWrapperClasses?: string;
  /** The unread dot (always invisible in the capture); present on the alerts tab. */
  dotClasses?: string;
}

/** The thin separator between two panel tabs. */
export interface PanelTabDivider {
  divider: string;
}

/** One entry of src/lib/tableTabs.json — token page. Holders / Swaps / Thesis. */
export interface TableTab {
  wrapper: string;
  button: string;
  text: string;
  /** [["", "(3,185)"]] for a counted tab, [] for a plain one. */
  spans: string[][];
  label: string;
  /** The count string, null on the plain tab. */
  count: string | null;
  /** Present on all but the first tab. */
  divider?: string;
}

/** One entry of src/lib/tableToggles.json — token page. The rows/columns toggles. */
export interface TableToggle {
  wrapper: string;
  button: string;
  buttonStyle: string;
  span: string;
  label: string;
}

/** One entry of src/lib/ticker.json — token page. The top price ticker. */
export interface TickerItem {
  href: string;
  img: string;
  imgClass: string;
  /** The captured alt of the ticker logo ("BTC", "ETH", "SOL", "HYPE"). */
  alt: string;
  price: string;
  hiddenColor: string;
  dir: string;
  change: string;
  color: string;
  classes: string;
  /** The price revealed on hover; present on 1 of the 4 items. */
  hiddenText?: string;
}

/** One entry of src/lib/tokenStats.json — token page. The header's market stat cells. */
export interface TokenMarketStats {
  label: string;
  value: string;
  /** The direction arrow; null on 6 of the 7 cells. */
  arrow: string | null;
  /** The value colour; null on 6 of the 7 cells. */
  color: string | null;
  /** How the cell is rendered: "marketcap", "span", "change" or "plain". */
  variant: string;
}

/* ------------------------------------------------------------------ *
 * token.js
 * ------------------------------------------------------------------ */

/** src/lib/token.js — token page. The token whose page this is. */
export interface TokenData {
  name: string;
  description: string;
  symbol: string;
  /** Truncated on purpose, e.g. "EKtmPP...Siinsc". */
  address: string;
  age: string;
  logo: string;
}


/* ------------------------------------------------------------------ *
 * hover cards
 * ------------------------------------------------------------------ */

/** src/components/hover/TokenHoverCard.svelte — the token popover. Values are the
 * hovered token's own: on the token page they come from token.js. */
/**
 * What a row can tell the hover card before anything is fetched: the pair that
 * identifies the token, plus what the row already draws. The numbers are fetched
 * (`lib/api/tokenCard.svelte.js`) and replace the frozen capture this card used to show.
 */
export interface TokenHoverIdentity {
  href?: string;
  /** API chain, e.g. "SOL". */
  chain?: string;
  address?: string;
  /** The row's own ticker, shown until the token's name arrives. */
  symbol?: string;
  /** URL slug, e.g. "solana". */
  network?: string;
  logo?: string;
}

/**
 * What a row can tell the trader hover card: the wallet that identifies the trader, the
 * window the row's numbers belong to, and the identity bits the row already draws.
 */
export interface UserHoverIdentity {
  href?: string;
  chain?: string;
  walletAddress?: string;
  name?: string;
  handle?: string;
  avatar?: string;
  /** Only where the capture recorded this trader's bio; no endpoint carries one. */
  bio?: string;
  /** API window enum: ONE_DAY | SEVEN_DAY | THIRTY_DAY | NINETY_DAY. */
  timeRange?: string;
}

export interface TokenHoverCard {
  href: string;
  name: string;
  /** Which chain badge the card shows: "solana", "robinhood" or "bnb". */
  network: string;
  logo: string;
  /** Already carries its suffix as the original renders it, e.g. "$1.5M MC". */
  marketCap: string;
  price: string;
  change: string;
  changeArrow: string;
  changeColor: string;
  stats: { label: string; value: string; copy?: boolean }[];
}

/** src/lib/userHoverCards.json — a trader popover, keyed by profile handle
 * without the "@". Three of the four were captured while still loading, which is
 * why portfolio and pnl may be null: the card then shows the capture's own
 * placeholder instead of numbers. */
export interface UserHoverCardsFile {
  source: string;
  /** Shown for a trader the capture has no card for yet. */
  defaultCard: string;
  defaultCardNote: string;
  cards: Record<string, UserHoverCard>;
}

export interface UserHoverCard {
  href: string;
  avatar: string;
  name: string;
  handle: string;
  bio: string;
  following: string;
  followers: string;
  portfolio: string | null;
  pnl: { sign: string; value: string; color: string } | null;
}

/** One row of the search results — src/lib/searchPanel.json (results). */
export interface SearchResultRow {
  href: string;
  name: string;
  description: string;
  /** Truncated on purpose, e.g. "0xb200...a94a01". */
  contract: string;
  logo: string;
  /** Which chain badge the row shows: "solana", "base", "ethereum", "robinhood" or "bnb". */
  network: string | null;
  marketCap: string;
  /** The price is three parts because a run of leading zeros is shown as a
   * subscript digit: "$0.0" + "4" + "4151". */
  priceLead: string;
  priceSub: string | null;
  priceRest: string | null;
  changeArrow: string;
  changeValue: string;
  changeColor: string;
  volume: string;
  /** Whether the row carries the X link and the menu star. */
  hasX: boolean;
  hasStar: boolean;
}

/** A trader in the search results — src/lib/searchPanel.json (users). */
export interface SearchUserRow {
  href: string;
  name: string;
  handle: string;
  avatar: string;
  /** Set when the avatar is the coloured eyes placeholder. */
  avatarBg: string | null;
}

/** A clan in the search results — src/lib/searchPanel.json (clans). */
export interface SearchClanRow {
  href: string;
  name: string;
  logo: string;
  members: string;
  pnlSign: string;
  pnlValue: string;
  pnlColor: string;
  /** Member avatars, stacked with -space-x-2. One may be the eyes placeholder. */
  avatars: { kind: "img" | "eyes"; src: string }[];
}
