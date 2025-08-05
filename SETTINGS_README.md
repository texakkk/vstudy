# Global Settings System

This application now includes a comprehensive global settings system that allows users to customize their experience across the entire application.

## Features

### 🎨 Theme Settings
- **Light Theme**: Clean, bright interface
- **Dark Theme**: Easy on the eyes for low-light environments
- **Auto Theme**: Automatically switches based on system preference
- **Toggle Function**: Quick switch between themes

### 🔤 Font Settings
- **Font Family**: Choose from multiple font options including Inter, Roboto, Arial, Georgia, Times New Roman, Courier New, and System Default
- **Font Size**: Adjustable from 12px to 24px with descriptive labels
- **Font Weight**: Normal weight with extensibility for bold/light variants

### 🌍 Language Settings
- **Multi-language Support**: English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, and Chinese
- **Flag Indicators**: Visual flags help identify languages
- **Document Language**: Automatically sets the HTML document language attribute

### ♿ Accessibility Features
- **High Contrast Mode**: Enhanced contrast for better visibility
- **Reduced Motion**: Disables animations for users sensitive to motion
- **Focus Indicators**: Clear focus outlines for keyboard navigation
- **Screen Reader Support**: Proper ARIA labels and semantic HTML

### 📐 Layout Options
- **Sidebar Collapse**: Toggle sidebar visibility
- **Compact Mode**: Reduced spacing for more content density
- **Responsive Design**: Adapts to different screen sizes

### ⚙️ User Preferences
- **Auto Save**: Automatically save user work
- **Notifications**: Enable/disable system notifications
- **Sound Effects**: Toggle audio feedback

## Usage

### Basic Usage with Hooks

```javascript
import { useSettings } from '../hooks/useSettings';

const MyComponent = () => {
  const { theme, font, language, updateTheme } = useSettings();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => updateTheme('dark')}>
        Switch to Dark Theme
      </button>
    </div>
  );
};
```

### Specific Setting Hooks

```javascript
import { useTheme, useFont, useLanguage } from '../hooks/useSettings';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle Theme</button>;
};

const FontSelector = () => {
  const { font, updateFont } = useFont();
  return (
    <select 
      value={font.size} 
      onChange={(e) => updateFont({ size: e.target.value })}
    >
      <option value="14px">Small</option>
      <option value="16px">Medium</option>
      <option value="18px">Large</option>
    </select>
  );
};
```

### Using CSS Variables

The settings system automatically applies CSS variables that you can use throughout your application:

```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-family);
  font-size: var(--font-size);
  border: 1px solid var(--border-color);
}

.my-button {
  background-color: var(--accent-primary);
  color: white;
}
```

### Available CSS Variables

#### Colors
- `--bg-primary`: Main background color
- `--bg-secondary`: Secondary background color
- `--bg-tertiary`: Tertiary background color
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--text-muted`: Muted text color
- `--border-color`: Border color
- `--accent-primary`: Primary accent color
- `--accent-secondary`: Secondary accent color
- `--success`: Success color
- `--warning`: Warning color
- `--error`: Error color
- `--info`: Info color

#### Typography
- `--font-family`: Current font family
- `--font-size`: Base font size
- `--font-size-sm`: Small font size
- `--font-size-lg`: Large font size
- `--font-size-xl`: Extra large font size
- `--font-size-2xl`: 2X large font size

## Settings Persistence

All settings are automatically saved to localStorage and restored when the application loads. The settings persist across browser sessions.

## Accessibility

The settings system includes comprehensive accessibility features:

- **Keyboard Navigation**: All controls are keyboard accessible
- **Screen Reader Support**: Proper labels and ARIA attributes
- **High Contrast Mode**: Enhanced visibility for users with visual impairments
- **Reduced Motion**: Respects user preferences for reduced animations
- **Focus Management**: Clear focus indicators and logical tab order

## Integration

### Adding the Settings Button

The settings button is automatically added to your application and appears as a floating action button in the bottom-right corner.

### Custom Settings Panel

You can create custom settings panels by importing the SettingsPanel component:

```javascript
import SettingsPanel from '../components/SettingsPanel';

const MyPage = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowSettings(true)}>
        Open Settings
      </button>
      <SettingsPanel 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};
```

## Architecture

The settings system is built using:

- **Redux Toolkit**: State management
- **React Context**: Easy access throughout the component tree
- **Custom Hooks**: Simplified API for common use cases
- **CSS Variables**: Dynamic theming
- **localStorage**: Settings persistence

## File Structure

```
src/
├── features/settings/
│   └── settingsSlice.js          # Redux slice for settings
├── contexts/
│   └── SettingsContext.js        # React context provider
├── hooks/
│   └── useSettings.js             # Custom hooks
├── components/
│   ├── SettingsPanel.js           # Settings UI panel
│   ├── SettingsButton.js          # Floating settings button
│   └── ExampleComponent.js       # Usage example
└── styles/
    └── globals.css                # Global CSS variables and styles
```

## Extending the System

### Adding New Settings

1. Update the `defaultSettings` object in `settingsSlice.js`
2. Add new actions to the slice
3. Update the context provider
4. Add UI controls to the SettingsPanel
5. Update the CSS variables if needed

### Adding New Themes

1. Add theme colors to the CSS variables in `globals.css`
2. Update the `settingsOptions.themes` array
3. Modify the theme application logic if needed

This global settings system provides a solid foundation for user customization while maintaining consistency and accessibility throughout your application.