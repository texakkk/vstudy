import React, { useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

const SettingsDebug = () => {
  const settings = useSettings();

  useEffect(() => {
    console.log('=== SETTINGS DEBUG ===');
    console.log('Current settings:', settings);
    console.log('Document theme attribute:', document.documentElement.getAttribute('data-theme'));
    console.log('Document language:', document.documentElement.lang);
    console.log('CSS Variables:');
    console.log('--font-family:', getComputedStyle(document.documentElement).getPropertyValue('--font-family'));
    console.log('--font-size:', getComputedStyle(document.documentElement).getPropertyValue('--font-size'));
    console.log('--bg-primary:', getComputedStyle(document.documentElement).getPropertyValue('--bg-primary'));
    console.log('--text-primary:', getComputedStyle(document.documentElement).getPropertyValue('--text-primary'));
    console.log('======================');
  }, [settings]);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Settings Debug</h4>
      <p>Theme: {settings.theme}</p>
      <p>Font: {settings.font?.family} ({settings.font?.size})</p>
      <p>Language: {settings.language}</p>
      <p>DOM Theme: {document.documentElement.getAttribute('data-theme')}</p>
      <p>DOM Lang: {document.documentElement.lang}</p>
      <div style={{ 
        marginTop: '10px',
        padding: '5px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)'
      }}>
        CSS Variables Test
      </div>
    </div>
  );
};

export default SettingsDebug;