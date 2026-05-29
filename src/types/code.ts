export type CodeLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "csharp"
  | "html"
  | "css"
  | "sql";

export interface CodeSnippet {
  id: string;
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  language: CodeLanguage;
  extension: string;
  code: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type SaveCodeSnippetInput = {
  userId: string;
  authorName: string;
  authorAvatar: string | null;
  title: string;
  language: CodeLanguage;
  extension: string;
  code: string;
};
