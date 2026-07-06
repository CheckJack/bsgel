"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Upload,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
} from "lucide-react";
import { Button } from "./button";
import { useState, useEffect, useRef } from "react";
import { TextSelection } from "prosemirror-state";

export const RICH_TEXT_INLINE_IMAGE_HINT =
  "Recommended size: 1200 × 675 px (16:9). Images scale to fit the content width.";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  imageUploadHint?: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing your content here...",
  editable = true,
  imageUploadHint = RICH_TEXT_INLINE_IMAGE_HINT,
}: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ url: string; file: File } | null>(null);
  const [isInsertingImage, setIsInsertingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        hardBreak: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-4",
      },
      handleKeyDown: (view, event) => {
        const { state } = view;
        const { selection } = state;
        const { $anchor, empty } = selection;

        // Helper function to check if a node is empty
        const isEmptyNode = (node: any) => {
          return !node || node.content.size === 0 || 
            (node.textContent && node.textContent.trim().length === 0);
        };

        // Handle Backspace key
        if (event.key === "Backspace") {
          // Handle when cursor is in an empty paragraph (anywhere in it, not just at start)
          if (empty) {
            const parent = $anchor.parent;
            
            // Check if we're in an empty paragraph
            if (parent.type.name === "paragraph" && isEmptyNode(parent) && $anchor.depth === 1) {
              try {
                const { tr } = state;
                const paraPos = $anchor.before(1);
                
                // Find the index of this paragraph in the document
                let currentIndex = -1;
                let totalChildren = state.doc.content.childCount;
                let posOffset = 1; // Start position after document start node
                
                // Also check what blocks are before and after this paragraph
                let prevNode = null;
                let nextNode = null;
                
                for (let i = 0; i < totalChildren; i++) {
                  const child = state.doc.content.child(i);
                  if (posOffset === paraPos) {
                    currentIndex = i;
                    // Get previous and next nodes
                    if (i > 0) {
                      prevNode = state.doc.content.child(i - 1);
                    }
                    if (i < totalChildren - 1) {
                      nextNode = state.doc.content.child(i + 1);
                    }
                    break;
                  }
                  posOffset += child.nodeSize;
                }
                
                // Always allow deletion of empty paragraphs, especially between text and lists
                // Special handling when empty paragraph is between content and list
                const isBetweenTextAndList = 
                  (prevNode && (prevNode.type.name === "paragraph" || prevNode.type.name === "heading")) &&
                  (nextNode && (nextNode.type.name === "bulletList" || nextNode.type.name === "orderedList"));
                
                const isBetweenListAndText = 
                  (prevNode && (prevNode.type.name === "bulletList" || prevNode.type.name === "orderedList")) &&
                  (nextNode && (nextNode.type.name === "paragraph" || nextNode.type.name === "heading"));
                
                if (totalChildren > 1 || currentIndex > 0 || isBetweenTextAndList || isBetweenListAndText) {
                  // Delete the empty paragraph
                  tr.delete(paraPos, paraPos + parent.nodeSize);
                  
                  // Ensure at least one paragraph remains
                  if (tr.doc.content.size === 0) {
                    const para = state.schema.nodes.paragraph.create();
                    tr.insert(0, para);
                    tr.setSelection(TextSelection.create(tr.doc, 1));
                  } else {
                    // Place cursor appropriately based on context
                    let targetPos = paraPos;
                    
                    if (isBetweenTextAndList && nextNode) {
                      // If between text and list, place cursor at start of list's first item
                      const nextPos = paraPos + parent.nodeSize;
                      try {
                        // Find first list item position
                        const listStartPos = nextPos + 1;
                        tr.setSelection(TextSelection.create(tr.doc, listStartPos));
                      } catch {
                        tr.setSelection(TextSelection.create(tr.doc, paraPos));
                      }
                    } else if (isBetweenListAndText && nextNode) {
                      // If between list and text, place cursor at start of next paragraph
                      const nextPos = paraPos + parent.nodeSize;
                      tr.setSelection(TextSelection.create(tr.doc, nextPos + 1));
                    } else if (currentIndex === totalChildren - 1 && currentIndex > 0) {
                      // Was last block, go to previous
                      targetPos = paraPos - 1;
                      try {
                        tr.setSelection(TextSelection.create(tr.doc, Math.max(1, targetPos)));
                      } catch {
                        tr.setSelection(TextSelection.create(tr.doc, 1));
                      }
                    } else {
                      // Default: place at next block or same position
                      try {
                        tr.setSelection(TextSelection.create(tr.doc, Math.max(1, Math.min(paraPos, tr.doc.content.size - 1))));
                      } catch {
                        tr.setSelection(TextSelection.create(tr.doc, 1));
                      }
                    }
                  }
                  
                  view.dispatch(tr);
                  return true;
                }
              } catch (e) {
                return false;
              }
            }
            
            // Handle empty list items
            if (parent.type.name === "listItem" && isEmptyNode(parent)) {
              try {
                const { tr } = state;
                const listItemPos = $anchor.before($anchor.depth);
                
                // Delete the list item
                tr.delete(listItemPos, listItemPos + parent.nodeSize);
                
                // Ensure at least one paragraph remains
                if (tr.doc.content.size === 0) {
                  const para = state.schema.nodes.paragraph.create();
                  tr.insert(0, para);
                  tr.setSelection(TextSelection.create(tr.doc, 1));
                }
                
                view.dispatch(tr);
                return true;
              } catch (e) {
                return false;
              }
            }
            
            // Handle empty paragraph inside a list item
            if (parent.type.name === "paragraph" && $anchor.depth > 1) {
              try {
                const listItem = $anchor.node($anchor.depth - 1);
                if (listItem && listItem.type.name === "listItem" && isEmptyNode(parent)) {
                  const { tr } = state;
                  const listItemPos = $anchor.before($anchor.depth - 1);
                  
                  tr.delete(listItemPos, listItemPos + listItem.nodeSize);
                  
                  // Ensure at least one paragraph remains
                  if (tr.doc.content.size === 0) {
                    const para = state.schema.nodes.paragraph.create();
                    tr.insert(0, para);
                    tr.setSelection(TextSelection.create(tr.doc, 1));
                  }
                  
                  view.dispatch(tr);
                  return true;
                }
              } catch (e) {
                return false;
              }
            }
            
            // Handle Backspace at start of block - delete previous empty paragraph if it exists
            if ($anchor.parentOffset === 0) {
              const parent = $anchor.parent;
              
              // If we're at start of a list, check if previous block is an empty paragraph
              if ((parent.type.name === "listItem" || 
                   ($anchor.depth > 1 && $anchor.node($anchor.depth - 1).type.name === "bulletList") ||
                   ($anchor.depth > 1 && $anchor.node($anchor.depth - 1).type.name === "orderedList"))) {
                try {
                  // Find the list's position in the document
                  let listPos = -1;
                  let listIndex = -1;
                  let posOffset = 1;
                  const totalChildren = state.doc.content.childCount;
                  
                  // Find which list we're in
                  for (let i = 0; i < totalChildren; i++) {
                    const child = state.doc.content.child(i);
                    if (child.type.name === "bulletList" || child.type.name === "orderedList") {
                      const childStart = posOffset;
                      const childEnd = posOffset + child.nodeSize;
                      if ($anchor.pos >= childStart && $anchor.pos <= childEnd) {
                        listPos = childStart;
                        listIndex = i;
                        break;
                      }
                    }
                    posOffset += child.nodeSize;
                  }
                  
                  // Check if previous block is an empty paragraph
                  if (listIndex > 0 && listPos > 0) {
                    const prevNode = state.doc.content.child(listIndex - 1);
                    if (prevNode && prevNode.type.name === "paragraph" && isEmptyNode(prevNode)) {
                      const { tr } = state;
                      const prevPos = listPos - prevNode.nodeSize;
                      tr.delete(prevPos, listPos);
                      view.dispatch(tr);
                      return true;
                    }
                  }
                } catch (e) {
                  return false;
                }
              }
              
              // If we're at start of a non-empty paragraph, check if previous block is empty
              if (parent.type.name === "paragraph" && $anchor.depth === 1 && !isEmptyNode(parent)) {
                try {
                  const paraPos = $anchor.before(1);
                  
                  // Find current paragraph index
                  let currentIndex = -1;
                  let posOffset = 1;
                  const totalChildren = state.doc.content.childCount;
                  
                  for (let i = 0; i < totalChildren; i++) {
                    const child = state.doc.content.child(i);
                    if (posOffset === paraPos) {
                      currentIndex = i;
                      break;
                    }
                    posOffset += child.nodeSize;
                  }
                  
                  if (currentIndex > 0) {
                    // Get previous block
                    const prevNode = state.doc.content.child(currentIndex - 1);
                    
                    // If previous block is an empty paragraph, delete it
                    if (prevNode && prevNode.type.name === "paragraph" && isEmptyNode(prevNode)) {
                      const { tr } = state;
                      const prevPos = paraPos - prevNode.nodeSize;
                      tr.delete(prevPos, paraPos);
                      view.dispatch(tr);
                      return true;
                    }
                  }
                } catch (e) {
                  return false;
                }
              }
            }
          }
        }
        
        // Handle Delete key - delete empty paragraph ahead
        if (event.key === "Delete") {
          if (empty) {
            const parent = $anchor.parent;
            
            // If cursor is at end of a list item or list, check if next block is empty paragraph
            if (parent.type.name === "listItem") {
              try {
                // Find the list's position
                let listPos = -1;
                let listIndex = -1;
                let posOffset = 1;
                const totalChildren = state.doc.content.childCount;
                
                for (let i = 0; i < totalChildren; i++) {
                  const child = state.doc.content.child(i);
                  if (child.type.name === "bulletList" || child.type.name === "orderedList") {
                    const childStart = posOffset;
                    const childEnd = posOffset + child.nodeSize;
                    if ($anchor.pos >= childStart && $anchor.pos <= childEnd) {
                      listPos = childStart;
                      listIndex = i;
                      break;
                    }
                  }
                  posOffset += child.nodeSize;
                }
                
                // Check if next block after list is an empty paragraph
                if (listIndex >= 0 && listIndex < totalChildren - 1) {
                  const nextNode = state.doc.content.child(listIndex + 1);
                  if (nextNode && nextNode.type.name === "paragraph" && isEmptyNode(nextNode)) {
                    const { tr } = state;
                    const nextPos = listPos + state.doc.content.child(listIndex).nodeSize;
                    tr.delete(nextPos, nextPos + nextNode.nodeSize);
                    view.dispatch(tr);
                    return true;
                  }
                }
              } catch (e) {
                return false;
              }
            }
            
            // If cursor is at end of a paragraph, check if next block is empty
            if (parent.type.name === "paragraph" && $anchor.depth === 1 && 
                $anchor.parentOffset === parent.content.size) {
              try {
                const paraPos = $anchor.before(1);
                
                // Find current paragraph index
                let currentIndex = -1;
                let posOffset = 1;
                const totalChildren = state.doc.content.childCount;
                
                for (let i = 0; i < totalChildren; i++) {
                  const child = state.doc.content.child(i);
                  if (posOffset === paraPos) {
                    currentIndex = i;
                    break;
                  }
                  posOffset += child.nodeSize;
                }
                
                if (currentIndex < totalChildren - 1) {
                  // Get next block
                  const nextNode = state.doc.content.child(currentIndex + 1);
                  
                  // If next block is an empty paragraph, delete it
                  if (nextNode && nextNode.type.name === "paragraph" && isEmptyNode(nextNode)) {
                    const { tr } = state;
                    const nextPos = paraPos + parent.nodeSize;
                    tr.delete(nextPos, nextPos + nextNode.nodeSize);
                    view.dispatch(tr);
                    return true;
                  }
                }
              } catch (e) {
                return false;
              }
            }
          }
        }
        
        return false;
      },
    },
  });

  // Update editor content when content prop changes (for edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addLink = () => {
    if (linkUrl) {
      editor
        ?.chain()
        .focus()
        .setLink({ href: linkUrl, target: "_blank" })
        .run();
      setLinkUrl("");
      setShowLinkDialog(false);
    }
  };

  const clearImagePreview = () => {
    setImagePreview((prev) => {
      if (prev?.url.startsWith("blob:")) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
  };

  const closeImageDialog = () => {
    clearImagePreview();
    setShowImageDialog(false);
    setIsInsertingImage(false);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setImagePreview((prev) => {
      if (prev?.url.startsWith("blob:")) {
        URL.revokeObjectURL(prev.url);
      }
      return { url: URL.createObjectURL(file), file };
    });
  };

  const addImage = async () => {
    if (!imagePreview?.file || !editor) return;

    setIsInsertingImage(true);
    try {
      const dataUrl = await fileToDataUrl(imagePreview.file);
      editor.chain().focus().setImage({ src: dataUrl }).run();
      closeImageDialog();
    } catch (error) {
      console.error("Failed to insert image:", error);
      setIsInsertingImage(false);
    }
  };

  // Prevent hydration mismatch by only rendering after mount
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loading state during SSR or before editor is ready
  if (!isMounted || !editor) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 min-h-[400px] p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 relative">
      {editable && (
        <div className="relative z-20 border-b border-gray-300 dark:border-gray-600 p-2 flex flex-wrap gap-1 overflow-visible">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive("bold") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive("italic") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive("underline") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive("strike") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive("code") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive("heading", { level: 1 }) ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive("heading", { level: 2 }) ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive("heading", { level: 3 }) ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive("bulletList") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive("orderedList") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive("blockquote") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Links & Images */}
          <div className="flex gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const url = editor.getAttributes("link").href;
                setLinkUrl(url || "");
                setShowLinkDialog(true);
                setShowImageDialog(false);
              }}
              className={editor.isActive("link") ? "bg-gray-200 dark:bg-gray-700" : ""}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearImagePreview();
                  setShowLinkDialog(false);
                  setShowImageDialog((open) => !open);
                }}
                className={showImageDialog ? "bg-gray-200 dark:bg-gray-700" : ""}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              {showImageDialog && (
                <div className="absolute z-50 top-full left-0 mt-2 w-[min(calc(100vw-2rem),320px)] p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Insert image</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{imageUploadHint}</p>
                    </div>

                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleImageFile(file);
                        event.target.value = "";
                      }}
                    />

                    {imagePreview ? (
                      <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview.url}
                          alt="Selected upload preview"
                          className="max-h-40 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={clearImagePreview}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                          aria-label="Remove selected image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => imageInputRef.current?.click()}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            imageInputRef.current?.click();
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          const file = event.dataTransfer.files[0];
                          if (file) handleImageFile(file);
                        }}
                        onDragOver={(event) => event.preventDefault()}
                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 transition-colors hover:border-brand-champagne dark:border-gray-600 dark:bg-gray-700"
                      >
                        <Upload className="mb-2 h-7 w-7 text-gray-400 dark:text-gray-500" />
                        <p className="text-center text-xs text-gray-600 dark:text-gray-300">
                          Drop an image here or click to browse
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={addImage}
                        disabled={!imagePreview || isInsertingImage}
                      >
                        {isInsertingImage ? "Inserting..." : "Insert image"}
                      </Button>
                      {imagePreview && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isInsertingImage}
                        >
                          Replace
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={closeImageDialog}
                        disabled={isInsertingImage}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="overflow-auto max-h-[600px]">
        <EditorContent editor={editor} />
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute z-50 top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[300px]">
          <div className="flex flex-col gap-2">
            <input
              type="url"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
                if (e.key === "Escape") {
                  setShowLinkDialog(false);
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={addLink}>
                Add Link
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setShowLinkDialog(false);
                }}
              >
                Remove
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowLinkDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

