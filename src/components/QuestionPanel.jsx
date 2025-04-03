import React from "react";
import ReactMarkdown from "react-markdown";

const QuestionPanel = ({ question }) => {
  if (!question) {
    return <div className="p-4">Loading question...</div>;
  }

  return (
    <div className="p-4 overflow-auto">
      <ReactMarkdown>{question.description}</ReactMarkdown>
    </div>
  );
};

export default QuestionPanel;