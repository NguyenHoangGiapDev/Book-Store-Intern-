import { apiRequest } from "./apiClient";

export function getBooks() {
  return apiRequest("/books");
}

export function getBookById(id) {
  return apiRequest(`/books/${id}`);
}

export function createBook(data) {
  return apiRequest("/books", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateBook(id, data) {
  return apiRequest(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBook(id) {
  return apiRequest(`/books/${id}`, {
    method: "DELETE",
  });
}