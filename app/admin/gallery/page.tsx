"use client";

import { useState, useEffect, useRef } from "react";
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
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export default function GalleryPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<GalleryItem[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch gallery items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (currentFolderId) params.append("folderId", currentFolderId);
      if (searchQuery) params.append("search", searchQuery);
      if (filterType !== "all") params.append("type", filterType);
      params.append("sortBy", sortBy);

      const response = await fetch(`/api/gallery?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setGalleryItems(data);
      } else {
        console.error("Failed to fetch gallery items");
      }
    } catch (error) {
      console.error("Error fetching gallery items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentFolderId, searchQuery, filterType, sortBy]);

  // Handle upload
  const handleUpload = async () => {
    if (!uploadFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("action", "upload");
      formData.append("file", uploadFile);
      if (currentFolderId) formData.append("folderId", currentFolderId);
      if (uploadDescription) formData.append("description", uploadDescription);

      const response = await fetch("/api/gallery", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadDescription("");
        fetchItems();
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}\n\nDetails: ${error.details}` 
          : error.error || "Failed to upload file";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert("Folder name is required");
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
        fetchItems();
      } else {
        const error = await response.json();
        const errorMessage = error.details 
          ? `${error.error}\n\nDetails: ${error.details}` 
          : error.error || "Failed to create folder";
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      alert("Failed to create folder");
    }
  };

  // Handle download
  const handleDownload = async (item: GalleryItem) => {
    if (item.type === "FOLDER") {
      alert("Cannot download folders");
      return;
    }

    if (item.url) {
      const link = document.createElement("a");
      link.href = item.url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
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
        fetchItems();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
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

  // Format file size
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Check if item is image
  const isImage = (mimeType: string | null | undefined) => {
    return mimeType?.startsWith("image/") || false;
  };

  const filteredItems = galleryItems;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          {currentFolderId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="flex-shrink-0"
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
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                const selectedItems = galleryItems.filter(item => item.type === "FILE");
                if (selectedItems.length === 0) {
                  alert("No files to download");
                  return;
                }
                selectedItems.forEach(item => handleDownload(item));
              }}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowFolderModal(true)}
            >
              <FolderPlus className="h-4 w-4" />
              Create folder
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setShowFilterModal(true)}
            >
              <Filter className="h-4 w-4" />
              Filter {filterType !== "all" && `(${filterType})`}
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                if (currentFolderId) {
                  handleBack();
                } else {
                  alert("You are already at the root level");
                }
              }}
            >
              <Eye className="h-4 w-4" />
              View in {currentFolderId ? "(Back)" : "(Root)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gallery Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
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
                <option value="date">Date</option>
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
            <p className="text-gray-500 dark:text-gray-400">No items found</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card 
              key={item.id} 
              className="bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow group relative"
            >
              <CardContent className="p-0">
                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                  {item.type === "FOLDER" ? (
                    <div className="flex items-center justify-center h-full">
                      <Folder className="h-16 w-16 text-blue-500" />
                    </div>
                  ) : isImage(item.mimeType) && item.url ? (
                    <Image
                      src={item.url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <File className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {item.type === "FILE" && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleDownload(item)}
                        className="bg-white hover:bg-gray-100"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(item)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 flex-1">
                      {item.name}
                    </p>
                    {item.type === "FOLDER" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleFolderClick(item)}
                        className="flex-shrink-0"
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
                  className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                >
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
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <File className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
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
                      </div>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(item)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
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
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upload File</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                    setUploadDescription("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full"
                  />
                  {uploadFile && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                    </p>
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
                    placeholder="Enter description..."
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setUploadDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? "Uploading..." : "Upload"}
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

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-white dark:bg-gray-800 w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filter</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilterModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="FILE">Files Only</option>
                    <option value="FOLDER">Folders Only</option>
                  </select>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterType("all");
                      setShowFilterModal(false);
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={() => setShowFilterModal(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
