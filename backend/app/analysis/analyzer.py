"""
Repository analysis pipeline - extracts modules and dependencies from source code.
Supports multiple languages: Python, JavaScript, TypeScript, Java, C#
"""
import os
import ast
import re
from typing import List, Dict, Set, Tuple, Optional
from pathlib import Path
from dataclasses import dataclass, field


@dataclass
class Dependency:
    """Represents a single dependency relationship."""
    source: str  # module that imports
    target: str  # module being imported
    import_type: str  # 'import', 'from_import'
    line_number: int


@dataclass
class ModuleInfo:
    """Information about a code module."""
    name: str
    file_path: str
    imports: List[str] = field(default_factory=list)
    layer: Optional[str] = None
    is_test: bool = False


class RepositoryAnalyzer:
    """
    Analyzes a repository to extract module structure and dependencies.
    """

    IGNORED_DIRS = {
        '__pycache__', 'node_modules', 'venv', 'env', '.venv', 
        'build', 'dist', '.git', '.idea', '.vscode', 'target',
        'bin', 'obj', 'packages'
    }

    IGNORED_FILES = {
        '__init__.py', 'setup.py', 'conftest.py'
    }
    
    # File extensions to analyze by language
    SOURCE_EXTENSIONS = {
        # Python
        '.py',
        # JavaScript/TypeScript
        '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
        # Java/JVM languages
        '.java', '.kt', '.scala', '.groovy',
        # C family
        '.c', '.h', '.cpp', '.cc', '.cxx', '.hpp', '.hxx',
        # C#/.NET
        '.cs', '.vb', '.fs',
        # Go
        '.go',
        # Rust
        '.rs',
        # Ruby
        '.rb',
        # PHP
        '.php',
        # Swift
        '.swift',
        # Objective-C
        '.m', '.mm',
        # Dart
        '.dart',
        # Lua
        '.lua',
        # Perl
        '.pl', '.pm',
        # Elixir
        '.ex', '.exs',
        # Haskell
        '.hs',
        # Clojure
        '.clj', '.cljs',
        # R
        '.r', '.R',
        # Shell
        '.sh', '.bash',
        # SQL
        '.sql',
        # HTML/CSS (for completeness)
        '.html', '.htm', '.css', '.scss', '.sass', '.less',
    }
    
    # Language-specific import patterns
    IMPORT_PATTERNS = {
        # Python
        '.py': [
            (r'^\s*import\s+([\w\.]+)', 'import'),
            (r'^\s*from\s+([\w\.]+)\s+import', 'from_import'),
        ],
        # JavaScript/TypeScript
        '.js': [
            (r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]', 'es6_import'),
            (r'import\s+[\'"]([^\'"]+)[\'"]', 'es6_import_bare'),
            (r'require\([\'"]([^\'"]+)[\'"]\)', 'require'),
            (r'import\s*\([\'"]([^\'"]+)[\'"]\)', 'dynamic_import'),
        ],
        # Java
        '.java': [
            (r'^\s*import\s+([\w\.]+\*?);', 'import'),
            (r'^\s*import\s+static\s+([\w\.]+);', 'static_import'),
        ],
        # C#
        '.cs': [
            (r'^\s*using\s+([\w\.]+);', 'using'),
            (r'^\s*using\s+static\s+([\w\.]+);', 'using_static'),
        ],
        # Go
        '.go': [
            (r'^\s*import\s+"([^"]+)"', 'import'),
            (r'^\s*import\s+\(\s*"([^"]+)"', 'import_block'),
        ],
        # Rust
        '.rs': [
            (r'^\s*use\s+([\w:]+)', 'use'),
            (r'^\s*extern\s+crate\s+(\w+)', 'extern_crate'),
        ],
        # Ruby
        '.rb': [
            (r'^\s*require\s+[\'"]([^\'"]+)[\'"]', 'require'),
            (r'^\s*require_relative\s+[\'"]([^\'"]+)[\'"]', 'require_relative'),
            (r'^\s*load\s+[\'"]([^\'"]+)[\'"]', 'load'),
        ],
        # PHP
        '.php': [
            (r'^\s*use\s+([\w\\]+)', 'use'),
            (r'^\s*require\s+[\'"]([^\'"]+)[\'"]', 'require'),
            (r'^\s*require_once\s+[\'"]([^\'"]+)[\'"]', 'require_once'),
            (r'^\s*include\s+[\'"]([^\'"]+)[\'"]', 'include'),
        ],
        # Swift
        '.swift': [
            (r'^\s*import\s+(\w+)', 'import'),
        ],
        # Kotlin
        '.kt': [
            (r'^\s*import\s+([\w\.]+)', 'import'),
        ],
        # Scala
        '.scala': [
            (r'^\s*import\s+([\w\.]+)', 'import'),
        ],
        # Dart
        '.dart': [
            (r'^\s*import\s+[\'"]([^\'"]+)[\'"]', 'import'),
            (r'^\s*export\s+[\'"]([^\'"]+)[\'"]', 'export'),
        ],
        # Elixir
        '.ex': [
            (r'^\s*import\s+(\w+)', 'import'),
            (r'^\s*alias\s+([\w\.]+)', 'alias'),
            (r'^\s*use\s+([\w\.]+)', 'use'),
        ],
        # Haskell
        '.hs': [
            (r'^\s*import\s+([\w\.]+)', 'import'),
            (r'^\s*import\s+qualified\s+([\w\.]+)', 'qualified_import'),
        ],
        # C/C++
        '.cpp': [
            (r'^\s*#include\s+[<"]([^>"]+)[>"]', 'include'),
        ],
        # Lua
        '.lua': [
            (r'require\s*\(?[\'"]([^\'"]+)[\'"]\)?', 'require'),
        ],
    }

    def __init__(self, repo_path: str, include_tests: bool = False):
        """
        Initialize repository analyzer.
        
        Args:
            repo_path: Path to repository root
            include_tests: Whether to include test files in analysis
        """
        self.repo_path = Path(repo_path)
        self.include_tests = include_tests
        self.modules: Dict[str, ModuleInfo] = {}
        self.dependencies: List[Dependency] = []

    def analyze(self) -> Tuple[Dict[str, ModuleInfo], List[Dependency]]:
        """
        Run full analysis pipeline.
        
        Returns:
            Tuple of (modules dict, dependencies list)
        """
        print(f"Analyzing repository: {self.repo_path}")
        
        # Walk directory and find source files
        source_files = self._find_source_files()
        print(f"Found {len(source_files)} source files")
        
        # Extract modules and dependencies
        for file_path in source_files:
            self._analyze_file(file_path)
        
        print(f"Extracted {len(self.modules)} modules and {len(self.dependencies)} dependencies")
        return self.modules, self.dependencies

    def _find_source_files(self) -> List[Path]:
        """
        Walk directory tree and find all source files.
        
        Returns:
            List of Path objects for source files
        """
        source_files = []
        
        for root, dirs, files in os.walk(self.repo_path):
            # Remove ignored directories from traversal
            dirs[:] = [d for d in dirs if d not in self.IGNORED_DIRS]
            
            for file in files:
                file_path = Path(root) / file
                
                # Check if file has a supported extension
                if file_path.suffix not in self.SOURCE_EXTENSIONS:
                    continue
                
                # Skip ignored files
                if file in self.IGNORED_FILES:
                    continue
                    
                # Skip test files if not included
                if not self.include_tests and self._is_test_file(file_path):
                    continue
                
                source_files.append(file_path)
        
        return source_files

    def _is_test_file(self, file_path: Path) -> bool:
        """Check if file is a test file."""
        name = file_path.name.lower()
        path_str = str(file_path).lower()
        return (
            name.startswith('test_') or 
            name.endswith('_test.py') or
            '/tests/' in path_str or
            '\\tests\\' in path_str
        )

    def _analyze_file(self, file_path: Path):
        """
        Analyze a single source file.
        Routes to appropriate parser based on file extension.
        
        Args:
            file_path: Path to source file
        """
        try:
            extension = file_path.suffix.lower()
            
            if extension == '.py':
                self._analyze_python_file(file_path)
            elif extension in self.IMPORT_PATTERNS:
                # Use pattern-based analysis for languages with defined patterns
                self._analyze_with_patterns(file_path, extension)
            else:
                # Generic analysis for languages without specific patterns
                self._analyze_generic_file(file_path)
                
        except Exception as e:
            print(f"Warning: Failed to analyze {file_path}: {e}")

    def _analyze_python_file(self, file_path: Path):
        """
        Analyze a Python file using AST.
        
        Args:
            file_path: Path to Python file
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                source = f.read()
            
            tree = ast.parse(source, filename=str(file_path))
            module_name = self._get_module_name(file_path)
            
            # Create module info
            module_info = ModuleInfo(
                name=module_name,
                file_path=str(file_path.relative_to(self.repo_path)),
                is_test=self._is_test_file(file_path)
            )
            
            # Extract imports
            imports = self._extract_imports(tree, file_path)
            module_info.imports = imports
            
            # Store module
            self.modules[module_name] = module_info
            
            # Create dependency edges
            for imported_module in imports:
                self.dependencies.append(
                    Dependency(
                        source=module_name,
                        target=imported_module,
                        import_type='import',
                        line_number=0  # Can be enhanced to track exact line
                    )
                )
        
        except Exception as e:
            print(f"Error analyzing {file_path}: {e}")

    def _get_module_name(self, file_path: Path) -> str:
        """
        Convert file path to module name.
        
        Example: src/services/user_service.py -> services.user_service
        """
        relative_path = file_path.relative_to(self.repo_path)
        module_path = str(relative_path.with_suffix(''))
        module_name = module_path.replace(os.sep, '.')
        return module_name

    def _extract_imports(self, tree: ast.AST, file_path: Path) -> List[str]:
        """
        Extract all import statements from AST.
        
        Args:
            tree: AST of the file
            file_path: Path to file (for context)
            
        Returns:
            List of imported module names (relative to repo)
        """
        imports = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)
        
        # Filter to only internal imports (heuristic)
        internal_imports = [
            imp for imp in imports 
            if not self._is_external_import(imp)
        ]
        
        return internal_imports

    def _is_external_import(self, module_name: str) -> bool:
        """
        Determine if import is external library or internal module.
        
        Heuristic: external if it's a common library name.
        """
        external_prefixes = {
            'fastapi', 'pydantic', 'sqlalchemy', 'requests', 'flask',
            'django', 'numpy', 'pandas', 'torch', 'tensorflow',
            'os', 'sys', 'json', 'typing', 'datetime', 'pathlib',
            'asyncio', 'logging', 'collections', 're', 'unittest'
        }
        
        first_part = module_name.split('.')[0]
        return first_part in external_prefixes

    def get_dependency_edges(self) -> List[Tuple[str, str]]:
        """
        Get simplified list of dependency edges.
        
        Returns:
            List of (from, to) tuples
        """
        return [(dep.source, dep.target) for dep in self.dependencies]
    def _analyze_with_patterns(self, file_path: Path, extension: str):
        """
        Analyze source file using language-specific regex patterns.
        Works for most languages with import/dependency statements.
        
        Args:
            file_path: Path to source file
            extension: File extension to determine patterns
        """
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                source = f.read()
            
            module_name = self._get_module_name(file_path)
            
            # Create module info
            module_info = ModuleInfo(
                name=module_name,
                file_path=str(file_path.relative_to(self.repo_path)),
                is_test=self._is_test_file(file_path)
            )
            
            # Extract imports using language-specific patterns
            imports = self._extract_imports_with_patterns(source, file_path, extension)
            module_info.imports = imports
            
            # Store module
            self.modules[module_name] = module_info
            
            # Create dependency edges
            for imported_module in imports:
                self.dependencies.append(
                    Dependency(
                        source=module_name,
                        target=imported_module,
                        import_type='import',
                        line_number=0
                    )
                )
        except Exception as e:
            print(f"Warning: Failed to analyze {extension} file {file_path}: {e}")

    def _extract_imports_with_patterns(self, source: str, file_path: Path, extension: str) -> List[str]:
        """
        Extract import statements using language-specific regex patterns.
        
        Args:
            source: Source code content
            file_path: Path to the file
            extension: File extension
        
        Returns:
            List of imported module names
        """
        imports = []
        patterns = self.IMPORT_PATTERNS.get(extension, [])
        
        # Handle extensions that share patterns (e.g., .jsx uses .js patterns)
        if not patterns:
            if extension in {'.jsx', '.tsx', '.mjs', '.cjs'}:
                patterns = self.IMPORT_PATTERNS.get('.js', [])
            elif extension in {'.h', '.hpp', '.hxx', '.cc', '.cxx'}:
                patterns = self.IMPORT_PATTERNS.get('.cpp', [])
            elif extension in {'.exs'}:
                patterns = self.IMPORT_PATTERNS.get('.ex', [])
        
        for pattern, import_type in patterns:
            matches = re.finditer(pattern, source, re.MULTILINE)
            for match in matches:
                module_path = match.group(1)
                
                # For relative imports (JavaScript, etc.), resolve them
                if extension in {'.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'}:
                    if module_path.startswith('.'):
                        module_name = self._resolve_relative_import(file_path, module_path)
                        if module_name:
                            imports.append(module_name)
                    # Skip node_modules/external packages
                    elif not self._is_external_js_import(module_path):
                        imports.append(module_path)
                else:
                    # For other languages, filter external libraries
                    if not self._is_external_import_generic(module_path, extension):
                        imports.append(module_path)
        
        return imports

    def _is_external_js_import(self, module_path: str) -> bool:
        """Check if a JavaScript import is external."""
        # External if it doesn't start with . or /
        if module_path.startswith(('.', '/')):
            return False
        # Common Node.js/external packages
        external_prefixes = {
            'react', 'vue', 'angular', 'lodash', 'axios', 'express',
            'node:', 'http', 'fs', 'path', 'url', '@types', '@angular',
            'next', 'nuxt', 'webpack', 'babel', 'eslint'
        }
        first_part = module_path.split('/')[0]
        return first_part in external_prefixes or first_part.startswith('@')

    def _is_external_import_generic(self, module_path: str, extension: str) -> bool:
        """
        Determine if an import is external for various languages.
        
        Args:
            module_path: The imported module path
            extension: File extension to determine language
        
        Returns:
            True if external library, False if internal module
        """
        # Java standard library packages
        if extension == '.java':
            java_stdlib = {'java.', 'javax.', 'org.w3c.', 'org.xml.', 'org.omg.'}
            return any(module_path.startswith(prefix) for prefix in java_stdlib)
        
        # C# standard library namespaces
        elif extension == '.cs':
            cs_stdlib = {'System.', 'Microsoft.'}
            return any(module_path.startswith(prefix) for prefix in cs_stdlib)
        
        # Go standard library
        elif extension == '.go':
            go_stdlib = {'fmt', 'io', 'os', 'net', 'http', 'time', 'sync', 'context'}
            first_part = module_path.split('/')[0]
            return first_part in go_stdlib
        
        # Rust standard library
        elif extension == '.rs':
            rust_stdlib = {'std', 'core', 'alloc'}
            first_part = module_path.split('::')[0]
            return first_part in rust_stdlib
        
        # Ruby standard library
        elif extension == '.rb':
            ruby_stdlib = {'json', 'net', 'uri', 'time', 'date', 'fileutils'}
            return module_path in ruby_stdlib
        
        # For other languages, assume internal unless it looks like a package
        return False

    def _resolve_relative_import(self, file_path: Path, relative_import: str) -> Optional[str]:
        """
        Resolve a relative import to a module name.
        
        Args:
            file_path: File making the import
            relative_import: Relative path (e.g., './utils', '../services/api')
        
        Returns:
            Resolved module name or None
        """
        try:
            # Get directory of current file
            current_dir = file_path.parent
            
            # Resolve the import path
            import_path = (current_dir / relative_import).resolve()
            
            # If it's a file, remove extension
            if import_path.is_file():
                import_path = import_path.with_suffix('')
            
            # Convert to module name relative to repo root
            try:
                rel_path = import_path.relative_to(self.repo_path)
                module_name = str(rel_path).replace(os.sep, '.')
                return module_name
            except ValueError:
                return None
        except Exception:
            return None

    def _analyze_generic_file(self, file_path: Path):
        """
        Generic analysis for languages without specific parsers.
        Creates module entry but doesn't extract detailed dependencies.
        
        Args:
            file_path: Path to source file
        """
        try:
            module_name = self._get_module_name(file_path)
            
            # Create basic module info
            module_info = ModuleInfo(
                name=module_name,
                file_path=str(file_path.relative_to(self.repo_path)),
                is_test=self._is_test_file(file_path)
            )
            
            # Store module
            self.modules[module_name] = module_info
            
        except Exception as e:
            print(f"Warning: Failed to analyze generic file {file_path}: {e}")