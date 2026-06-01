import { apiRequest } from "./apiClient";

export function getCategories() {
  return apiRequest("/categories");
}

export function getAllCategories() {
  return apiRequest("/categories/all");
}

export function getCategoryById(id) {
  return apiRequest(`/categories/${id}`);
}

export function createCategory(data) {
  return apiRequest("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id, data) {
  return apiRequest(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id) {
  return apiRequest(`/categories/${id}`, {
    method: "DELETE",
  });
}