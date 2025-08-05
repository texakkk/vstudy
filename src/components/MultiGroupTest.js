import React from 'react';
import { ToastProvider } from '../contexts/ToastContext';
import MultiGroupDemo from './MultiGroupDemo';

const MultiGroupTest = () => {
  return (
    <ToastProvider>
      <div style={{ padding: '20px' }}>
        <h1>Multi-Group Messaging Test</h1>
        <p>This is a test component to verify the multi-group messaging functionality.</p>
        <MultiGroupDemo />
      </div>
    </ToastProvider>
  );
};

export default MultiGroupTest;