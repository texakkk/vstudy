import React from 'react';
import { useSettings } from '../hooks/useSettings';

const SettingsTest = () => {
  const { theme, font, language, updateTheme, updateFont, updateLanguage } = useSettings();

  return (
    <div style={{ 
      padding: '1rem', 
      margin: '1rem',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '0.5rem',
      fontFamily: 'var(--font-family)',
      fontSize: 'var(--font-size)'
    }}>
      <h3>Settings Test Component</h3>
      <p>Current Theme: {theme}</p>
      <p>Current Font: {font.family} ({font.size})</p>
      <p>Current Language: {language}</p>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button onClick={() => updateTheme('light')}>Light</button>
        <button onClick={() => updateTheme('dark')}>Dark</button>
        <button onClick={() => updateFont({ size: '20px' })}>Big Font</button>
        <button onClick={() => updateFont({ size: '14px' })}>Small Font</button>
        <button onClick={() => updateLanguage('es')}>Spanish</button>
        <button onClick={() => updateLanguage('en')}>English</button>
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: 'var(--font-size)' }}>
        <p>This text should change size when you click font buttons.</p>
        <p>Background and text colors should change with theme.</p>
        <p>Document language attribute: {document.documentElement.lang}</p>
      </div>
    </div>
  );
};

export default SettingsTest;