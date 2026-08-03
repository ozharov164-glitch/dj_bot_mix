import { describe, expect, it } from "vitest";
import { formatFileCount, pluralRu } from "./plural";

describe("pluralRu", () => {
  it("picks one / few / many forms", () => {
    expect(pluralRu(1, "файл", "файла", "файлов")).toBe("файл");
    expect(pluralRu(2, "файл", "файла", "файлов")).toBe("файла");
    expect(pluralRu(4, "файл", "файла", "файлов")).toBe("файла");
    expect(pluralRu(5, "файл", "файла", "файлов")).toBe("файлов");
    expect(pluralRu(11, "файл", "файла", "файлов")).toBe("файлов");
    expect(pluralRu(21, "файл", "файла", "файлов")).toBe("файл");
    expect(pluralRu(22, "файл", "файла", "файлов")).toBe("файла");
  });
});

describe("formatFileCount", () => {
  it("formats readable Russian file counts", () => {
    expect(formatFileCount(0)).toBe("0 файлов");
    expect(formatFileCount(1)).toBe("1 файл");
    expect(formatFileCount(2)).toBe("2 файла");
    expect(formatFileCount(5)).toBe("5 файлов");
  });
});
