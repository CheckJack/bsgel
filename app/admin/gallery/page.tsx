"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Upload, 
  Download, 
  FolderPlus, 
  Filter, 
  Eye,
  Grid3x3,
  List,
  ChevronDown,
  Search,
  Folder,
  File,
  X,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Edit2,
  Check,
  MoreVertical,
  Move,
  Copy,
  ZoomIn,
  Calendar,
  FileText,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import Image from "next/image";

interface GalleryItem {
  id: string;
  name: string;
  type: "FILE" | "FOLDER";
  url?: string | null;
  mimeType?: string | null;
  size?: number | null;
  folderId?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: GalleryItem[];
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<GalleryItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showPreview, setShowPreview] = useState<GalleryItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch gallery items
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFolderId) params.append("folderId", currentFolderId);
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (filterType !== "all") params.append("type", filterType);
      params.append("sortBy", sortBy);

      const response = await fetch(`/api/gallery?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGalleryItems(data);
      } else {
        toast("Failed to fetch gallery items", "error");
      }
    } catch (error) {
      console.error("Error fetching gallery items:", error);
      toast("Failed to fetch gallery items", "error");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, debouncedSearchQuery, filterType, sortBy]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset selection when folder changes
  useEffect(() => {
    setSelectedItems(new Set());
  }, [currentFolderId]);

  // Handle upload
  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;

    try {
      setUploading(true);
      const newProgress: UploadProgress[] = uploadFiles.map(file => ({
        file,
        progress: 0,
        status: "uploading"
      }));
      setUploadProgress(newProgress);

      // Upload files sequentially with progress
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append("action", "upload");
        formData.append("file", file);
        if (currentFolderId) formData.append("folderId", currentFolderId);
        if (uploadDescription) formData.append("description", uploadDescription);

        try {
          const response = await fetch("/api/gallery", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            setUploadProgress(prev => {
              const updated = [...prev];
              updated[i] = { ...updated[i], progress: 100, status: "success" };
              return updated;
            });
          } else {
            const error = await response.json();
            setUploadProgress(prev => {
              const updated = [...prev];
              updated[i] = {
                ...updated[i],
                progress: 0,
                status: "error",
                error: error.error || "Upload failed"
              };
              return updated;
            });
            toast(`Failed to upload ${file.name}: ${error.error || "Upload failed"}`, "error");
          }
        } catch (error) {
          setUploadProgress(prev => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              progress: 0,
              status: "error",
              error: "Network error"
            };
            return updated;
          });
          toast(`Failed to upload ${file.name}`, "error");
        }
      }

      // Wait a bit then refresh and close
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFiles([]);
        setUploadDescription("");
        setUploadProgress([]);
        fetchItems();
        toast("Upload completed", "success");
      }, 1000);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast("Failed to upload files", "error");
    } finally {
      setUploading(false);
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast("Folder name is required", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("action", "createFolder");
      formData.append("name", newFolderName);
      if (currentFolderId) formData.append("folderId", currentFolderId);
      if (newFolderDescription) formData.append("description", newFolderDescription);

      const response = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowFolderModal(false);
        setNewFolderName("");
        setNewFolderDescription("");
        toast("Folder created successfully", "success");
        fetchItems();
      } else {
        const error = await response.json();
        toast(error.error || "Failed to create folder", "error");
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast("Failed to create folder", "error");
    }
  };

  // Handle download
  const handleDownload = async (item: GalleryItem) => {
    if (item.type === "FOLDER") {
      toast("Cannot download folders", "warning");
      return;
    }

    if (item.url) {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Download started", "success");
    }
  };

  // Handle bulk download
  const handleBulkDownload = async () => {
    const files = galleryItems.filter(item => 
      item.type === "FILE" && selectedItems.has(item.id)
    );
    
    if (files.length === 0) {
      toast("No files selected", "warning");
      return;
    }

    files.forEach(item => {
      if (item.url) {
        const link = document.createElement("a");
        link.href = item.url;
        link.download = item.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
    
    toast(`Downloaded ${files.length} file(s)`, "success");
  };

  // Handle delete
  const handleDelete = async (item: GalleryItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/gallery?id=${item.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast("Item deleted successfully", "success");
        fetchItems();
      } else {
        const error = await response.json();
        toast(error.error || "Failed to delete item", "error");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast("Failed to delete item", "error");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const itemsToDelete = galleryItems.filter(item => selectedItems.has(item.id));
    
    if (itemsToDelete.length === 0) {
      toast("No items selected", "warning");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${itemsToDelete.length} item(s)?`)) {
      return;
    }

    try {
      const deletePromises = itemsToDelete.map(item =>
        fetch(`/api/gallery?id=${item.id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter(r => r.status === "fulfilled").length;
      const failCount = results.length - successCount;

      if (failCount === 0) {
        toast(`Deleted ${successCount} item(s) successfully`, "success");
      } else {
        toast(`Deleted ${successCount} item(s), ${failCount} failed`, "warning");
      }

      setSelectedItems(new Set());
      fetchItems();
    } catch (error) {
      console.error("Error deleting items:", error);
      toast("Failed to delete items", "error");
    }
  };

  // Handle edit/rename
  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item.id);
    setEditName(item.name);
    setEditDescription(item.description || "");
  };

  const handleSaveEdit = async (itemId: string) => {
    try {
      const response = await fetch(`/api/gallery/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
        }),
      });

      if (response.ok) {
        toast("Item updated successfully", "success");
        setEditingItem(null);
        setEditName("");
        setEditDescription("");
        fetchItems();
      } else {
        const error = await response.json();
        toast(error.error || "Failed to update item", "error");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast("Failed to update item", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditName("");
    setEditDescription("");
  };

  // Handle folder navigation
  const handleFolderClick = (folder: GalleryItem) => {
    setFolderStack([...folderStack, folder]);
    setCurrentFolderId(folder.id);
  };

  const handleBack = () => {
    if (folderStack.length > 0) {
      const newStack = [...folderStack];
      newStack.pop();
      setFolderStack(newStack);
      setCurrentFolderId(newStack.length > 0 ? newStack[newStack.length - 1].id : null);
    } else {
      setCurrentFolderId(null);
    }
  };

  // Handle selection
  const toggleSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === galleryItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(galleryItems.map(item => item.id)));
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOver(false);
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      // Filter to only allow files, not folders
      const validFiles = files.filter(file => file.type || file.size > 0);
      if (validFiles.length > 0) {
        setUploadFiles(validFiles);
        setShowUploadModal(true);
      } else {
        toast("Please select valid files to upload", "warning");
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setUploadFiles(files);
    }
  };

  // Handle image preview
  const openPreview = (item: GalleryItem) => {
    if (item.type === "FILE" && isImage(item.mimeType) && item.url) {
      const images = galleryItems.filter(i => 
        i.type === "FILE" && isImage(i.mimeType) && i.url
      );
      const index = images.findIndex(i => i.id === item.id);
      setPreviewIndex(index >= 0 ? index : 0);
      setShowPreview(item);
    }
  };

  const navigatePreview = (direction: "prev" | "next") => {
    const images = galleryItems.filter(i => 
      i.type === "FILE" && isImage(i.mimeType) && i.url
    );
    
    if (direction === "prev") {
      const newIndex = previewIndex > 0 ? previewIndex - 1 : images.length - 1;
      setPreviewIndex(newIndex);
      setShowPreview(images[newIndex]);
    } else {
      const newIndex = previewIndex < images.length - 1 ? previewIndex + 1 : 0;
      setPreviewIndex(newIndex);
      setShowPreview(images[newIndex]);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Check if item is image
  const isImage = (mimeType: string | null | undefined) => {
    return mimeType?.startsWith("image/") || false;
  };

  // Get image items for preview navigation
  const imageItems = galleryItems.filter(i => 
    i.type === "FILE" && isImage(i.mimeType) && i.url
  );

  const filteredItems = galleryItems;

  return (
    <div 
      className="space-y-6"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-[60] flex items-center justify-center border-4 border-dashed border-blue-500">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl text-center">
            <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Drop files here to upload
            </p>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {currentFolderId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {folderStack.length > 0 ? folderStack[folderStack.length - 1].name : "All Gallery"}
            </h1>
            {folderStack.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {folderStack.map((f, i) => (
                  <span key={f.id}>
                    {i > 0 && " / "}
                    {f.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
          <div className="text-sm text-gray-600 dark:text-gray-400 order-2 md:order-1">
            Dashboard <span className="mx-2">&gt;</span> Gallery
          </div>
          <div className="flex-1 md:flex-initial order-1 md:order-2 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search here..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
            {selectedItems.size > 0 && (
              <>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleBulkDownload}
                >
                  <Download className="h-4 w-4" />
                  Download ({selectedItems.size})
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete ({selectedItems.size})
                </Button>
              </>
            )}
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowFolderModal(true)}
            >
              <FolderPlus className="h-4 w-4" />
              Create folder
            </Button>
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3 ml-3">
              <label className="text-sm text-gray-600 dark:text-gray-400">Filter:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-2 pr-8 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="all">All</option>
                <option value="FILE">Files Only</option>
                <option value="FOLDER">Folders Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label={selectedItems.size === galleryItems.length ? "Deselect all" : "Select all"}
          >
            {selectedItems.size === galleryItems.length ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            {selectedItems.size > 0 && ` • ${selectedItems.size} selected`}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Sort</label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="name">Name</option>
                <option value="date">Date Created</option>
                <option value="size">Size</option>
                <option value="type">Type</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-600 rounded-lg p-1 bg-white dark:bg-gray-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="Grid view"
            >
              <Grid3x3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid/List */}
      {loading ? (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 dark:text-gray-400 mt-4">Loading...</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">No items found</p>
            <Button 
              onClick={() => setShowUploadModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className={`bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow group relative ${
                selectedItems.has(item.id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <CardContent className="p-0">
                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                  {/* Selection Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      onClick={() => toggleSelection(item.id)}
                      className="p-1 bg-white/90 dark:bg-gray-800/90 rounded hover:bg-white dark:hover:bg-gray-800 transition-colors"
                      aria-label={selectedItems.has(item.id) ? "Deselect" : "Select"}
                    >
                      {selectedItems.has(item.id) ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {item.type === "FOLDER" ? (
                    <div className="flex items-center justify-center h-full">
                      <Folder className="h-16 w-16 text-blue-500" />
                    </div>
                  ) : isImage(item.mimeType) && item.url ? (
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover cursor-pointer"
                      onClick={() => openPreview(item)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <File className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {item.type === "FILE" && isImage(item.mimeType) && item.url && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => openPreview(item)}
                        className="bg-white hover:bg-gray-100"
                        aria-label="Preview image"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                    )}
                    {item.type === "FILE" && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDownload(item)}
                        className="bg-white hover:bg-gray-100"
                        aria-label="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={() => handleEdit(item)}
                      className="bg-white hover:bg-gray-100"
                      aria-label="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      className="bg-red-500 hover:bg-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  {editingItem === item.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(item.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p 
                          className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 flex-1 cursor-pointer hover:text-blue-600"
                          onClick={() => item.type === "FOLDER" ? handleFolderClick(item) : openPreview(item)}
                          title={item.name}
                        >
                          {item.name}
                        </p>
                        {item.type === "FOLDER" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFolderClick(item)}
                            className="flex-shrink-0"
                            aria-label="Open folder"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {item.type === "FILE" && item.size && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatFileSize(item.size)}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ${
                    selectedItems.has(item.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <button
                    onClick={() => toggleSelection(item.id)}
                    className="flex-shrink-0"
                    aria-label={selectedItems.has(item.id) ? "Deselect" : "Select"}
                  >
                    {selectedItems.has(item.id) ? (
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                    {item.type === "FOLDER" ? (
                      <div className="flex items-center justify-center h-full">
                        <Folder className="h-10 w-10 text-blue-500" />
                      </div>
                    ) : isImage(item.mimeType) && item.url ? (
                      <Image
                        src={item.url}
                        alt={item.name}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => openPreview(item)}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <File className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingItem === item.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm mb-2"
                          autoFocus
                        />
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description (optional)"
                          className="text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(item.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p 
                          className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate cursor-pointer hover:text-blue-600"
                          onClick={() => item.type === "FOLDER" ? handleFolderClick(item) : openPreview(item)}
                          title={item.name}
                        >
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                            {item.description}
                          </p>
                        )}
                        {item.type === "FILE" && (
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {item.size && <span>{formatFileSize(item.size)}</span>}
                            {item.mimeType && <span>{item.mimeType}</span>}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                        )}
                        {item.type === "FOLDER" && item.items && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.items.length} item{item.items.length !== 1 ? "s" : ""}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.type === "FOLDER" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFolderClick(item)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    ) : (
                      <>
                        {isImage(item.mimeType) && item.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPreview(item)}
                          >
                            <ZoomIn className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(item)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upload Files</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                    setUploadDescription("");
                    setUploadProgress([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Files
                  </label>
                  <div
                    className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-700/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                      Click to browse or drag and drop files here
                    </p>
                  </div>
                  {uploadFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {uploadFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                          </span>
                          {uploadProgress[index] && (
                            <div className="ml-4 flex items-center gap-2">
                              {uploadProgress[index].status === "uploading" && (
                                <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 transition-all"
                                    style={{ width: `${uploadProgress[index].progress}%` }}
                                  />
                                </div>
                              )}
                              {uploadProgress[index].status === "success" && (
                                <Check className="h-4 w-4 text-green-600" />
                              )}
                              {uploadProgress[index].status === "error" && (
                                <X className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setUploadFiles(prev => prev.filter((_, i) => i !== index));
                              setUploadProgress(prev => prev.filter((_, i) => i !== index));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <Input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Enter description for all files..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFiles([]);
                      setUploadDescription("");
                      setUploadProgress([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadFiles.length === 0 || uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? "Uploading..." : `Upload ${uploadFiles.length} file(s)`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Folder</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowFolderModal(false);
                    setNewFolderName("");
                    setNewFolderDescription("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Folder Name *
                  </label>
                  <Input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateFolder();
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description (optional)
                  </label>
                  <Input
                    type="text"
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                    placeholder="Enter description..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateFolder();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFolderModal(false);
                      setNewFolderName("");
                      setNewFolderDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateFolder}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Image Preview Modal */}
      {showPreview && showPreview.url && (
        <div 
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center"
          onClick={() => setShowPreview(null)}
        >
          <button
            onClick={() => setShowPreview(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded transition-colors"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
          
          {imageItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePreview("prev");
                }}
                className="absolute left-4 text-white hover:bg-white/20 p-2 rounded transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigatePreview("next");
                }}
                className="absolute right-4 text-white hover:bg-white/20 p-2 rounded transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="max-w-7xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={showPreview.url}
                alt={showPreview.name}
                width={1200}
                height={1200}
                className="max-w-full max-h-[90vh] object-contain"
                unoptimized
              />
            </div>
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-semibold">{showPreview.name}</p>
              {showPreview.description && (
                <p className="text-sm text-gray-300 mt-1">{showPreview.description}</p>
              )}
              {imageItems.length > 1 && (
                <p className="text-sm text-gray-400 mt-2">
                  {previewIndex + 1} of {imageItems.length}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}