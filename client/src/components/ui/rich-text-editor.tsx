import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  minHeight?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link', 'image'
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your content here...',
  className,
  error = false,
  minHeight = '200px'
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        className={cn(
          "border rounded-md p-4 min-h-[200px] w-full bg-gray-50",
          error && "border-red-500",
          className
        )}
      >
        <div className="h-2 w-24 bg-gray-300 rounded animate-pulse mb-4"></div>
        <div className="h-2 w-full bg-gray-300 rounded animate-pulse mb-2"></div>
        <div className="h-2 w-full bg-gray-300 rounded animate-pulse mb-2"></div>
        <div className="h-2 w-3/4 bg-gray-300 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border rounded-md overflow-hidden", 
      error ? "border-red-500" : "border-gray-300 dark:border-gray-700",
      className
    )}>
      <style jsx global>{`
        .quill {
          height: auto;
          min-height: ${minHeight};
          width: 100%;
        }
        .ql-container {
          font-family: inherit;
          font-size: inherit;
          min-height: ${minHeight};
          background-color: white;
        }
        .ql-editor {
          min-height: ${minHeight};
          max-height: 500px;
          overflow-y: auto;
          background-color: white;
          color: #333;
        }
        .ql-toolbar {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        .dark .ql-toolbar {
          background-color: #1f2937;
          border-color: #374151;
        }
        .dark .ql-container,
        .dark .ql-editor {
          background-color: #111827;
          color: #e5e7eb;
        }
        .dark .ql-picker-label, 
        .dark .ql-picker-options {
          color: #e5e7eb;
        }
        .dark .ql-stroke {
          stroke: #e5e7eb;
        }
        .dark .ql-fill {
          fill: #e5e7eb;
        }
      `}</style>
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
