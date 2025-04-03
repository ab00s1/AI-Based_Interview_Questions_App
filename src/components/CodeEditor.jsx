"use client"

import { useRef } from "react"
import Editor from "@monaco-editor/react"

const CodeEditor = ({ language, value, onChange }) => {
  const editorRef = useRef(null)

  // Map our language identifiers to Monaco's identifiers
  const getMonacoLanguage = (lang) => {
    const languageMap = {
      javascript: "javascript",
      python: "python",
      java: "java",
      cpp: "cpp",
      csharp: "csharp",
    }
    return languageMap[lang] || "javascript"
  }

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
  }

  return (
    <div className="flex-1 overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage={getMonacoLanguage(language)}
        language={getMonacoLanguage(language)}
        value={value}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace",
          lineNumbers: "on",
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          renderLineHighlight: "all",
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
          },
        }}
      />
    </div>
  )
}

export default CodeEditor

