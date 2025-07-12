import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

// Read tool implementation
export async function readTool(input: { file_path: string; limit?: number; offset?: number }): Promise<ToolResult> {
  try {
    const { file_path, limit, offset } = input;
    const content = await fs.readFile(file_path, 'utf-8');
    const lines = content.split('\n');
    
    let resultLines = lines;
    if (offset !== undefined) {
      resultLines = resultLines.slice(offset);
    }
    if (limit !== undefined) {
      resultLines = resultLines.slice(0, limit);
    }
    
    const result = resultLines.map((line, index) => {
      const lineNumber = (offset || 0) + index + 1;
      return `${lineNumber}\t${line}`;
    }).join('\n');
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Write tool implementation
export async function writeTool(input: { file_path: string; content: string }): Promise<ToolResult> {
  try {
    const { file_path, content } = input;
    const dir = path.dirname(file_path);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file_path, content, 'utf-8');
    
    return { success: true, data: `File written successfully: ${file_path}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Edit tool implementation
export async function editTool(input: { 
  file_path: string; 
  old_string: string; 
  new_string: string; 
  replace_all?: boolean 
}): Promise<ToolResult> {
  try {
    const { file_path, old_string, new_string, replace_all } = input;
    let content = await fs.readFile(file_path, 'utf-8');
    
    if (replace_all) {
      content = content.replaceAll(old_string, new_string);
    } else {
      const index = content.indexOf(old_string);
      if (index === -1) {
        return { success: false, error: 'String not found in file' };
      }
      content = content.substring(0, index) + new_string + content.substring(index + old_string.length);
    }
    
    await fs.writeFile(file_path, content, 'utf-8');
    return { success: true, data: `File edited successfully: ${file_path}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Bash tool implementation
export async function bashTool(input: { command: string; timeout?: number }): Promise<ToolResult> {
  try {
    const { command, timeout = 120000 } = input;
    const { stdout, stderr } = await execAsync(command, { timeout });
    
    return { 
      success: true, 
      data: {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      }
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      data: {
        stdout: error.stdout?.trim(),
        stderr: error.stderr?.trim(),
        code: error.code,
      }
    };
  }
}

// List files tool implementation
export async function listTool(input: { path: string; ignore?: string[] }): Promise<ToolResult> {
  try {
    const { path: dirPath, ignore = [] } = input;
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    const filtered = entries.filter(entry => {
      const name = entry.name;
      return !ignore.some(pattern => {
        // Simple glob matching (just for demonstration)
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(name);
        }
        return name === pattern;
      });
    });
    
    const result = filtered.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
    }));
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Grep tool implementation
export async function grepTool(input: { 
  pattern: string; 
  path?: string; 
  include?: string; 
  exclude?: string;
  case_insensitive?: boolean;
}): Promise<ToolResult> {
  try {
    const { pattern, path: searchPath = '.', include, exclude, case_insensitive } = input;
    
    let command = `grep -r`;
    if (case_insensitive) command += ' -i';
    if (include) command += ` --include="${include}"`;
    if (exclude) command += ` --exclude="${exclude}"`;
    command += ` "${pattern}" "${searchPath}"`;
    
    const { stdout, stderr } = await execAsync(command);
    
    return { 
      success: true, 
      data: stdout.trim().split('\n').filter(line => line),
    };
  } catch (error: any) {
    // Grep returns exit code 1 when no matches found
    if (error.code === 1) {
      return { success: true, data: [] };
    }
    return { success: false, error: error.message };
  }
}

// Tool definitions for Claude
export const CLAUDE_TOOLS = [
  {
    name: 'read',
    description: 'Read a file from the filesystem',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        limit: { type: 'number', description: 'Number of lines to read' },
        offset: { type: 'number', description: 'Line number to start from' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'write',
    description: 'Write content to a file',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['file_path', 'content'],
    },
  },
  {
    name: 'edit',
    description: 'Edit a file by replacing text',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: 'Absolute path to the file' },
        old_string: { type: 'string', description: 'Text to replace' },
        new_string: { type: 'string', description: 'Replacement text' },
        replace_all: { type: 'boolean', description: 'Replace all occurrences' },
      },
      required: ['file_path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'bash',
    description: 'Execute a bash command',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: { type: 'string', description: 'Command to execute' },
        timeout: { type: 'number', description: 'Timeout in milliseconds' },
      },
      required: ['command'],
    },
  },
  {
    name: 'list',
    description: 'List files and directories',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: { type: 'string', description: 'Directory path' },
        ignore: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Patterns to ignore' 
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'grep',
    description: 'Search for patterns in files',
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: { type: 'string', description: 'Search pattern' },
        path: { type: 'string', description: 'Path to search in' },
        include: { type: 'string', description: 'File pattern to include' },
        exclude: { type: 'string', description: 'File pattern to exclude' },
        case_insensitive: { type: 'boolean', description: 'Case insensitive search' },
      },
      required: ['pattern'],
    },
  },
];

// Tool implementation map
export const TOOL_IMPLEMENTATIONS = {
  read: readTool,
  write: writeTool,
  edit: editTool,
  bash: bashTool,
  list: listTool,
  grep: grepTool,
};