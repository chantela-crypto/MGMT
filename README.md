# True Balance Clinic Management Portal

## Custom Branding & Management Features

### Branding Management System
- **Complete Color Customization**: Primary, secondary, accent, status, and text colors
- **Unified Theme Contro**l: Single global theme across all pages and modules
- **Complete Color Customization**: Primary, secondary, accent, status, and text colors
- **Division Color Configuration**: Assign custom colors per division for cards, charts, and badges
- **Layout Customization**: Spacing scales, border radius, and shadow systems
- **Pre-built Themes**: Professional Blue, Modern Purple, Wellness Green, and more
- **Real-time Preview**: See changes instantly with live preview mode
- **Import/Export**: Share themes and backup configurations
- **Company Branding**: Logo, company name, and tagline customization
- **Tab Organization**: Organized into logical tabs for better workflow

### Sidebar & Navigation Management
- **Menu Customization**: Rename any menu item or folder
- **Visibility Control**: Show or hide menu items based on needs
- **Custom Menu Items**: Create new menu items and organize into folders
- **Drag & Drop Reordering**: Customize menu sequence for optimal workflow
- **Folder Management**: Create, edit, and organize menu folders
- **Real-time Preview**: See sidebar changes instantly
- **Reset Capability**: Return to default menu structure anytime

### KPI Management System
- **Global KPI Library**: Master library of 12+ pre-defined metrics
- **Custom KPI Creation**: Add new metrics with formulas and dependencies
- **Division-specific Configuration**: Customize KPIs per division
- **Custom Targets**: Set division-specific targets for each KPI
- **KPI Categories**: Performance, Financial, Operational, Satisfaction, Growth, Retention
- **Data Type Validation**: Percentage, currency, score, number, hours
- **Drag & Drop Reordering**: Customize KPI display sequence
- **Formula Support**: Define calculation formulas for complex metrics

### Access Control
- **Admin-only Access**: Branding and KPI management restricted to administrators
- **Role-based Permissions**: Different access levels for different user roles
- **Audit Trail**: Track changes and modifications

### Technical Features
- **CSS Custom Properties**: Dynamic theming using CSS variables
- **Real-time Updates**: Changes apply instantly across all components
- **Local Storage**: Configurations persist between sessions
- **Type Safety**: Full TypeScript support for all configurations
- **Responsive Design**: All customizations work across all screen sizes

## Usage

### Navigation Menu Management

The sidebar navigation uses a **single source of truth** system to prevent duplicates and ensure consistency:

#### One-File Workflow for Menu Changes

**To Add a New Menu Item:**
1. Open `src/data/sidebarConfig.ts`
2. Add new item to `MASTER_MENU_ITEMS` array:
   ```typescript
   {
     id: 'unique-page-id',
     label: 'Page Display Name',
     route: 'page-route',
     sortOrder: 170, // Use next available increment of 10
     isVisible: true,
     isFolder: false,
   }
   ```
3. Add route handler in `src/App.tsx` renderActiveView() switch statement
4. Run tests to ensure no duplicates: `npm test sidebarValidation`

**To Remove a Menu Item:**
1. Open `src/data/sidebarConfig.ts`
2. Remove item from `MASTER_MENU_ITEMS` array
3. Remove corresponding route handler from `src/App.tsx`
4. Run tests to verify: `npm test sidebarValidation`

**Important Rules:**
- IDs must be unique across all menu items
- Routes must be unique across all menu items  
- Sort orders must be unique (use increments of 10)
- Never modify menu items in multiple files
- Always run validation tests after changes

#### Menu Validation
The system includes runtime validation that will throw errors if:
- Duplicate IDs are found
- Duplicate routes are found
- Duplicate sort orders are found
- Required fields are missing

Run validation tests: `npm test sidebarValidation`

### Accessing Custom Branding
1. Log in as an administrator
2. Navigate to Administration → Custom Branding
3. Use the tabs to access different customization areas:
   - **Branding & Appearance**: Colors, typography, and visual elements
   - **Division Colors**: Customize colors for each division
   - **KPI Management**: Configure metrics and targets
   - **Sidebar & Navigation**: Menu structure and labels
   - **Dashboard Customizer**: Dashboard modules and data connections
   - **Performance Customizer**: Performance page sections and workflows

### Customizing Branding
1. Go to the Branding & Appearance tab
2. Enable Live Preview for real-time changes
3. Customize colors, typography, and spacing
4. Apply presets or create custom themes
5. Save and apply changes

### Customizing Division Colors
1. Go to the Division Colors tab
2. Click on any division color to customize it
3. Use the color picker or enter hex values
4. Enable Live Preview to see changes instantly
5. Colors apply to cards, badges, charts, and borders throughout the app

### Customizing Sidebar Navigation
1. Go to the Sidebar & Navigation tab
2. Edit menu item labels by clicking the edit button
3. Show/hide items using the visibility toggle
4. Create custom menu items and folders
5. Reorder items using drag handles
6. Preview changes in real-time

### Customizing Dashboard & Performance
1. Go to the Dashboard Customizer tab to configure the main dashboard
2. Enable/disable modules and sections as needed
3. Configure data connections and auto-refresh settings
4. Select which KPIs to display on the dashboard
5. Go to the Performance Customizer tab to configure performance tracking
6. Set up review workflows and approval requirements
7. Add custom fields to capture additional performance data
8. Configure target management and auto-calculation settings

### Managing KPIs
1. Go to the KPI Management tab
2. Use Global KPI Library to create/edit metrics
3. Configure division-specific KPIs and targets
4. Reorder KPI display sequence
5. Set custom targets per division

### Creating Custom KPIs
1. Click "Add KPI" in the KPI Manager
2. Define name, description, and category
3. Set data type and validation rules
4. Add calculation formula if needed
5. Choose applicable divisions
6. Save to add to the global library