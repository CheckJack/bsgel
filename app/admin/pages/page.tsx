"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ChevronDown, Plus, ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface Page {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  status: string;
}

export default function AdminPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);

  // Mock data to match the design
  useEffect(() => {
    const mockPages: Page[] = [
      { id: "01", name: "Home 1", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "02", name: "Home 2", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "03", name: "Home 3", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "04", name: "About us", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "05", name: "Our Services", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "06", name: "Contact", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "07", name: "News", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "08", name: "Product detail", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "09", name: "Terms & Conditions", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "10", name: "Cookie Policy", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "11", name: "Privacy Policy", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "12", name: "FAQ", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "13", name: "Blog", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "14", name: "Shop", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "15", name: "Checkout", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
      { id: "16", name: "Cart", template: "Default", createdAt: "20 Nov 2023", status: "Published" },
    ];

    setPages(mockPages);
    setFilteredPages(mockPages);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Filter pages based on search query
    let filtered = pages;

    if (searchQuery.trim()) {
      filtered = pages.filter(
        (page) =>
          page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          page.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPages(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchQuery, pages]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const currentPageItems = filteredPages.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
      );
      setSelectedPages(currentPageItems.map((p) => p.id));
    } else {
      setSelectedPages([]);
    }
  };

  const handleSelectPage = (pageId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedPages((prev) =>
      prev.includes(pageId)
        ? prev.filter((id) => id !== pageId)
        : [...prev, pageId]
    );
  };

  const handleRowClick = (pageId: string) => {
    router.push(`/admin/pages/${pageId}`);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredPages.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedPages = filteredPages.slice(startIndex, endIndex);
  const startRecord = filteredPages.length > 0 ? startIndex + 1 : 0;
  const endRecord = Math.min(endIndex, filteredPages.length);
  const totalRecords = filteredPages.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header with Title and Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">List Page</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Page{" "}
          <span className="mx-2">&gt;</span> List Page
        </div>
      </div>

      {/* Control Panel */}
      <Card className="mb-6 bg-white dark:bg-gray-800">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Left side: Showing entries and Bulk Action */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Showing entries */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Showing</label>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500 -ml-6 pointer-events-none" />
                <label className="text-sm text-gray-600 dark:text-gray-400">entries</label>
              </div>

              {/* Bulk Action */}
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Bulk Action
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Right side: Filters, Search, and New Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1 lg:flex-initial lg:max-w-2xl">
              {/* Filters Button */}
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
              </Button>

              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search here..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* New Button */}
              <Link href="/admin/pages/new" className="flex-shrink-0">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card className="bg-white dark:bg-gray-800 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        paginatedPages.length > 0 &&
                        paginatedPages.every((p) => selectedPages.includes(p.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Created at
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedPages.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No pages found
                    </td>
                  </tr>
                ) : (
                  paginatedPages.map((page, index) => (
                    <tr
                      key={page.id}
                      onClick={() => handleRowClick(page.id)}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedPages.includes(page.id)}
                          onChange={() => handleSelectPage(page.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 cursor-pointer"
                        />
                      </td>

                      {/* ID */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          #{page.id}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {page.name}
                        </span>
                      </td>

                      {/* Template */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {page.template}
                        </span>
                      </td>

                      {/* Created at */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {page.createdAt}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {page.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredPages.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startRecord} to {endRecord} in {totalRecords} records
                </div>
                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                    )
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {page}
                        </button>
                        {idx < arr.length - 1 &&
                          arr[idx + 1] !== page + 1 && (
                            <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
                          )}
                      </div>
                    ))}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

