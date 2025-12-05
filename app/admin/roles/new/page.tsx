"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Module = "roles" | "users" | "product" | "category" | "attributes" | "order" | "location";
type Action = "all" | "index" | "create" | "edit" | "delete";

interface Permissions {
  [module: string]: {
    [action: string]: boolean;
  };
}

const modules: { key: Module; label: string }[] = [
  { key: "roles", label: "Roles" },
  { key: "users", label: "Users" },
  { key: "product", label: "Product" },
  { key: "category", label: "Category" },
  { key: "attributes", label: "Attributes" },
  { key: "order", label: "Order" },
  { key: "location", label: "Location" },
];

const actions: { key: Action; label: string }[] = [
  { key: "all", label: "All" },
  { key: "index", label: "Index" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];

export default function NewRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePermissionChange = (module: Module, action: Action, checked: boolean) => {
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      if (!newPermissions[module]) {
        newPermissions[module] = {};
      }
      newPermissions[module][action] = checked;

      // If "all" is checked, check all other actions
      if (action === "all" && checked) {
        actions.forEach((a) => {
          if (a.key !== "all") {
            newPermissions[module][a.key] = true;
          }
        });
      }
      // If "all" is unchecked, uncheck all other actions
      else if (action === "all" && !checked) {
        actions.forEach((a) => {
          if (a.key !== "all") {
            newPermissions[module][a.key] = false;
          }
        });
      }
      // If any other action is unchecked, uncheck "all"
      else if (action !== "all" && !checked) {
        newPermissions[module]["all"] = false;
      }
      // If all other actions are checked, check "all"
      else if (action !== "all" && checked) {
        const allOtherActionsChecked = actions
          .filter((a) => a.key !== "all")
          .every((a) => newPermissions[module][a.key] === true || (a.key === action && checked));
        if (allOtherActionsChecked) {
          newPermissions[module]["all"] = true;
        }
      }

      return newPermissions;
    });
  };

  const isPermissionChecked = (module: Module, action: Action): boolean => {
    return permissions[module]?.[action] === true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Role name is required");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          permissions: permissions,
        }),
      });

      if (res.ok) {
        router.push("/admin/roles");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create role");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to create role:", error);
      setError("Failed to create role. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header with Title and Breadcrumb */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Role</h1>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Dashboard <span className="mx-2">&gt;</span> Roles{" "}
          <span className="mx-2">&gt;</span> Create role
        </div>
      </div>

      {/* Form Card */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </div>
            )}

            {/* Name Section */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Username"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Permissions Section */}
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
                Permissions
              </label>
              
              {/* Permissions Grid */}
              <div className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Module
                        </th>
                        {actions.map((action) => (
                          <th
                            key={action.key}
                            className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                          >
                            {action.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900">
                      {modules.map((module, index) => (
                        <tr 
                          key={module.key} 
                          className={index < modules.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {module.label}
                          </td>
                          {actions.map((action) => (
                            <td key={action.key} className="px-6 py-4 whitespace-nowrap text-center">
                              <input
                                type="checkbox"
                                checked={isPermissionChecked(module.key, action.key)}
                                onChange={(e) =>
                                  handlePermissionChange(
                                    module.key,
                                    action.key,
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer bg-white dark:bg-gray-800"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-medium"
              >
                {isLoading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

