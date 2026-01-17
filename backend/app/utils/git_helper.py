"""Git repository helper for cloning and managing remote repositories."""
import os
import shutil
import tempfile
from typing import Tuple
from pathlib import Path
import git
import re


def is_github_url(repo_path: str) -> bool:
    """Check if the provided path is a GitHub URL."""
    github_patterns = [
        r'^https?://github\.com/[\w\-]+/[\w\-]+/?.*$',
        r'^git@github\.com:[\w\-]+/[\w\-]+\.git$',
        r'^github\.com/[\w\-]+/[\w\-]+/?.*$'
    ]
    return any(re.match(pattern, repo_path, re.IGNORECASE) for pattern in github_patterns)


def normalize_github_url(url: str) -> str:
    """Normalize various GitHub URL formats to HTTPS clone URL."""
    # Remove trailing slashes
    url = url.rstrip('/')
    
    # Handle SSH format (git@github.com:user/repo.git)
    if url.startswith('git@'):
        match = re.match(r'git@github\.com:([\w\-]+)/([\w\-]+)(?:\.git)?', url)
        if match:
            user, repo = match.groups()
            return f'https://github.com/{user}/{repo}.git'
    
    # Handle short format (github.com/user/repo)
    if url.startswith('github.com/'):
        url = 'https://' + url
    
    # Ensure .git extension
    if not url.endswith('.git'):
        url += '.git'
    
    return url


def clone_repository(repo_url: str) -> Tuple[str, bool]:
    """
    Clone a GitHub repository to a temporary directory.
    
    Returns:
        Tuple[str, bool]: (local_path, is_temporary)
    """
    # Normalize the URL
    clone_url = normalize_github_url(repo_url)
    
    # Create a temporary directory
    temp_dir = tempfile.mkdtemp(prefix='layered_analysis_')
    
    try:
        print(f"Cloning repository: {clone_url}")
        print(f"This may take a moment for large repositories...")
        
        # Clone with timeout and progress - shallow clone for speed
        git.Repo.clone_from(
            clone_url, 
            temp_dir, 
            depth=1,  # Shallow clone
            single_branch=True,  # Only main branch
            progress=None  # Disable progress output to avoid hanging
        )
        
        print(f"Repository cloned to: {temp_dir}")
        return temp_dir, True
    except git.GitCommandError as e:
        # Clean up on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise Exception(f"Failed to clone repository: {str(e)}. The repository may be private, too large, or the URL is incorrect.")
    except Exception as e:
        # Clean up on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise Exception(f"Failed to clone repository: {str(e)}")


def cleanup_temp_directory(directory: str):
    """Remove a temporary directory."""
    try:
        if os.path.exists(directory):
            shutil.rmtree(directory, ignore_errors=True)
            print(f"Cleaned up temporary directory: {directory}")
    except Exception as e:
        print(f"Warning: Failed to clean up directory {directory}: {str(e)}")


def prepare_repository(repo_path: str) -> Tuple[str, bool]:
    """
    Prepare a repository for analysis.
    
    If repo_path is a GitHub URL, clone it to a temp directory.
    If it's a local path, use it directly.
    
    Returns:
        Tuple[str, bool]: (local_path, is_temporary)
    """
    if is_github_url(repo_path):
        return clone_repository(repo_path)
    else:
        # It's a local path
        if not os.path.exists(repo_path):
            raise Exception(f"Directory not found: {repo_path}")
        return repo_path, False
