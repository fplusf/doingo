import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Code as CodeExtension } from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import BulletList from '@tiptap/extension-bullet-list';
import Link from '@tiptap/extension-link';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import Placeholder from '@tiptap/extension-placeholder';
import { BubbleMenu } from '@tiptap/react';
import { Bold, Italic, Link as LinkIcon, Strikethrough, Code, Heading2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import React, { memo } from 'react';
import { debounce } from 'radash';

interface TaskNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

function TaskNotes({ notes, onNotesChange }: TaskNotesProps) {
  const debouncedNotesChange = React.useCallback(
    debounce({ delay: 1000 }, (content: string) => {
      onNotesChange(content);
    }),
    [onNotesChange],
  );

  const editor = useEditor({
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert h-full max-w-none p-4 [&_*:focus]:outline-none [&_.is-editor-empty]:relative [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:absolute [&_.is-editor-empty]:before:left-0 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:text-muted-foreground [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_p:empty]:min-h-[1em] [&_pre]:bg-zinc-900 [&_pre]:p-4 [&_pre]:rounded-lg [&_code]:text-sm [&_code]:font-mono',
      },
    },
    extensions: [
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc ml-4',
        },
        keepMarks: true,
        keepAttributes: false,
      }),
      StarterKit.configure({
        bulletList: false,
      }),
      Link,
      TaskList.configure({
        HTMLAttributes: {
          class:
            'gap-2 [&_.task-list-item]:flex [&_.task-list-item]:items-center [&_.task-list-item]:gap-2',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'flex gap-2',
        },
      }),
      Link.configure({
        HTMLAttributes: {
          class:
            '[&_a:hover]:text-blue-600 dark:[&_a:hover]:text-blue-300 [&_a]:cursor-pointer [&_a]:text-blue-500 [&_a]:transition-colors dark:[&_a]:text-blue-400',
        },
      }),
      CodeExtension.configure({
        HTMLAttributes: {
          class:
            'rounded-md bg-zinc-900 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-pink-400',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class:
            'not-prose my-4 rounded-lg bg-zinc-900 [&_pre]:m-0 [&_pre]:bg-transparent [&_pre]:p-0 [&_code]:text-sm [&_code]:leading-relaxed [&_code]:text-gray-400',
        },
      }),
      Placeholder.configure({
        placeholder: 'Notes...',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: notes,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      debouncedNotesChange(content);
    },
  });

  return (
    <div className="h-full min-h-[300px] flex-1 cursor-text">
      {editor && (
        <BubbleMenu
          className="flex overflow-hidden rounded-md border border-border bg-popover shadow-md"
          editor={editor}
        >
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 hover:bg-accent/50 ${editor.isActive('bold') ? 'bg-accent/25' : ''}`}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 hover:bg-accent/50 ${editor.isActive('italic') ? 'bg-accent/25' : ''}`}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 hover:bg-accent/50 ${editor.isActive('strike') ? 'bg-accent/25' : ''}`}
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 hover:bg-accent/50 ${editor.isActive('code') ? 'bg-accent/25' : ''}`}
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 hover:bg-accent/50 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent/25' : ''}`}
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`p-2 hover:bg-accent/50 ${editor.isActive('link') ? 'bg-accent/25' : ''}`}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const url = formData.get('url') as string;
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                  (e.target as HTMLFormElement).reset();
                }}
                className="flex gap-2"
              >
                <input
                  name="url"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter URL..."
                  type="url"
                />
                <Button type="submit" size="sm">
                  Add
                </Button>
              </form>
            </PopoverContent>
          </Popover>
        </BubbleMenu>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-sm dark:prose-invert h-full max-w-none [&_*:focus]:outline-none [&_.is-editor-empty]:relative [&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:absolute [&_.is-editor-empty]:before:left-0 [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:text-muted-foreground [&_.is-editor-empty]:before:content-[attr(data-placeholder)] [&_a:hover]:text-blue-600 dark:[&_a:hover]:text-blue-300 [&_a]:cursor-pointer [&_a]:text-blue-500 [&_a]:transition-colors dark:[&_a]:text-blue-400 [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold"
      />
    </div>
  );
}

export default memo(TaskNotes);
