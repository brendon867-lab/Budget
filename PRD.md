# Personal Finance Manager

A comprehensive personal finance application that imports transactions from multiple formats, automatically categorizes spending, and provides insights to help users manage their money better while maintaining complete privacy and offline functionality.

**Experience Qualities**:
1. **Trustworthy** - Users feel confident their financial data is secure and accurate with local-only storage and precise transaction handling
2. **Insightful** - Clear visualizations and smart categorization help users understand their spending patterns and make informed decisions  
3. **Efficient** - Keyboard-first design and intelligent automation minimize time spent on data entry and account management

**Complexity Level**: Complex Application (advanced functionality, accounts)
- Multiple data import formats, sophisticated categorization engine, budgeting tools, and comprehensive reporting require advanced state management and user workflows

## Essential Features

**Transaction Import & Normalization**
- Functionality: Import CSV, OFX-QFX, and QIF files with intelligent column mapping
- Purpose: Consolidate financial data from multiple sources into unified format
- Trigger: User selects file upload or drags file into drop zone
- Progression: File selection → format detection → column mapping UI → preview → import confirmation → transaction list
- Success criteria: All transaction formats import correctly with proper field mapping and validation

**Smart Categorization Engine**
- Functionality: Auto-categorize transactions using rules engine with contains/equals/regex/MCC/amount matching
- Purpose: Reduce manual work while building intelligent spending insights
- Trigger: New transactions imported or manual categorization changes
- Progression: Transaction analysis → rule matching → category assignment → learn from edits → rule creation
- Success criteria: 80%+ transactions auto-categorized correctly with improving accuracy over time

**Budget Management**
- Functionality: Set monthly category budgets with rollover options and preset templates (50/30/20, envelope)
- Purpose: Help users control spending and achieve financial goals
- Trigger: User navigates to budget section or sets up new budget category
- Progression: Budget setup → category allocation → progress tracking → alerts for overages → rollover management
- Success criteria: Users can create budgets, track progress, and receive meaningful alerts

**Financial Insights Dashboard**
- Functionality: Show needs vs wants analysis, top merchants, cash flow forecasting, and spending anomalies
- Purpose: Provide actionable insights to improve financial health
- Trigger: User views insights tab or dashboard loads
- Progression: Data analysis → trend calculation → visualization generation → insight recommendations
- Success criteria: Users can quickly identify spending patterns and receive actionable recommendations

**Transfer Detection & Deduplication**
- Functionality: Automatically identify account-to-account transfers and deduplicate transactions using FITID or date+amount+merchant
- Purpose: Prevent double-counting internal money movements in spending analysis
- Trigger: New transactions imported or transfer rules updated
- Progression: Transaction import → duplicate detection → transfer pattern matching → flagging → exclusion from spend totals
- Success criteria: Internal transfers correctly identified and excluded from spending calculations

## Edge Case Handling

- **Malformed Files**: Show clear error messages with format guidance and sample file links
- **Duplicate Categories**: Prevent category name conflicts with validation and merge options
- **Missing Dates**: Require date field mapping and validate date formats before import
- **Large Files**: Process imports in chunks with progress indicators for files over 1000 transactions
- **Negative Amounts**: Handle both debit/credit columns and signed amount columns correctly
- **Future Dates**: Flag and allow user review of transactions with future dates
- **Zero Amounts**: Allow but flag zero-amount transactions for review

## Design Direction

The design should feel professional and trustworthy like a premium financial application, with clean data visualization that makes complex financial information immediately understandable. Minimal interface that prioritizes data density and keyboard efficiency while maintaining visual clarity.

## Color Selection

Triadic (three equally spaced colors) - Using blue for trust/stability, green for positive financial outcomes, and orange for alerts/attention, creating a comprehensive financial color language that communicates security and clarity.

- **Primary Color**: Deep Blue (oklch(0.45 0.15 240)) - Communicates trust, stability, and professional financial services
- **Secondary Colors**: Forest Green (oklch(0.5 0.12 150)) for positive amounts/savings, Warm Gray (oklch(0.65 0.02 60)) for neutral UI elements
- **Accent Color**: Energetic Orange (oklch(0.7 0.15 50)) - Attention-grabbing highlight for important alerts, budget warnings, and call-to-action elements
- **Foreground/Background Pairings**: 
  - Background (Pure White oklch(1 0 0)): Primary text (oklch(0.2 0 0)) - Ratio 10.4:1 ✓
  - Card (Light Gray oklch(0.98 0 0)): Card text (oklch(0.15 0 0)) - Ratio 12.8:1 ✓
  - Primary (Deep Blue oklch(0.45 0.15 240)): White text (oklch(1 0 0)) - Ratio 6.2:1 ✓
  - Secondary (Forest Green oklch(0.5 0.12 150)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓
  - Accent (Orange oklch(0.7 0.15 50)): Black text (oklch(0.15 0 0)) - Ratio 4.9:1 ✓

## Font Selection

Typography should convey precision and reliability like financial statements while maintaining excellent readability for numbers and data tables. Inter for its excellent number rendering and Fira Code for any code/rule displays.

- **Typographic Hierarchy**: 
  - H1 (Page Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing  
  - H3 (Card Titles): Inter Medium/18px/normal spacing
  - Body (Transactions/Data): Inter Regular/14px/relaxed line height 1.5
  - Captions (Dates/Meta): Inter Regular/12px/muted color
  - Numbers (Amounts): Inter Medium/14px/tabular figures

## Animations

Smooth and purposeful animations that guide attention during data import and category changes, with subtle feedback for financial actions. Balance between professional restraint and helpful transitions that don't delay critical financial operations.

- **Purposeful Meaning**: Motion reinforces the security and precision of financial operations while providing clear feedback for state changes
- **Hierarchy of Movement**: Import progress and categorization changes get primary animation focus, with subtle hover states on interactive elements

## Component Selection

- **Components**: Cards for transaction lists and budget summaries, Dialogs for import wizards, Forms for budget setup, Tables for detailed transaction views, Charts from recharts for spending visualization, Select/Combobox for category assignment, Progress for budget tracking
- **Customizations**: Custom transaction row component with inline editing, specialized import wizard flow, budget allocation sliders, category rule builder interface
- **States**: Import buttons show loading/progress states, category dropdowns highlight confidence levels, budget progress uses color coding (green/yellow/red), transaction rows expand for edit mode
- **Icon Selection**: Import (file-plus), Categories (tag), Budgets (chart-pie), Insights (chart-line), Settings (gear), Transfer (arrow-right-left), Edit (pencil)
- **Spacing**: Consistent 4-unit (16px) gaps between major sections, 2-unit (8px) for related elements, 1-unit (4px) for tight groupings like form fields
- **Mobile**: Transaction cards stack vertically, import wizard becomes full-screen, budget charts adapt to portrait orientation, keyboard shortcuts become touch gestures, tables become horizontally scrollable cards