"use client";

import React, { useState } from "react";
import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language?: string;
  defaultValue?: string;
  onChange?: (value: string | undefined) => void;
  height?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  language = "javascript",
  defaultValue = "// Write your code here...",
  onChange,
  height = "400px",
}) => {
  return (
    <div className="border border-dark-200 rounded-lg overflow-hidden w-full">
      <Editor
        height={height}
        defaultLanguage={language}
        defaultValue={defaultValue}
        theme="vs-dark"
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          padding: { top: 16 },
        }}
      />
    </div>
  );
};

export default CodeEditor;
